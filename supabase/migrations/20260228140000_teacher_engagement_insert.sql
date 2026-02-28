-- Teachers can insert engagement_events for sessions they own.
-- Used by the coordinator agent to persist question_dispatch and coordinator_response events.
CREATE POLICY "Teachers insert events for own sessions"
  ON public.engagement_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions s
      WHERE s.id = engagement_events.session_id
        AND s.teacher_id = auth.uid()
    )
  );
