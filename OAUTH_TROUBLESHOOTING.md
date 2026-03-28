# OAuth Troubleshooting (Supabase + Google)

## Scope

This guide applies to PitchIQ's active auth architecture:
- Supabase Auth
- Google provider via `signInWithOAuth`
- Redirect back to app domain

---

## Most Common Failures

## 1) Redirect URL mismatch

Symptoms:
- OAuth opens but returns with error
- Login loops back to login screen

Checks:
1. `VITE_SUPABASE_REDIRECT_URL` matches your current environment domain.
2. Supabase Redirect URLs include:
- `http://localhost:5173`
- `https://<your-production-domain>`
3. Google OAuth credentials allow corresponding origin and callback.

Project policy:
- Supported auth domains: localhost + production only
- Preview deployments are not configured for OAuth

---

## 2) Supabase provider misconfiguration

Symptoms:
- Clicking login fails immediately
- Errors mention provider disabled or invalid config

Checks:
1. Supabase Google provider is enabled.
2. Google client ID and secret are set in Supabase provider settings.
3. Site URL in Supabase matches your production domain.

---

## 3) Missing frontend env variables

Symptoms:
- App shows auth config issues
- Sign-in does nothing or throws startup error

Required vars:

```bash
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY
VITE_SUPABASE_REDIRECT_URL
```

After changing env values:
1. restart dev server
2. hard refresh browser

---

## 4) Service worker cache interference (PWA)

Symptoms:
- Auth callback appears stale
- Old auth behavior persists after deploy

Checks:
1. Ensure service worker excludes Supabase/Google auth requests from caching.
2. Ensure `sw.js` is served with no-cache headers.
3. Hard refresh and close/reopen app once after deployment.

---

## 5) Session appears lost after login

Symptoms:
- Login succeeds but user appears signed out on reload

Checks:
1. Browser storage is not blocked for your site.
2. `persistSession` is enabled (it is in current codebase).
3. Domain/protocol is consistent (`http://localhost:5173` in dev, HTTPS in prod).
4. Browser extensions are not stripping storage/cookies.

---

## Debug Steps

1. Open browser DevTools Console.
2. Trigger sign-in and capture first auth error line.
3. Inspect Network for calls to Supabase auth endpoints.
4. Confirm redirect URL in request matches expected domain.
5. Verify app removes OAuth error params from URL after handling.

---

## Recovery Steps

1. Stop dev server.
2. Clear Vite cache and restart:

```bash
rm -rf node_modules/.vite
npm run dev
```

3. Clear site data in browser for localhost/production domain.
4. Retry sign-in.

---

## Security Checklist

- Keep redirect allowlists minimal.
- Do not cache auth/token endpoints in service worker.
- Keep production on HTTPS.
- Do not store secrets in frontend env vars.
- Revalidate configuration after domain changes.

---

## Still blocked?

Collect and share:
1. Exact error message from browser console/network.
2. Current `VITE_SUPABASE_REDIRECT_URL` value (domain only, no secrets).
3. Whether issue is local or production.
4. Whether it fails only in installed PWA mode or also in normal browser tab.
