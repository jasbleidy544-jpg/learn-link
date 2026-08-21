ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_type TEXT,
  ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID;

CREATE INDEX IF NOT EXISTS idx_profiles_assigned_teacher ON public.profiles(assigned_teacher_id);

CREATE OR REPLACE FUNCTION public.is_admin_teacher(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.teacher_type = 'admin'
      AND public.has_role(_user_id, 'teacher'::app_role)
  )
$$;

DROP POLICY IF EXISTS "Admin teachers update institution profiles" ON public.profiles;
CREATE POLICY "Admin teachers update institution profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (
  public.is_admin_teacher(auth.uid())
  AND institution = public.get_user_institution(auth.uid())
);

DROP POLICY IF EXISTS "Retired teachers read assigned students" ON public.profiles;
CREATE POLICY "Retired teachers read assigned students"
ON public.profiles FOR SELECT TO authenticated
USING (assigned_teacher_id = auth.uid());
