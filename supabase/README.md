# Karachi Bites — Supabase deployment

## Architecture
- Static frontend: Vercel
- API: Supabase Edge Function `karachi-bites-api`
- Persistent data: Supabase PostgreSQL
- SQL schema and transactional RPCs: `supabase/migrations/`

## Edge Function secrets
In Supabase Dashboard → Edge Functions → Secrets, configure:
- `DELIVERY_FEE=150` (optional; defaults to 150)
- `ADMIN_SETUP_SECRET` (required for one-time initial admin creation; use a random secret of at least 32 characters)

Never put the database service key in frontend code or Vercel public variables. The function uses Supabase's server-side environment.

## Create the first admin safely
The initial `public.users` table is intentionally empty. After setting `ADMIN_SETUP_SECRET` in the Supabase Edge Function secrets, run this in PowerShell. It prompts for credentials rather than embedding them in the command history:

```powershell
$setupSecret = Read-Host "Paste ADMIN_SETUP_SECRET"
$username = Read-Host "Choose admin username (3-50 letters/numbers/._-)"
$securePassword = Read-Host "Choose admin password (at least 12 characters)" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try { $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
$body = @{ username = $username; password = $password } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://rgejphvmnlwcoojkpcje.supabase.co/functions/v1/karachi-bites-api/api/auth/setup-admin" -Headers @{ "x-setup-secret" = $setupSecret } -ContentType "application/json" -Body $body
$password = $null
$body = $null
```

This endpoint can create an admin only while the users table is empty. After successful setup, remove `ADMIN_SETUP_SECRET` from Edge Function secrets. The database RPC also rejects bootstrap after the first user exists.

## API base
`https://rgejphvmnlwcoojkpcje.supabase.co/functions/v1/karachi-bites-api`

The frontend uses `/api/menu`, `/api/orders`, `/api/auth/login`, and the existing admin order routes appended to that base.

## Important
The first schema and menu were applied directly to the connected Supabase project and are mirrored in the migration files. The initial admin still needs to be provisioned using the secure one-time flow above. Before using real customer orders, perform a non-production/test order through the API and verify it from a fresh database connection.


## Staff/admin email OTP rollout (staged)

The branch `feature/staff-email-2fa` contains the Edge Function source and frontend OTP form. Before deploying the new function, configure these values in Supabase Dashboard → Edge Functions → Secrets:

- `RESEND_API_KEY`: a Resend API key with email-send permission.
- `AUTH_EMAIL_FROM`: a sender address on a domain verified in Resend, for example `Karachi Bites <auth@your-verified-domain.example>` (replace with your actual verified domain).
- `OTP_HASH_SECRET`: a random secret of at least 32 characters. Generate one locally; never commit it or paste it into chat.

The email OTP is 6 digits, expires after 5 minutes, and is limited to 5 verification attempts. The login route fails closed (503) if the email provider or hash secret is missing. SMS is intentionally not offered until an SMS provider is configured.

**Deployment warning:** do not deploy the updated function until the three secrets are set and the existing admin account has a valid email address. The current live function has not been replaced by this branch. The new login flow still uses the existing admin-only console authorization; staff-role access policy should be defined before extending dashboard permissions.
