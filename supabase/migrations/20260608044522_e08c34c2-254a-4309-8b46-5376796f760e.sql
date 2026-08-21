ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS assigned_teacher_id uuid;
CREATE INDEX IF NOT EXISTS idx_profiles_assigned_teacher_id ON public.profiles(assigned_teacher_id);