
CREATE TABLE public.subject_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  nivel text NOT NULL DEFAULT 'Básico',
  temas_fuertes jsonb NOT NULL DEFAULT '[]'::jsonb,
  temas_a_reforzar jsonb NOT NULL DEFAULT '[]'::jsonb,
  perfil text,
  mensaje_motivacional text,
  camino jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_level integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_journeys TO authenticated;
GRANT ALL ON public.subject_journeys TO service_role;

ALTER TABLE public.subject_journeys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own journeys" ON public.subject_journeys
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers read student journeys" ON public.subject_journeys
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND user_id IN (SELECT p.id FROM profiles p WHERE p.institution = get_user_institution(auth.uid()))
  );

CREATE POLICY "Institution owner reads journeys" ON public.subject_journeys
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT p.id FROM profiles p
      JOIN institutions i ON i.id = p.institution_id
      WHERE i.owner_id = auth.uid()
    )
  );

CREATE POLICY "super_admin all journeys" ON public.subject_journeys
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));

CREATE TRIGGER update_subject_journeys_updated_at
  BEFORE UPDATE ON public.subject_journeys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.subject_diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  cuestionario jsonb NOT NULL DEFAULT '{}'::jsonb,
  ejercicios jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_diagnostics TO authenticated;
GRANT ALL ON public.subject_diagnostics TO service_role;

ALTER TABLE public.subject_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own subject diagnostics" ON public.subject_diagnostics
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers read subject diagnostics" ON public.subject_diagnostics
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND user_id IN (SELECT p.id FROM profiles p WHERE p.institution = get_user_institution(auth.uid()))
  );

CREATE POLICY "super_admin all subject diagnostics" ON public.subject_diagnostics
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));


CREATE TABLE public.subject_level_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  level_index integer NOT NULL,
  score jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject, level_index)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_level_progress TO authenticated;
GRANT ALL ON public.subject_level_progress TO service_role;

ALTER TABLE public.subject_level_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own progress" ON public.subject_level_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers read student progress" ON public.subject_level_progress
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'teacher'::app_role)
    AND user_id IN (SELECT p.id FROM profiles p WHERE p.institution = get_user_institution(auth.uid()))
  );

CREATE POLICY "super_admin all level progress" ON public.subject_level_progress
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid())) WITH CHECK (is_super_admin(auth.uid()));
