CREATE OR REPLACE FUNCTION public.bootstrap_admin(p_username text, p_password_hash text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_id bigint;
BEGIN
  IF char_length(trim(coalesce(p_username, ''))) NOT BETWEEN 3 AND 50
     OR trim(p_username) !~ '^[A-Za-z0-9_.-]+$'
     OR coalesce(p_password_hash, '') !~ '^\$2[aby]\$[0-9]{2}\$[./A-Za-z0-9]{53}$' THEN
    RAISE EXCEPTION 'Invalid initial admin data' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM public.users LIMIT 1) THEN
    RAISE EXCEPTION 'Admin bootstrap is already closed' USING ERRCODE = '23505';
  END IF;
  INSERT INTO public.users (username, password_hash, role)
  VALUES (trim(p_username), p_password_hash, 'admin')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'username', trim(p_username), 'role', 'admin');
END;
$$;
REVOKE ALL ON FUNCTION public.bootstrap_admin(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_admin(text, text) TO service_role;
