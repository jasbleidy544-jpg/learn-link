ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS diagnostico_descripcion text,
  ADD COLUMN IF NOT EXISTS diagnostico_necesidad text,
  ADD COLUMN IF NOT EXISTS diagnostico_preocupacion text,
  ADD COLUMN IF NOT EXISTS diagnostico_intereses text[],
  ADD COLUMN IF NOT EXISTS grado text,
  ADD COLUMN IF NOT EXISTS onboarding_paso_actual integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completado boolean NOT NULL DEFAULT false;