
-- Drop any existing policies on asignaciones
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='asignaciones' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.asignaciones', p.policyname);
  END LOOP;
END $$;

-- SELECT
CREATE POLICY "usuarios pueden ver sus asignaciones"
ON public.asignaciones FOR SELECT
TO authenticated
USING (
  auth.uid() = docente_id OR
  auth.uid() = estudiante_id OR
  auth.uid() = creado_por
);

-- INSERT
CREATE POLICY "rector puede insertar asignaciones"
ON public.asignaciones FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creado_por);

-- DELETE
CREATE POLICY "rector puede eliminar asignaciones"
ON public.asignaciones FOR DELETE
TO authenticated
USING (auth.uid() = creado_por);
