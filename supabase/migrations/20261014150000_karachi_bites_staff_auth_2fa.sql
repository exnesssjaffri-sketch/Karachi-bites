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
