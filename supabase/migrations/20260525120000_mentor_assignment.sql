ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS teacher_type text,
  ADD COLUMN IF NOT EXISTS assigned_teacher_id uuid,
  ADD COLUMN IF NOT EXISTS mentor_id uuid,
  ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.mentor_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  mentor_id uuid NOT NULL,
  institution_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (student_id, mentor_id)
);
ALTER TABLE public.mentor_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor reads own requests" ON public.mentor_requests;
CREATE POLICY "mentor reads own requests" ON public.mentor_requests
  FOR SELECT TO authenticated USING (mentor_id = auth.uid());
DROP POLICY IF EXISTS "student reads own requests" ON public.mentor_requests;
CREATE POLICY "student reads own requests" ON public.mentor_requests
  FOR SELECT TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "super_admin all mentor_requests" ON public.mentor_requests;
CREATE POLICY "super_admin all mentor_requests" ON public.mentor_requests
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.assign_active_teacher(_student_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inst uuid; v_grade text; v_teacher uuid;
BEGIN
  SELECT institution_id, grade INTO v_inst, v_grade FROM public.profiles WHERE id = _student_id;
  IF v_inst IS NULL THEN RETURN NULL; END IF;
  SELECT t.id INTO v_teacher
  FROM public.profiles t
  WHERE t.teacher_type = 'active'
    AND t.institution_id = v_inst
    AND COALESCE(t.is_available, true) = true
    AND (v_grade IS NULL OR t.grade IS NULL OR t.grade = v_grade)
  ORDER BY (SELECT count(*) FROM public.profiles s WHERE s.assigned_teacher_id = t.id) ASC
  LIMIT 1;
  IF v_teacher IS NOT NULL THEN
    UPDATE public.profiles SET assigned_teacher_id = v_teacher WHERE id = _student_id;
  END IF;
  RETURN v_teacher;
END; $$;

CREATE OR REPLACE FUNCTION public.create_mentor_requests(_student_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_inst uuid; v_count integer := 0;
BEGIN
  SELECT institution_id INTO v_inst FROM public.profiles WHERE id = _student_id;
  IF v_inst IS NULL THEN RETURN 0; END IF;
  INSERT INTO public.mentor_requests (student_id, mentor_id, institution_id, status)
  SELECT _student_id, t.id, v_inst, 'pending'
  FROM public.profiles t
  WHERE t.teacher_type = 'retired'
    AND COALESCE(t.is_available, true) = true
    AND (t.institution_id = v_inst OR t.institution_id IS NULL)
  ON CONFLICT (student_id, mentor_id) DO NOTHING;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END; $$;

CREATE OR REPLACE FUNCTION public.respond_mentor_request(_request_id uuid, _accept boolean)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_student uuid; v_mentor uuid; v_existing uuid;
BEGIN
  SELECT student_id, mentor_id INTO v_student, v_mentor FROM public.mentor_requests WHERE id = _request_id;
  IF v_mentor IS NULL OR v_mentor <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _accept THEN
    SELECT mentor_id INTO v_existing FROM public.profiles WHERE id = v_student;
    IF v_existing IS NOT NULL THEN
      UPDATE public.mentor_requests SET status = 'cancelled', responded_at = now() WHERE id = _request_id;
      RETURN 'already_assigned';
    END IF;
    UPDATE public.profiles SET mentor_id = v_mentor WHERE id = v_student;
    UPDATE public.mentor_requests SET status = 'accepted', responded_at = now() WHERE id = _request_id;
    UPDATE public.mentor_requests SET status = 'cancelled', responded_at = now()
      WHERE student_id = v_student AND id <> _request_id AND status = 'pending';
    RETURN 'accepted';
  ELSE
    UPDATE public.mentor_requests SET status = 'rejected', responded_at = now() WHERE id = _request_id;
    RETURN 'rejected';
  END IF;
END; $$;
