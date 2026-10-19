# Karachi Bites Supabase Auth rollout

## What this change adds
- Supabase Auth email/password sign-up and sign-in for customers.
- Phone OTP UI and API calls. Real SMS delivery is intentionally pending until Phone provider and Twilio credentials are configured in Supabase.
- Server verification of Supabase access tokens through the project's Auth user endpoint.
- A separate `auth_profiles` table for application roles. Public Auth signups are always `customer`; role values from user metadata are ignored.
- Staff can access order operations; menu-management endpoints remain admin-only.
- Existing username/password login and guest checkout/order tracking remain available.

## Deploy order
1. Review and merge the feature branch.
2. Apply `supabase/migrations/20261020000000_supabase_auth_profiles.sql` to the linked Supabase project. It is additive and does not delete existing users or orders.
3. Deploy the backend and frontend together.
4. Configure Supabase Auth > URL Configuration: Site URL `https://karachi-bites.vercel.app`; add the production and local login redirect URLs you use.
5. Email/password sign-in and signup use Supabase's email provider. If email confirmation is enabled, users must confirm their address before signing in.
6. Phone OTP will not send real SMS until the Phone provider is enabled and Twilio Account SID, Auth Token, and Message Service SID are configured. Keep the OTP expiry short and rate limits enabled.

## Provisioning staff/admin identities
1. Create the staff/admin identity through Supabase Auth (Dashboard > Authentication > Users) or the approved invite flow.
2. Confirm the exact email/phone belongs to the intended person.
3. Assign the application role using the SQL Editor, replacing the email placeholder with that exact verified identity:

```sql
-- Staff role:
update public.auth_profiles
set role = 'staff', updated_at = now()
where auth_user_id = (
  select id from auth.users where lower(email) = lower('staff@example.com')
);

-- Admin role (use only for the designated administrator):
update public.auth_profiles
set role = 'admin', updated_at = now()
where auth_user_id = (
  select id from auth.users where lower(email) = lower('admin@example.com')
);
```

Check that exactly one row was updated. If the result is zero rows, stop and verify the Auth user's identity before retrying. Do not expose a service-role key in frontend code or commit it to GitHub.

## Compatibility and verification limits
- The old `users` table, old login endpoint, existing orders, menu items, and guest checkout are preserved.
- Existing legacy admin/staff users are not silently linked to new Supabase identities. Their legacy login continues until an explicit account migration is performed.
- Phone OTP cannot be verified end-to-end until Twilio is configured.
- After deployment, test customer signup/email confirmation, email login, staff/admin role denial, authorized order status updates, legacy admin login, guest order creation/tracking, and menu CRUD with a designated admin test account. Do not create test orders in production without an agreed test plan.
