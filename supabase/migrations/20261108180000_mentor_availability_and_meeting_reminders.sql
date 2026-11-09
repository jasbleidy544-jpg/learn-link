-- Fase E: Sistema de Mentorías con Agenda y Videollamadas
-- Bloques de disponibilidad semanal que un docente/jubilado marca para que
-- los estudiantes solo puedan agendar dentro de esas franjas.
CREATE TABLE IF NOT EXISTS public.mentor_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo .. 6=sábado
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT mentor_availability_valid_range CHECK (end_time > start_time)
);

ALTER TABLE public.mentor_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mentor administra su disponibilidad"
ON public.mentor_availability FOR ALL
USING (auth.uid() = mentor_id)
WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Cualquier autenticado ve disponibilidad de mentores"
ON public.mentor_availability FOR SELECT
USING (auth.role() = 'authenticated');

-- Columna para no duplicar el recordatorio de "faltan 15 minutos".
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS recordatorio_15min boolean NOT NULL DEFAULT false;
