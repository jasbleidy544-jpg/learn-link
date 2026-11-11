-- Error reportado: "new row violates row-level security policy for table
-- meetings" al agendar desde el panel de estudiante. Causa: la única
-- política de INSERT en "meetings" exigía rol teacher/institution/
-- super_admin, así que un estudiante nunca pudo insertar una fila.
--
-- Aprovechamos para implementar lo que pidió Diego: la cita que agenda el
-- estudiante no debe quedar confirmada de una vez, el docente/mentor debe
-- poder aceptarla o rechazarla. Para eso agregamos el estado "pending".

ALTER TABLE public.meetings DROP CONSTRAINT IF EXISTS meetings_status_check;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_status_check
  CHECK (status = ANY (ARRAY['pending'::text, 'scheduled'::text, 'completed'::text, 'cancelled'::text, 'rescheduled'::text]));

CREATE POLICY "Estudiante solicita reunion con su mentor asignado"
ON public.meetings FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.asignaciones a
    WHERE a.estudiante_id = auth.uid() AND a.docente_id = meetings.host_id
  )
);
