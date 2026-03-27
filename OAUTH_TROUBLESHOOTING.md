# 🔧 Google OAuth Error 401: invalid_client - Troubleshooting Guide

## Problem

When you try to sign in with Google, you get:

```
The OAuth client was not found.
Error 401: invalid_client
```

## Root Causes & Solutions

### ✅ Solution 1: Authorize localhost:5173 in Google Console

The most common issue is that **localhost:5173 is NOT in your authorized origins list**.

**Steps:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your **PitchIQ** project
3. Go to **APIs & Services** > **Credentials** (left sidebar)
4. Click on your **OAuth 2.0 Client ID** (the "Web application" one)
5. Look for **Authorized JavaScript origins**
6. Click the **+ ADD URI** button
7. Add exactly: `http://localhost:5173`
8. Click **SAVE**
9. **Restart your dev server**: `npm run dev`

**Visual Check:**
Your authorized origins should look like:

```
✓ http://localhost:5173
✓ http://localhost:3000 (if also using this)
✓ https://yourdomain.com (for production)
```

---

### ✅ Solution 2: Clear Browser Cache & Restart Dev Server

Sometimes the browser caches the old OAuth configuration.

```bash
# Stop current dev server (Ctrl+C)

# Clear npm cache
npm cache clean --force

# Restart dev server
npm run dev
```

Then:

1. Clear browser cache (DevTools > Network > "Disable cache" checkbox)
2. Hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
3. Try logging in again

---

### ✅ Solution 3: Verify Client ID Format

Your Client ID should look like:

```
1264570955957-rvv3c2dj19sf6d7svf7sh7gm9qiavm9t.apps.googleusercontent.com
```

Check `.env.local`:

```bash
cat .env.local
```

Should output:

```
VITE_GOOGLE_CLIENT_ID=1264570955957-rvv3c2dj19sf6d7svf7sh7gm9qiavm9t.apps.googleusercontent.com
```

✅ If it matches, proceed to Solution 1
❌ If it's different or empty, update it

---

### ✅ Solution 4: Check Environment Variables are Loading

In your browser DevTools console, run:

```javascript
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

**Expected output:**

```
1264570955957-rvv3c2dj19sf6d7svf7sh7gm9qiavm9t.apps.googleusercontent.com
```

**If output is `undefined`:**

1. Stop dev server: `Ctrl+C`
2. Restart: `npm run dev`
3. Wait for terminal to show "Local: http://localhost:5173"
4. Try again in console

---

### ✅ Solution 5: Check if OAuth Client Exists

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** > **Credentials**
3. Look for a row with:
   - Application type: **Web application**
   - Name: Something like "Web client 1" or "PitchIQ Web Client"

**If not found:**

- Your credentials may have been deleted
- Create new credentials:
  - Click **+ CREATE CREDENTIALS**
  - Select **OAuth 2.0 Client ID**
  - Choose **Web application**
  - Add `http://localhost:5173` to **Authorized JavaScript origins**
  - Copy the new Client ID

---

### ✅ Solution 6: Verify Google+ API is Enabled

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** > **Library**
3. Search for **"Google Identity"**
4. Click **Google Identity Services API**
5. Click **ENABLE** (if not already enabled)

Also enable:

- Search for **"Google Plus"** → Enable if available
- Search for **"OAuth"** → Any OAuth-related APIs should be enabled

---

## Complete Checklist

Before trying to login again, verify:

- [ ] `VITE_GOOGLE_CLIENT_ID` is in `.env.local`
- [ ] Client ID doesn't contain any extra spaces or quotes
- [ ] `http://localhost:5173` is in Authorized JavaScript origins (in Google Console)
- [ ] Dev server is running: `npm run dev`
- [ ] No errors in browser console
- [ ] Browser cache cleared or hard refresh done
- [ ] Google Identity Services API is enabled
- [ ] OAuth 2.0 credential exists and is set to "Web application" type

---

## Debug Steps

### Step 1: Check if ClientID is being read

Open browser DevTools (F12):

```javascript
// Type in Console tab:
console.log(import.meta.env.VITE_GOOGLE_CLIENT_ID);
```

Should show your Client ID (not undefined)

### Step 2: Check for console errors

Look in **Console** tab of DevTools for any red error messages

### Step 3: Check Network tab

1. Open DevTools > Network tab
2. Try to login
3. Look for requests to `oauth.google.com`
4. Check the error response for details

### Step 4: Check Application tab

1. Open DevTools > Application tab
2. Look for any cookies or storage related to Google
3. Clear all site data: DevTools > Application > Storage > "Clear site data" button

---

## Still Having Issues?

Try the **nuclear option** - start completely fresh:

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Delete cache
rm -rf node_modules/.vite

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall dependencies just to be safe
npm install

# 5. Restart dev server
npm run dev
```

Then reload browser and try login again.

---

## If All Else Fails

Create a **brand new OAuth 2.0 credential:**

1. Go to Google Cloud Console
2. **APIs & Services** > **Credentials**
3. Click the **DELETE** button on your current OAuth credential
4. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
5. Choose **Web application**
6. Name it: `PitchIQ Local Dev`
7. Add authorized origins:
   - `http://localhost:5173`
8. Click **CREATE**
9. Copy the new Client ID
10. Update `.env.local` with the new ID
11. Restart dev server

---

## Expected Behavior After Fix

1. ✅ Page loads without error message
2. ✅ "Sign in with Google" button appears
3. ✅ Click button → Google popup appears
4. ✅ Sign in successfully
5. ✅ Redirected to app and logged in

---

## Need More Help?

Check browser console for specific error messages and Google's official docs:

- [Google Identity Documentation](https://developers.google.com/identity)
- [OAuth 2.0 Configuration](https://developers.google.com/identity/protocols/oauth2)

**Current Status:** ⚠️ Needs Google Console configuration
**Action Required:** Add `http://localhost:5173` to Authorized JavaScript origins
