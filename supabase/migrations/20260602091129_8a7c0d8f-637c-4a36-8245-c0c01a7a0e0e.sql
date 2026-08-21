
-- 1) student_risk table
CREATE TABLE public.student_risk (
  user_id uuid PRIMARY KEY,
  institution_id uuid,
  risk_level text NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
  risk_score numeric NOT NULL DEFAULT 0,
  ai_note text,
  factors jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.student_risk TO authenticated;
GRANT ALL ON public.student_risk TO service_role;

ALTER TABLE public.student_risk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student reads own risk"
ON public.student_risk FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "teacher reads institution risk"
ON public.student_risk FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND user_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

CREATE POLICY "institution owner reads risk"
ON public.student_risk FOR SELECT TO authenticated
USING (
  institution_id IN (
    SELECT id FROM public.institutions WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "super_admin all risk"
ON public.student_risk FOR ALL TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE INDEX idx_student_risk_institution ON public.student_risk(institution_id);

-- 2) last_sign_in_at on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_sign_in_at timestamptz;

-- 3) Extend handle_new_user to persist institution_id and institution name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _inst_id uuid;
  _inst_name text;
BEGIN
  _inst_id := NULLIF(NEW.raw_user_meta_data->>'institution_id','')::uuid;
  _inst_name := NULLIF(NEW.raw_user_meta_data->>'institution','');

  INSERT INTO public.profiles (id, full_name, email, institution_id, institution)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    _inst_id,
    _inst_name
  );

  IF NEW.raw_user_meta_data->>'user_type' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'user_type')::app_role);
  END IF;

  RETURN NEW;
END;
$function$;

-- 4) Touch last_sign_in_at RPC (callable by the authenticated user only for themselves)
CREATE OR REPLACE FUNCTION public.touch_last_sign_in()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles SET last_sign_in_at = now() WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_sign_in() TO authenticated;

-- 5) Realtime
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.subject_journeys REPLICA IDENTITY FULL;
ALTER TABLE public.subject_level_progress REPLICA IDENTITY FULL;
ALTER TABLE public.student_risk REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.subject_journeys; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.subject_level_progress; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.student_risk; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
