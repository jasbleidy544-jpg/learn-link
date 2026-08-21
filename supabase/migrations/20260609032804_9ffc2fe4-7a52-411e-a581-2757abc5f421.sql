CREATE TABLE IF NOT EXISTS public.student_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_notifications TO authenticated;
GRANT ALL ON public.student_notifications TO service_role;

ALTER TABLE public.student_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "students_select_own_notif"
ON public.student_notifications FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "students_update_own_notif"
ON public.student_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = student_id);

CREATE POLICY "teachers_insert_notif_assigned"
ON public.student_notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE docente_id = auth.uid() AND estudiante_id = student_notifications.student_id
  )
);

CREATE INDEX IF NOT EXISTS idx_student_notif_student ON public.student_notifications(student_id, created_at DESC);
