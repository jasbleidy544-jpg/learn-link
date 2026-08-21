
-- 1) Add teacher_type to profiles (needed to identify retired teachers reliably)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_type text;

-- 2) Drop dependent functions that reference retired_teacher_code, recreate without it
CREATE OR REPLACE FUNCTION public.validate_institution_code(_code text)
RETURNS TABLE(id uuid, name text, code_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT i.id, i.name,
    CASE WHEN i.student_code = _code THEN 'student'
         WHEN i.teacher_code = _code THEN 'teacher'
    END AS code_type
  FROM public.institutions i
  WHERE (i.student_code = _code OR i.teacher_code = _code)
    AND i.status IN ('approved','pending')
  LIMIT 1;
$function$;

CREATE OR REPLACE FUNCTION public.generate_institution_code(prefix text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.fill_institution_codes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := public.generate_institution_code('EST');
  END IF;
  IF NEW.teacher_code IS NULL THEN
    NEW.teacher_code := public.generate_institution_code('DOC');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.regenerate_institution_code(_institution_id uuid, _which text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE new_code text;
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
$function$;

-- 3) Drop the column
ALTER TABLE public.institutions DROP COLUMN IF EXISTS retired_teacher_code;
