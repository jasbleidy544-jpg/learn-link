CREATE TABLE IF NOT EXISTS public.student_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  area TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'medio',
  title TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 100,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own activities"
ON public.student_activities FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teachers read student activities"
ON public.student_activities FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND student_id IN (
    SELECT p.id FROM public.profiles p
    WHERE p.institution = public.get_user_institution(auth.uid())
  )
);

CREATE TABLE IF NOT EXISTS public.activity_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.student_activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  selected_index INTEGER,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own responses"
ON public.activity_responses FOR ALL
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_student_activities_student ON public.student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_activity_responses_activity ON public.activity_responses(activity_id);
