
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS recordatorio_24h boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recordatorio_1h boolean NOT NULL DEFAULT false;

-- Allow students (the meeting participant) to update only their own meetings' reminder flags
DROP POLICY IF EXISTS "students update reminder flags" ON public.meetings;
CREATE POLICY "students update reminder flags"
ON public.meetings
FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

-- Allow the system (service role) to insert notifications from edge function
DROP POLICY IF EXISTS "service insert notifications" ON public.student_notifications;
CREATE POLICY "service insert notifications"
ON public.student_notifications
FOR INSERT
TO service_role
WITH CHECK (true);
