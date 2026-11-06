-- Corrige "infinite recursion detected in policy for relation asignaciones":
-- la política "Teachers read co-assignments of own students" (migración
-- 20261106030000) consultaba la misma tabla "asignaciones" dentro de su
-- propia condición USING, lo que hacía que Postgres volviera a evaluar
-- las políticas de "asignaciones" indefinidamente.
--
-- Se reemplaza por una función SECURITY DEFINER (mismo patrón que
-- get_user_role), que se ejecuta sin aplicar RLS sobre sí misma.

CREATE OR REPLACE FUNCTION public.is_my_assigned_student(_student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE estudiante_id = _student_id
      AND docente_id = auth.uid()
  );
$function$;

DROP POLICY IF EXISTS "Teachers read co-assignments of own students" ON public.asignaciones;

CREATE POLICY "Teachers read co-assignments of own students"
ON public.asignaciones FOR SELECT
USING (public.is_my_assigned_student(estudiante_id));
