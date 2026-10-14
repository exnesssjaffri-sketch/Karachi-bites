-- Karachi Bites staff authentication: contact details and server-only OTP challenges.
-- Additive migration: existing accounts remain usable during staged rollout.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_unique_idx
  ON public.users (lower(btrim(email)))
  WHERE email IS NOT NULL AND btrim(email) <> '';

CREATE INDEX IF NOT EXISTS users_phone_idx
  ON public.users (phone)
  WHERE phone IS NOT NULL AND btrim(phone) <> '';

CREATE TABLE IF NOT EXISTS public.auth_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id bigint NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  purpose text NOT NULL DEFAULT 'login'
    CHECK (purpose IN ('login', 'verify_email', 'verify_phone', 'password_reset')),
  channel text NOT NULL CHECK (channel IN ('email', 'sms')),
  destination text NOT NULL,
  code_hash text NOT NULL,
  preauth_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  max_attempts smallint NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 10),
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  sent_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_challenges_user_created_idx
  ON public.auth_challenges (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auth_challenges_expiry_idx
  ON public.auth_challenges (expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.auth_challenges ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.auth_challenges FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.auth_challenges TO service_role;

-- Atomic, one-time OTP consumption. Only the Edge Function service role may call this.
CREATE OR REPLACE FUNCTION public.consume_auth_challenge(
  p_preauth_token_hash text,
  p_code_hash text
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge public.auth_challenges%ROWTYPE;
BEGIN
  SELECT * INTO v_challenge
  FROM public.auth_challenges
  WHERE preauth_token_hash = p_preauth_token_hash
  FOR UPDATE;

  IF NOT FOUND
     OR v_challenge.purpose <> 'login'
     OR v_challenge.consumed_at IS NOT NULL
     OR v_challenge.expires_at <= now()
     OR v_challenge.attempts >= v_challenge.max_attempts THEN
    RETURN NULL;
  END IF;

  IF v_challenge.code_hash <> p_code_hash THEN
    UPDATE public.auth_challenges
      SET attempts = attempts + 1,
          consumed_at = CASE
            WHEN attempts + 1 >= max_attempts THEN now()
            ELSE consumed_at
          END
      WHERE id = v_challenge.id;
    RETURN NULL;
  END IF;

  UPDATE public.auth_challenges
    SET consumed_at = now()
    WHERE id = v_challenge.id;

  RETURN v_challenge.user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_auth_challenge(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_auth_challenge(text, text) TO service_role;
