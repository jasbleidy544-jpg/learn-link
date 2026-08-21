CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _inst_id uuid;
  _inst_name text;
  _teacher_type text;
BEGIN
  _inst_id := NULLIF(NEW.raw_user_meta_data->>'institution_id','')::uuid;
  _inst_name := NULLIF(NEW.raw_user_meta_data->>'institution','');
  _teacher_type := NULLIF(NEW.raw_user_meta_data->>'teacher_type','');

  INSERT INTO public.profiles (id, full_name, email, institution_id, institution, teacher_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    _inst_id,
    _inst_name,
    _teacher_type
  );

  IF NEW.raw_user_meta_data->>'user_type' IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'user_type')::app_role);
  END IF;

  RETURN NEW;
END;
$function$;