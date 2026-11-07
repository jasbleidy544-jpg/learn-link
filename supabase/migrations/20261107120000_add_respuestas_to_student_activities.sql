-- Igual que con actividades_estudiantes: para poder mostrar un historial de
-- retos de IA con gráfica de aciertos/fallos y justificación por pregunta,
-- necesitamos guardar qué opción escogió el estudiante en cada pregunta.
-- Antes solo se intentaba insertar cada respuesta en "activity_responses",
-- una tabla que nunca existió (insert silencioso que nunca se guardaba).

ALTER TABLE public.student_activities
  ADD COLUMN IF NOT EXISTS respuestas jsonb;
