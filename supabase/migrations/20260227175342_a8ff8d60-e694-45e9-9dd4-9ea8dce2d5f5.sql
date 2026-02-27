
-- 1. Presentations table
CREATE TABLE public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  file_path text NOT NULL,
  slide_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert own presentations"
  ON public.presentations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can read own presentations"
  ON public.presentations FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own presentations"
  ON public.presentations FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete own presentations"
  ON public.presentations FOR DELETE TO authenticated
  USING (auth.uid() = teacher_id);

-- 2. Sessions table (before slides, since slides RLS references sessions)
CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  presentation_id uuid REFERENCES public.presentations(id) ON DELETE SET NULL,
  room_code text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can insert own sessions"
  ON public.sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can read own sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update own sessions"
  ON public.sessions FOR UPDATE TO authenticated
  USING (auth.uid() = teacher_id);

CREATE POLICY "Students can read active sessions"
  ON public.sessions FOR SELECT TO authenticated
  USING (status = 'active');

-- 3. Presentation slides table
CREATE TABLE public.presentation_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id uuid NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
  slide_number integer NOT NULL,
  image_path text,
  content_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.presentation_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Slides readable by presentation owner"
  ON public.presentation_slides FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.presentations p WHERE p.id = presentation_id AND p.teacher_id = auth.uid())
  );

CREATE POLICY "Slides readable by active session participants"
  ON public.presentation_slides FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.presentation_id = presentation_slides.presentation_id AND s.status IN ('active', 'ended'))
  );

CREATE POLICY "Teachers can insert slides for own presentations"
  ON public.presentation_slides FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.presentations p WHERE p.id = presentation_id AND p.teacher_id = auth.uid())
  );

-- 4. Session engagement table
CREATE TABLE public.session_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  questions_answered integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  avg_response_time real,
  reactions_count integer NOT NULL DEFAULT 0,
  buddy_interactions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.session_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can insert own engagement"
  ON public.session_engagement FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own engagement"
  ON public.session_engagement FOR UPDATE TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Students can read own engagement"
  ON public.session_engagement FOR SELECT TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can read engagement for own sessions"
  ON public.session_engagement FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND s.teacher_id = auth.uid())
  );

-- 5. Updated_at trigger function and trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON public.presentations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('presentations', 'presentations', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('slide-images', 'slide-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Teachers upload presentations" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers read own presentations" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Teachers delete own presentations" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read slide images" ON storage.objects FOR SELECT USING (bucket_id = 'slide-images');
CREATE POLICY "Teachers upload slide images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'slide-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Add avatar_url to profiles
ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- 8. Students can read presentations linked to active sessions
CREATE POLICY "Students read presentations via active sessions"
  ON public.presentations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sessions s WHERE s.presentation_id = id AND s.status IN ('active', 'ended'))
  );

-- 9. Indexes
CREATE INDEX idx_sessions_room_code ON public.sessions (room_code);
CREATE INDEX idx_sessions_teacher_id ON public.sessions (teacher_id);
CREATE INDEX idx_presentations_teacher_id ON public.presentations (teacher_id);
