-- Allow teachers to schedule mentorships for their institution's students
ALTER TABLE public.mentorship_sessions
  ADD COLUMN IF NOT EXISTS teacher_id UUID,
  ADD COLUMN IF NOT EXISTS created_by UUID;

CREATE POLICY "Teachers schedule sessions for institution"
ON public.mentorship_sessions FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

CREATE POLICY "Teachers update sessions for institution"
ON public.mentorship_sessions FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

-- Allow teachers to assign ICFES activities to their institution's students
CREATE POLICY "Teachers create activities for institution"
ON public.student_activities FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

-- In-app notifications for students
CREATE TABLE IF NOT EXISTS public.student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  sender_id UUID,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students read own notifications"
ON public.student_notifications FOR SELECT TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Students update own notifications"
ON public.student_notifications FOR UPDATE TO authenticated
USING (student_id = auth.uid());

CREATE POLICY "Teachers send notifications to institution students"
ON public.student_notifications FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

CREATE POLICY "Teachers read notifications they sent"
ON public.student_notifications FOR SELECT TO authenticated
USING (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_student_notifications_student ON public.student_notifications(student_id, created_at DESC);

ALTER PUBLICATION supabase_realtime ADD TABLE public.student_notifications;
ALTER TABLE public.student_notifications REPLICA IDENTITY FULL;
