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
