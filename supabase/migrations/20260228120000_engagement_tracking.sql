-- ============================================================
-- 1a. Fix session_engagement table
-- ============================================================

-- Add unique constraint required for upsert
ALTER TABLE public.session_engagement
  ADD CONSTRAINT session_engagement_session_student_unique
  UNIQUE (session_id, student_id);

-- Add new columns
ALTER TABLE public.session_engagement
  ADD COLUMN IF NOT EXISTS student_name text,
  ADD COLUMN IF NOT EXISTS attention_score real DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================
-- 1b. Create engagement_events table (event log)
-- ============================================================

CREATE TABLE public.engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  event_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_engagement_events_session
  ON public.engagement_events(session_id);
CREATE INDEX idx_engagement_events_session_student
  ON public.engagement_events(session_id, student_id);
CREATE INDEX idx_engagement_events_session_type
  ON public.engagement_events(session_id, event_type);
CREATE INDEX idx_engagement_events_session_created
  ON public.engagement_events(session_id, created_at);

-- ============================================================
-- RLS for engagement_events
-- ============================================================

ALTER TABLE public.engagement_events ENABLE ROW LEVEL SECURITY;

-- Students can insert their own events
CREATE POLICY "Students insert own events"
  ON public.engagement_events FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can read their own events
CREATE POLICY "Students read own events"
  ON public.engagement_events FOR SELECT
  USING (auth.uid() = student_id);

-- Teachers can read events for their sessions
CREATE POLICY "Teachers read session events"
  ON public.engagement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = engagement_events.session_id
        AND s.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- RLS fix for session_engagement: students can upsert their own rows
-- ============================================================

-- Allow students to insert their own engagement row
CREATE POLICY "Students insert own engagement"
  ON public.session_engagement FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Allow students to update their own engagement row
CREATE POLICY "Students update own engagement"
  ON public.session_engagement FOR UPDATE
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- Allow students to read their own engagement
CREATE POLICY "Students read own engagement"
  ON public.session_engagement FOR SELECT
  USING (auth.uid() = student_id);

-- Allow teachers to read engagement for their sessions
CREATE POLICY "Teachers read session engagement"
  ON public.session_engagement FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = session_engagement.session_id
        AND s.teacher_id = auth.uid()
    )
  );
