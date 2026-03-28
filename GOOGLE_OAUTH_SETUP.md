# Google OAuth Setup (Supabase Flow)

## Overview

PitchIQ uses **Supabase Auth + Google provider** for sign-in.
The app does **not** use direct Google SDK login (`@react-oauth/google`) in runtime.

Flow summary:
1. User clicks Google sign-in in the app.
2. App calls `supabase.auth.signInWithOAuth({ provider: "google" })`.
3. User authenticates at Google.
4. Google redirects back to your configured redirect URL.
5. Supabase finalizes session and app restores auth state.

---

## Runtime Code References

- Login trigger: `src/components/LoginScreen.jsx`
- Auth hook: `src/hooks/useSupabaseAuth.jsx`
- OAuth call + redirect builder: `src/lib/supabase.js`

Important settings currently used:
- `persistSession: true`
- `autoRefreshToken: true`
- `detectSessionInUrl: true`

---

## Required Environment Variables

Add these in `.env.local` for local development:

```bash
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-supabase-publishable-or-anon-key>
VITE_SUPABASE_REDIRECT_URL=http://localhost:5173
```

For production (Vercel), set:

```bash
VITE_SUPABASE_REDIRECT_URL=https://<your-production-domain>
```

This project decision is:
- Allowlist only `localhost` + production domain
- Do not support OAuth on preview deployment URLs

---

## Supabase Dashboard Setup

In Supabase:
1. Go to **Authentication -> Providers -> Google**.
2. Enable Google provider.
3. Add Google client ID and client secret.
4. Go to **Authentication -> URL Configuration**.
5. Set:
- Site URL: production domain
- Redirect URLs:
  - `http://localhost:5173`
  - `https://<your-production-domain>`

---

## Google Cloud Console Setup

In Google Cloud Console:
1. Configure OAuth consent screen.
2. Create OAuth client credentials.
3. Add authorized JavaScript origins:
- `http://localhost:5173`
- `https://<your-production-domain>`
4. Add authorized redirect URIs exactly matching Supabase callback URL(s) from provider setup.

Note: callback URI is the Supabase auth callback endpoint, not your app root path.

---

## Vercel Deployment Notes

- Use HTTPS production domain for OAuth.
- Keep `VITE_SUPABASE_REDIRECT_URL` set to production domain.
- If you change domain, update both Supabase and Google allowlists.

---

## Security Guidance

Do:
- Keep OAuth secrets in Supabase/secure envs, never in frontend code.
- Keep `.env.local` out of git.
- Restrict allowlists to exact domains.
- Keep OAuth/auth endpoints network-only in service worker policy.

Do not:
- Cache Supabase auth callbacks or token-related responses in service worker.
- Use wildcard redirect URLs.
- Mix preview domains into production allowlists unless intentionally supported.

---

## Quick Validation Checklist

1. Local login works on `http://localhost:5173`.
2. Production login works on your production domain.
3. Refresh keeps session active.
4. Logout clears session and returns to login screen.
5. OAuth error query params are cleaned from URL after processing.

---

## Common Mismatch to Avoid

If docs mention `VITE_GOOGLE_CLIENT_ID`, `GoogleOAuthProvider`, or `GoogleLogin` component setup, that is for a different integration style and not this app's active flow.

Status: Supabase OAuth flow documented and aligned with runtime behavior.
