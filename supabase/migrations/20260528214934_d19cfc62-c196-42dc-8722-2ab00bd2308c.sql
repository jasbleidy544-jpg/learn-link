-- Backfill missing codes
UPDATE public.institutions
SET student_code = COALESCE(student_code, public.generate_institution_code('EST')),
    teacher_code = COALESCE(teacher_code, public.generate_institution_code('DOC'));

-- Ensure uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS institutions_student_code_key ON public.institutions(student_code);
CREATE UNIQUE INDEX IF NOT EXISTS institutions_teacher_code_key ON public.institutions(teacher_code);

-- Trigger to auto-generate codes on new institutions
DROP TRIGGER IF EXISTS trg_fill_institution_codes ON public.institutions;
CREATE TRIGGER trg_fill_institution_codes
BEFORE INSERT ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.fill_institution_codes();

-- Allow institution owners to read user_roles of their members (needed to filter students vs teachers in panel)
DROP POLICY IF EXISTS "institution owner reads member roles" ON public.user_roles;
CREATE POLICY "institution owner reads member roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id IN (
  SELECT p.id FROM public.profiles p
  JOIN public.institutions i ON i.id = p.institution_id
  WHERE i.owner_id = auth.uid()
));