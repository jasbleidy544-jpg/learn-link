
ALTER TABLE public.actividades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades_estudiantes DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='actividades' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.actividades', pol.policyname);
  END LOOP;
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='actividades_estudiantes' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.actividades_estudiantes', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actividades_estudiantes ENABLE ROW LEVEL SECURITY;

-- Helper to check student assignment without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.student_has_actividad(_actividad_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.actividades_estudiantes
    WHERE actividad_id = _actividad_id AND estudiante_id = _user_id
  )
$$;

-- TABLA ACTIVIDADES (simple, no cross-reference)
CREATE POLICY "actividades_docente_select" ON public.actividades
  FOR SELECT TO authenticated USING (auth.uid() = docente_id);

CREATE POLICY "actividades_docente_insert" ON public.actividades
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = docente_id);

CREATE POLICY "actividades_docente_update" ON public.actividades
  FOR UPDATE TO authenticated USING (auth.uid() = docente_id);

CREATE POLICY "actividades_docente_delete" ON public.actividades
  FOR DELETE TO authenticated USING (auth.uid() = docente_id);

-- Student can read activities assigned to them (via security definer, no recursion)
CREATE POLICY "actividades_estudiante_select" ON public.actividades
  FOR SELECT TO authenticated
  USING (public.student_has_actividad(id, auth.uid()));

-- TABLA ACTIVIDADES_ESTUDIANTES
CREATE POLICY "act_est_estudiante_select" ON public.actividades_estudiantes
  FOR SELECT TO authenticated USING (auth.uid() = estudiante_id);

CREATE POLICY "act_est_docente_select" ON public.actividades_estudiantes
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.actividades a WHERE a.id = actividad_id AND a.docente_id = auth.uid())
  );

CREATE POLICY "act_est_insert" ON public.actividades_estudiantes
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.actividades a WHERE a.id = actividad_id AND a.docente_id = auth.uid())
  );

CREATE POLICY "act_est_update" ON public.actividades_estudiantes
  FOR UPDATE TO authenticated USING (auth.uid() = estudiante_id);

CREATE POLICY "act_est_docente_delete" ON public.actividades_estudiantes
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.actividades a WHERE a.id = actividad_id AND a.docente_id = auth.uid())
  );
