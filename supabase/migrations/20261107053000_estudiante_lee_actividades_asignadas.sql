-- El estudiante podía ver sus filas en "actividades_estudiantes" (la
-- asignación), pero no la tabla "actividades" (título, materia, preguntas).
-- Como el panel del estudiante hace un join embebido de PostgREST entre
-- ambas tablas, sin esta política la parte "actividades" del join volvía
-- null por RLS y la fila completa se descartaba en el cliente, haciendo
-- parecer que la actividad nunca se envió.

CREATE POLICY "Estudiante ve actividades que le fueron asignadas"
ON public.actividades FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.actividades_estudiantes ae
    WHERE ae.actividad_id = actividades.id
      AND ae.estudiante_id = auth.uid()
  )
);
