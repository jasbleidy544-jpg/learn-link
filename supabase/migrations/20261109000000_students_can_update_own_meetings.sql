-- El recordatorio de "15 minutos antes" se dispara desde el lado que tenga
-- la app abierta primero (estudiante o mentor), y ese lado necesita poder
-- marcar meetings.recordatorio_15min = true. Antes solo el host (mentor)
-- podía actualizar la fila, así que si el estudiante era quien tenía la
-- app abierta, el UPDATE fallaba por RLS y nadie recibía el aviso.
CREATE POLICY "Estudiante actualiza su propia reunion"
ON public.meetings FOR UPDATE
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);
