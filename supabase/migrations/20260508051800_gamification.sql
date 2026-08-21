CREATE TABLE IF NOT EXISTS public.student_gamification (
  user_id uuid PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  energy integer NOT NULL DEFAULT 100,
  level_name text NOT NULL DEFAULT 'Explorador',
  skill_critical integer NOT NULL DEFAULT 0,
  skill_researcher integer NOT NULL DEFAULT 0,
  skill_creative integer NOT NULL DEFAULT 0,
  last_activity timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students read own gamification" ON public.student_gamification FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Students insert own gamification" ON public.student_gamification FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Students update own gamification" ON public.student_gamification FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Teachers read students gamification" ON public.student_gamification FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'::app_role) AND user_id IN (SELECT p.id FROM public.profiles p WHERE p.institution = public.get_user_institution(auth.uid())));

CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  challenge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 10,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own challenges" ON public.daily_challenges FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.mentorship_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_name text,
  scheduled_at timestamptz NOT NULL,
  topic text,
  meet_link text,
  status text NOT NULL DEFAULT 'scheduled',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mentorship_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students manage own sessions" ON public.mentorship_sessions FOR ALL TO authenticated USING (student_id = auth.uid()) WITH CHECK (student_id = auth.uid());
CREATE POLICY "Teachers view institution sessions" ON public.mentorship_sessions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT p.id FROM public.profiles p WHERE p.institution = public.get_user_institution(auth.uid())));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_type text;
