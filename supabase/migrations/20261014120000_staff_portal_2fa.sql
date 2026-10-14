-- Staff portal 2FA: contact details and server-side, short-lived OTP challenges.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower_unique
  ON public.users (lower(email))
  WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('register', 'enroll', 'login')),
  method text NOT NULL CHECK (method IN ('email', 'sms')),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  code_expires_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5),
  send_count integer NOT NULL DEFAULT 0 CHECK (send_count BETWEEN 0 AND 5),
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_challenges_user_created
  ON public.auth_challenges (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_challenges_expiry
  ON public.auth_challenges (expires_at);

ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.auth_challenges TO service_role;

-- Persistent rate limits are required because Edge Functions can run on different instances.
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  bucket_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hit_count integer NOT NULL CHECK (hit_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.auth_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_auth_rate_limit(
  p_bucket_key text, p_limit integer, p_window_seconds integer
)
RETURNS TABLE(allowed boolean, hit_count integer)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v public.auth_rate_limits%ROWTYPE;
BEGIN
  IF char_length(coalesce(p_bucket_key, '')) NOT BETWEEN 1 AND 128
     OR p_limit NOT BETWEEN 1 AND 1000
     OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.auth_rate_limits (bucket_key, window_started_at, hit_count, updated_at)
  VALUES (p_bucket_key, now(), 1, now())
  ON CONFLICT (bucket_key) DO UPDATE SET
    window_started_at = CASE
      WHEN public.auth_rate_limits.window_started_at + (p_window_seconds * interval '1 second') <= now()
      THEN now() ELSE public.auth_rate_limits.window_started_at END,
    hit_count = CASE
      WHEN public.auth_rate_limits.window_started_at + (p_window_seconds * interval '1 second') <= now()
      THEN 1 ELSE public.auth_rate_limits.hit_count + 1 END,
    updated_at = now()
  RETURNING * INTO v;
  RETURN QUERY SELECT (v.hit_count <= p_limit), v.hit_count;
END;
$$;
REVOKE ALL ON FUNCTION public.consume_auth_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_auth_rate_limit(text, integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.increment_auth_challenge_attempts(p_challenge_id uuid)
RETURNS integer
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE v_attempts integer;
BEGIN
  UPDATE public.auth_challenges
  SET attempts = attempts + 1
  WHERE id = p_challenge_id AND consumed_at IS NULL AND attempts < 5
  RETURNING attempts INTO v_attempts;
  RETURN coalesce(v_attempts, 5);
END;
$$;
REVOKE ALL ON FUNCTION public.increment_auth_challenge_attempts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_auth_challenge_attempts(uuid) TO service_role;

-- Revoke pre-2FA sessions so existing browser tokens cannot bypass the new second factor.
DELETE FROM public.admin_sessions;
