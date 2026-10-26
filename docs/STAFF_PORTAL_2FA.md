# Staff Dispatch Portal — Two-factor authentication

## Status and release gate

The source branch implements server-side OTP verification for the Supabase Edge Function used by the live Staff Console. Do not deploy the new Edge Function until the database migration has been applied and the secrets below are configured. There is deliberately no development OTP, hard-coded code, or frontend bypass.

## Required email configuration

Create a Resend account, verify a sender domain/address in Resend, and create a sending-only API key. Add these as **Supabase Edge Function secrets** for project `rgejphvmnlwcoojkpcje`:

- `RESEND_API_KEY` — Resend sending API key
- `RESEND_FROM_EMAIL` — sender address using the verified domain, e.g. `Karachi Bites <security@your-verified-domain.com>`
- `OTP_PEPPER` — random secret with at least 32 random bytes

Generate a pepper locally with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Set secrets from a trusted terminal (never commit them):

```bash
supabase secrets set --project-ref rgejphvmnlwcoojkpcje RESEND_API_KEY=re_... RESEND_FROM_EMAIL="Karachi Bites <security@your-verified-domain.com>" OTP_PEPPER=<random-secret>
```

Alternatively, add them in the Supabase Dashboard under Edge Functions secrets. Do not paste secret values into GitHub, chat, or client-side JavaScript.

## Optional SMS configuration

SMS is only offered when all three secrets exist and a Twilio account has a sender capable of messaging the target country:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

Until configured, users can authenticate through email; the UI must not imply that SMS delivery is active. Twilio usage and delivery charges may apply.

## Database and deployment sequence

1. Review and merge the migration `supabase/migrations/20261014120000_staff_portal_2fa.sql`.
2. Apply the migration to the intended Supabase project.
3. Configure Resend secrets and verify sender-domain status.
4. Deploy `supabase/functions/karachi-bites-api/index.ts` with `verify_jwt: false` only because the function implements its own OTP/session authentication. Never remove the in-function authorization checks.
5. Confirm the deployment is healthy before changing the production frontend.
6. Existing admin accounts have no verified contact details yet. Open Staff Console → **Set up existing ID**, enter the existing admin username/password and a real email/phone, then complete email verification. New public registrations receive the `staff` role only.
7. Test with a non-production staff account before production rollout.

## Required verification checklist

- [ ] Valid credentials show a delivery-method step; they do not create a session.
- [ ] Invalid username/password never creates an OTP challenge usable for login.
- [ ] Correct email OTP succeeds once; replay is rejected.
- [ ] Incorrect OTP is rejected and the fifth failed attempt locks that challenge.
- [ ] OTP expires after five minutes.
- [ ] Resend is blocked for 60 seconds and capped at five sends per challenge.
- [ ] Registration creates a staff account only and cannot assign the admin role.
- [ ] Unverified accounts cannot log in.
- [ ] SMS is not offered unless all Twilio settings are present.
- [ ] Admin/staff order endpoints reject requests without a verified session.
- [ ] Logout revokes the server-side session.
- [ ] Email-provider failure returns an error and never issues a session token.
- [ ] Production smoke tests confirm the staff dashboard can load orders and update statuses after verification.

## Endpoints added

- `POST /auth/register` — creates a staff-only account and sends an email verification code.
- `POST /auth/enroll` — verifies credentials for an existing unverified account and enrolls email/phone.
- `POST /auth/login` — validates credentials and returns a pending challenge, never a session token.
- `POST /auth/send-otp` — sends an OTP through the selected configured channel.
- `POST /auth/verify-otp` — consumes a valid OTP and issues a server-side session only for login.
- `POST /auth/logout` — revokes the session.

OTP values are not returned by the API or written to logs. The database stores a hash, expiry, attempt count, send count, and consumption timestamp.
