
-- Add institution_id to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_institution_id ON public.profiles(institution_id);

-- Add code + owner fields to institutions
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS student_code text UNIQUE;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS teacher_code text UNIQUE;
ALTER TABLE public.institutions ADD COLUMN IF NOT EXISTS owner_id uuid;
CREATE INDEX IF NOT EXISTS idx_institutions_owner ON public.institutions(owner_id);

-- Code generator
CREATE OR REPLACE FUNCTION public.generate_institution_code(prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  candidate text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  attempts int := 0;
BEGIN
  LOOP
    candidate := prefix || '-' ||
      lpad((floor(random() * 9000) + 1000)::text, 4, '0') || '-' ||
      substr(chars, floor(random() * length(chars))::int + 1, 1) ||
      substr(chars, floor(random() * length(chars))::int + 1, 1);
    IF NOT EXISTS (
      SELECT 1 FROM public.institutions
      WHERE student_code = candidate OR teacher_code = candidate
    ) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 50 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;
  END LOOP;
END;
$$;

-- Trigger to fill codes on insert
CREATE OR REPLACE FUNCTION public.fill_institution_codes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := public.generate_institution_code('EST');
  END IF;
  IF NEW.teacher_code IS NULL THEN
    NEW.teacher_code := public.generate_institution_code('DOC');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fill_institution_codes ON public.institutions;
CREATE TRIGGER trg_fill_institution_codes
BEFORE INSERT ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.fill_institution_codes();

-- Backfill existing rows
UPDATE public.institutions
SET student_code = COALESCE(student_code, public.generate_institution_code('EST')),
    teacher_code = COALESCE(teacher_code, public.generate_institution_code('DOC'))
WHERE student_code IS NULL OR teacher_code IS NULL;

-- Public RPC: validate code, returns id+name only
CREATE OR REPLACE FUNCTION public.validate_institution_code(_code text)
RETURNS TABLE(id uuid, name text, code_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.name,
    CASE WHEN i.student_code = _code THEN 'student'
         WHEN i.teacher_code = _code THEN 'teacher'
    END AS code_type
  FROM public.institutions i
  WHERE (i.student_code = _code OR i.teacher_code = _code)
    AND i.status IN ('approved','pending')
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.validate_institution_code(text) TO anon, authenticated;

-- Regenerate codes (super_admin only)
CREATE OR REPLACE FUNCTION public.regenerate_institution_code(_institution_id uuid, _which text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super_admin can regenerate codes';
  END IF;
  IF _which = 'student' THEN
    new_code := public.generate_institution_code('EST');
    UPDATE public.institutions SET student_code = new_code WHERE id = _institution_id;
  ELSIF _which = 'teacher' THEN
    new_code := public.generate_institution_code('DOC');
    UPDATE public.institutions SET teacher_code = new_code WHERE id = _institution_id;
  ELSE
    RAISE EXCEPTION 'Invalid code type';
  END IF;
  RETURN new_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.regenerate_institution_code(uuid, text) TO authenticated;

-- RLS: institution owner can read own institution
CREATE POLICY "owner read own institution"
ON public.institutions
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- RLS: anyone authenticated can insert their own institution
CREATE POLICY "owner create institution"
ON public.institutions
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- RLS: owner can update own (but cannot change codes — enforced at app level; super_admin still has full access)
CREATE POLICY "owner update own institution"
ON public.institutions
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- RLS: institution owners can read profiles linked to their institution
CREATE POLICY "institution owner reads linked profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
);
