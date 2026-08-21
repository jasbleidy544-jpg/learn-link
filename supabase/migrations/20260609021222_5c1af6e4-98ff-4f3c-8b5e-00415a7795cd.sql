
CREATE TABLE public.asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estudiante_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  docente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (estudiante_id, docente_id)
);

CREATE INDEX idx_asignaciones_docente ON public.asignaciones(docente_id);
CREATE INDEX idx_asignaciones_estudiante ON public.asignaciones(estudiante_id);
CREATE INDEX idx_asignaciones_institution ON public.asignaciones(institution_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.asignaciones TO authenticated;
GRANT ALL ON public.asignaciones TO service_role;

ALTER TABLE public.asignaciones ENABLE ROW LEVEL SECURITY;

-- Rector (institution role) de la misma institución puede gestionar
CREATE POLICY "Institution can manage own assignments"
ON public.asignaciones FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'institution')
  AND institution_id IN (SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid())
)
WITH CHECK (
  public.has_role(auth.uid(), 'institution')
  AND institution_id IN (SELECT p.institution_id FROM public.profiles p WHERE p.id = auth.uid())
);

-- Super admin acceso total
CREATE POLICY "Super admin full access asignaciones"
ON public.asignaciones FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Estudiantes ven sus asignaciones
CREATE POLICY "Students view own assignments"
ON public.asignaciones FOR SELECT
TO authenticated
USING (estudiante_id = auth.uid());

-- Docentes ven sus asignaciones
CREATE POLICY "Teachers view own assignments"
ON public.asignaciones FOR SELECT
TO authenticated
USING (docente_id = auth.uid());
