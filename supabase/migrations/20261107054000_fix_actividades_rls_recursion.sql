-- Corrige "infinite recursion detected in policy for relation actividades":
-- la política nueva en "actividades" (20261107053000) consultaba
-- "actividades_estudiantes", y esa tabla tiene una política
-- ("Docente ve asignaciones") que a su vez consulta "actividades"
-- -> ciclo A->B->A. Se rompe el ciclo con una función SECURITY DEFINER
-- (mismo patrón que get_user_role / is_my_assigned_student), que no
-- vuelve a aplicar RLS sobre sí misma.

CREATE OR REPLACE FUNCTION public.is_activity_assigned_to_me(_activity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.actividades_estudiantes
    WHERE actividad_id = _activity_id
      AND estudiante_id = auth.uid()
  );
$function$;

DROP POLICY IF EXISTS "Estudiante ve actividades que le fueron asignadas" ON public.actividades;

CREATE POLICY "Estudiante ve actividades que le fueron asignadas"
ON public.actividades FOR SELECT
USING (public.is_activity_assigned_to_me(id));
