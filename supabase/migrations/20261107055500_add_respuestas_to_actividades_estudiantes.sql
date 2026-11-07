-- El estudiante termina una actividad y el cliente intenta guardar sus
-- respuestas (array de índices seleccionados) en "actividades_estudiantes",
-- pero la columna "respuestas" nunca existió en la tabla, causando:
-- "Could not find the 'respuestas' column of 'actividades_estudiantes'
-- in the schema cache" y que el puntaje calculado no se guardara.

ALTER TABLE public.actividades_estudiantes
  ADD COLUMN IF NOT EXISTS respuestas jsonb;
