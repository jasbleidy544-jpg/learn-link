-- Direct 1:1 chat between teacher (active or retired) and student
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants read chat" ON public.chat_messages;
CREATE POLICY "Participants read chat"
ON public.chat_messages FOR SELECT TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Authorized users send chat" ON public.chat_messages;
CREATE POLICY "Authorized users send chat"
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND recipient_id <> auth.uid()
  AND NOT public.is_admin_teacher(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles ps, public.profiles pr
      WHERE ps.id = auth.uid() AND pr.id = recipient_id
        AND ps.institution IS NOT NULL
        AND ps.institution = pr.institution
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE (p.id = recipient_id AND p.assigned_teacher_id = auth.uid())
         OR (p.id = auth.uid() AND p.assigned_teacher_id = recipient_id)
    )
  )
);

DROP POLICY IF EXISTS "Recipients update read state" ON public.chat_messages;
CREATE POLICY "Recipients update read state"
ON public.chat_messages FOR UPDATE TO authenticated
USING (recipient_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_chat_messages_pair
  ON public.chat_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient
  ON public.chat_messages(recipient_id, created_at DESC);

ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages';
  END IF;
END$$;

-- Volunteers (retired teachers) can also schedule sessions for assigned students
DROP POLICY IF EXISTS "Volunteers schedule for assigned students" ON public.mentorship_sessions;
CREATE POLICY "Volunteers schedule for assigned students"
ON public.mentorship_sessions FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = student_id AND p.assigned_teacher_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Volunteers send notifications to assigned" ON public.student_notifications;
CREATE POLICY "Volunteers send notifications to assigned"
ON public.student_notifications FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = student_id AND p.assigned_teacher_id = auth.uid()
  )
);
