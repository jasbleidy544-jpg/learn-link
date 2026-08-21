
-- Add gating flag to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS diagnostico_completado boolean NOT NULL DEFAULT false;

-- Diagnostic conversations table
CREATE TABLE IF NOT EXISTS public.diagnosticos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  respuestas jsonb NOT NULL DEFAULT '{"emocional":[],"social":[],"academica":[],"motivacion":[],"raw":[]}'::jsonb,
  resultado jsonb,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnosticos TO authenticated;
GRANT ALL ON public.diagnosticos TO service_role;

ALTER TABLE public.diagnosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own diagnosticos"
ON public.diagnosticos FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Teachers read student diagnosticos"
ON public.diagnosticos FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND user_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

CREATE POLICY "Institution owner read diagnosticos"
ON public.diagnosticos FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT p.id FROM public.profiles p
    JOIN public.institutions i ON i.id = p.institution_id
    WHERE i.owner_id = auth.uid()
  )
);

CREATE POLICY "super_admin all diagnosticos"
ON public.diagnosticos FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER diagnosticos_set_updated_at
BEFORE UPDATE ON public.diagnosticos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS diagnosticos_user_id_idx ON public.diagnosticos(user_id);
