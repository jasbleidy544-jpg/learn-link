
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin')
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- institutions
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin manage institutions" ON public.institutions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "auth read approved institutions" ON public.institutions FOR SELECT TO authenticated
  USING (status = 'approved');
CREATE TRIGGER trg_institutions_upd BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- meetings
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL,
  student_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 30,
  meet_link text,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin manage meetings" ON public.meetings FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "participants read meetings" ON public.meetings FOR SELECT TO authenticated
  USING (host_id = auth.uid() OR student_id = auth.uid());
CREATE POLICY "host manage own meetings" ON public.meetings FOR ALL TO authenticated
  USING (host_id = auth.uid()) WITH CHECK (host_id = auth.uid());
CREATE TRIGGER trg_meetings_upd BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- badges
CREATE TABLE IF NOT EXISTS public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  xp_reward integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin manage badges" ON public.badges FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "auth read active badges" ON public.badges FOR SELECT TO authenticated
  USING (is_active = true);

-- student_gamification
CREATE TABLE IF NOT EXISTS public.student_gamification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE,
  level integer NOT NULL DEFAULT 1,
  xp integer NOT NULL DEFAULT 0,
  badges_earned uuid[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.student_gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin manage gamification" ON public.student_gamification FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "student read own gamification" ON public.student_gamification FOR SELECT TO authenticated
  USING (student_id = auth.uid());
CREATE TRIGGER trg_gam_upd BEFORE UPDATE ON public.student_gamification
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- account_status
CREATE TABLE IF NOT EXISTS public.account_status (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.account_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin manage status" ON public.account_status FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "user read own status" ON public.account_status FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE TRIGGER trg_acct_upd BEFORE UPDATE ON public.account_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- admin_audit_log
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super_admin read audit" ON public.admin_audit_log FOR SELECT TO authenticated
  USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin insert audit" ON public.admin_audit_log FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()) AND admin_id = auth.uid());

-- super_admin override on existing tables
CREATE POLICY "super_admin all profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all academic" ON public.academic_records FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all attendance" ON public.attendance FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all ai_recs" ON public.ai_recommendations FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all diagnostics" ON public.diagnostic_results FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super_admin all interactions" ON public.platform_interactions FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
