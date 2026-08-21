
-- 1) Add retired teacher code column to institutions
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS retired_teacher_code text UNIQUE;

-- 2) Update generator to avoid collisions with the new column too
CREATE OR REPLACE FUNCTION public.generate_institution_code(prefix text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
      WHERE student_code = candidate
         OR teacher_code = candidate
         OR retired_teacher_code = candidate
    ) THEN
      RETURN candidate;
    END IF;
    attempts := attempts + 1;
    IF attempts > 50 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;
  END LOOP;
END;
$function$;

-- 3) Update the BEFORE INSERT trigger to also fill the retired code
CREATE OR REPLACE FUNCTION public.fill_institution_codes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.student_code IS NULL THEN
    NEW.student_code := public.generate_institution_code('EST');
  END IF;
  IF NEW.teacher_code IS NULL THEN
    NEW.teacher_code := public.generate_institution_code('DOC');
  END IF;
  IF NEW.retired_teacher_code IS NULL THEN
    NEW.retired_teacher_code := public.generate_institution_code('JUB');
  END IF;
  RETURN NEW;
END;
$function$;

-- 4) Backfill: every existing institution without a retired code gets one
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT id FROM public.institutions WHERE retired_teacher_code IS NULL LOOP
    UPDATE public.institutions
       SET retired_teacher_code = public.generate_institution_code('JUB')
     WHERE id = r.id;
  END LOOP;
END $$;

-- 5) Update validator to also recognize the retired code
CREATE OR REPLACE FUNCTION public.validate_institution_code(_code text)
 RETURNS TABLE(id uuid, name text, code_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT i.id, i.name,
    CASE WHEN i.student_code = _code THEN 'student'
         WHEN i.teacher_code = _code THEN 'teacher'
         WHEN i.retired_teacher_code = _code THEN 'retired_teacher'
    END AS code_type
  FROM public.institutions i
  WHERE (i.student_code = _code OR i.teacher_code = _code OR i.retired_teacher_code = _code)
    AND i.status IN ('approved','pending')
  LIMIT 1;
$function$;

-- 6) regenerate_institution_code: support 'retired_teacher'
CREATE OR REPLACE FUNCTION public.regenerate_institution_code(_institution_id uuid, _which text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  ELSIF _which = 'retired_teacher' THEN
    new_code := public.generate_institution_code('JUB');
    UPDATE public.institutions SET retired_teacher_code = new_code WHERE id = _institution_id;
  ELSE
    RAISE EXCEPTION 'Invalid code type';
  END IF;
  RETURN new_code;
END;
$function$;

-- 7) Solicitudes table for retired-teacher assignment requests
CREATE TABLE IF NOT EXISTS public.solicitudes_jubilado (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  docente_jubilado_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptada','rechazada')),
  creado_por uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  creado_en timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  visto boolean NOT NULL DEFAULT false,
  UNIQUE (docente_jubilado_id, estudiante_id, institution_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitudes_jubilado TO authenticated;
GRANT ALL ON public.solicitudes_jubilado TO service_role;

ALTER TABLE public.solicitudes_jubilado ENABLE ROW LEVEL SECURITY;

-- Retired teacher reads own requests
CREATE POLICY "jubilado_ver_solicitudes"
ON public.solicitudes_jubilado FOR SELECT
TO authenticated
USING (auth.uid() = docente_jubilado_id);

-- Institution owner reads requests of own institution
CREATE POLICY "institucion_ver_solicitudes"
ON public.solicitudes_jubilado FOR SELECT
TO authenticated
USING (
  institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
);

-- Institution owner inserts requests for own institution
CREATE POLICY "institucion_insertar_solicitudes"
ON public.solicitudes_jubilado FOR INSERT
TO authenticated
WITH CHECK (
  institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid())
);

-- Retired teacher updates state of own requests
CREATE POLICY "jubilado_actualizar_estado"
ON public.solicitudes_jubilado FOR UPDATE
TO authenticated
USING (auth.uid() = docente_jubilado_id)
WITH CHECK (auth.uid() = docente_jubilado_id);

-- Institution owner can update too (mark seen, cancel)
CREATE POLICY "institucion_actualizar_solicitudes"
ON public.solicitudes_jubilado FOR UPDATE
TO authenticated
USING (institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()))
WITH CHECK (institution_id IN (SELECT id FROM public.institutions WHERE owner_id = auth.uid()));

-- Trigger to maintain updated_at
CREATE TRIGGER trg_solicitudes_jubilado_upd
BEFORE UPDATE ON public.solicitudes_jubilado
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitudes_jubilado;

-- Allow retired teachers to read profiles of students that have a pending or accepted request to them
CREATE POLICY "jubilado_lee_perfiles_estudiantes_solicitados"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes_jubilado s
    WHERE s.estudiante_id = profiles.id
      AND s.docente_jubilado_id = auth.uid()
  )
);
