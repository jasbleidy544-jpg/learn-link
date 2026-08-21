
CREATE TABLE public.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  materia text NOT NULL,
  tema text,
  dificultad text NOT NULL CHECK (dificultad IN ('basico','intermedio','avanzado')),
  preguntas jsonb NOT NULL DEFAULT '[]'::jsonb,
  num_preguntas integer NOT NULL DEFAULT 5,
  docente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  docente_nombre text,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  estado text NOT NULL DEFAULT 'activa',
  creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.actividades_estudiantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id uuid NOT NULL REFERENCES public.actividades(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completada boolean NOT NULL DEFAULT false,
  puntaje integer,
  fecha_realizacion timestamptz,
  respuestas jsonb,
  enviada_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (actividad_id, estudiante_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.actividades TO authenticated;
GRANT ALL ON public.actividades TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.actividades_estudiantes TO authenticated;
GRANT ALL ON public.actividades_estudiantes TO service_role;

ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades_estudiantes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "docente ve sus actividades" ON public.actividades
  FOR SELECT TO authenticated USING (auth.uid() = docente_id);
CREATE POLICY "docente crea actividades" ON public.actividades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = docente_id);
CREATE POLICY "docente actualiza sus actividades" ON public.actividades
  FOR UPDATE TO authenticated USING (auth.uid() = docente_id);
CREATE POLICY "docente elimina sus actividades" ON public.actividades
  FOR DELETE TO authenticated USING (auth.uid() = docente_id);
CREATE POLICY "estudiante ve actividades asignadas" ON public.actividades
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.actividades_estudiantes ae
      WHERE ae.actividad_id = actividades.id AND ae.estudiante_id = auth.uid()
    )
  );

CREATE POLICY "estudiante ve sus asignaciones" ON public.actividades_estudiantes
  FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);
CREATE POLICY "docente ve asignaciones de sus actividades" ON public.actividades_estudiantes
  FOR SELECT TO authenticated USING (
    actividad_id IN (SELECT id FROM public.actividades WHERE docente_id = auth.uid())
  );
CREATE POLICY "docente inserta asignaciones" ON public.actividades_estudiantes
  FOR INSERT TO authenticated WITH CHECK (
    actividad_id IN (SELECT id FROM public.actividades WHERE docente_id = auth.uid())
  );
CREATE POLICY "estudiante actualiza su asignacion" ON public.actividades_estudiantes
  FOR UPDATE TO authenticated USING (auth.uid() = estudiante_id);
CREATE POLICY "docente elimina asignaciones" ON public.actividades_estudiantes
  FOR DELETE TO authenticated USING (
    actividad_id IN (SELECT id FROM public.actividades WHERE docente_id = auth.uid())
  );

CREATE INDEX idx_actividades_docente ON public.actividades(docente_id);
CREATE INDEX idx_ae_estudiante ON public.actividades_estudiantes(estudiante_id);
CREATE INDEX idx_ae_actividad ON public.actividades_estudiantes(actividad_id);
