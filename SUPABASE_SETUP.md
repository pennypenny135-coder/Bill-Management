# Supabase integration status

## Authentication foundation

This commit adds the client and reusable AuthProvider/AuthBoundary. They are intentionally not wired into main.tsx yet. The existing local store must not be shown as a signed-in user's cloud data. Cloud storage integration and end-to-end verification are still required before deployment.

## Environment variables

Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY using .env.example. A legacy VITE_SUPABASE_ANON_KEY is also accepted. Use only a public publishable/anon key. Never put a service_role key or Google Client Secret in frontend environment variables. Google secrets belong in the Supabase Google provider configuration.

## Dependency installation and validation still required

Run npm install to resolve @supabase/supabase-js and regenerate package-lock.json, then commit the regenerated lockfile. This change does not fabricate dependency integrity hashes. npm ci will not work until the lockfile is updated. Run npx tsc --noEmit and npm run build after installation. No build or browser login test has been performed for this commit.

## OAuth configuration

Google callback: https://dbdmfrgmfkllpzhlwfkg.supabase.co/auth/v1/callback
Production Site URL: https://bill-management-rouge.vercel.app
The browser client uses PKCE with a redirect to the current origin root. Add each test/preview origin root to the Supabase redirect allowlist before testing; production URL permission does not automatically authorize Vercel preview domains.

## Database

The user reports manually running supabase/migrations/20261111010000_bill_management.sql in SQL Editor. Do not rerun this initialization script. This manual execution has not been independently verified and does not register migration history automatically. Reconcile migration history before introducing Supabase CLI db push.
