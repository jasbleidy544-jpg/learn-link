-- Vista 360° del estudiante (panel docente)
-- El docente necesita ver, de SUS estudiantes asignados (tabla asignaciones):
--   1) las estadísticas de gamificación (user_stats: xp, nivel, energía, racha)
--   2) el historial completo de mentorías (meetings), no solo las que él mismo agendó
--   3) qué otros docentes/jubilados tienen asignado al mismo estudiante (asignaciones)
-- Estas políticas son adicionales (se evalúan con OR junto a las existentes) y
-- están acotadas estrictamente a la relación docente-estudiante vía "asignaciones".

-- 1) user_stats: el docente lee las stats de sus estudiantes asignados
CREATE POLICY "Teachers read assigned students stats"
ON public.user_stats FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones a
    WHERE a.estudiante_id = user_stats.user_id
      AND a.docente_id = auth.uid()
  )
);

-- 2) meetings: el docente lee todas las reuniones (de cualquier mentor)
--    de los estudiantes que tiene asignados
CREATE POLICY "Teachers read assigned students meetings"
ON public.meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones a
    WHERE a.estudiante_id = meetings.student_id
      AND a.docente_id = auth.uid()
  )
);

-- 3) asignaciones: el docente ve también las asignaciones de otros docentes
--    para los mismos estudiantes que él tiene asignados (para listar
--    "docentes asignados" en la vista 360°)
CREATE POLICY "Teachers read co-assignments of own students"
ON public.asignaciones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.asignaciones a2
    WHERE a2.estudiante_id = asignaciones.estudiante_id
      AND a2.docente_id = auth.uid()
  )
);
