CREATE POLICY "institution_owners_read_retired_teachers"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  teacher_type = 'retired'
  AND EXISTS (
    SELECT 1 FROM public.institutions i WHERE i.owner_id = auth.uid()
  )
);