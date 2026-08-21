ALTER TABLE public.daily_challenges ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.daily_challenges ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;
