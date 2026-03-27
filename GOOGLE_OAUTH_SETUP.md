# 🔐 Google OAuth Setup Guide

## Overview

PitchIQ now uses **real Google OAuth 2.0 authentication** instead of mocked login. Users can sign in with their Google account securely.

## Prerequisites

- `@react-oauth/google` library (✅ already installed)
- `jwt-decode` library (✅ already installed)
- Google Cloud Console access
- `.env.local` file (✅ already created)

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Enter project name: `PitchIQ` or similar
5. Click "CREATE"
6. Wait for project to be created (~1 minute)

### 2. Enable Google OAuth API

1. In the left sidebar, go to **APIs & Services** > **Library**
2. Search for "Google+ API" or "Google Identity API"
3. Click on **Google+ API**
4. Click the blue **ENABLE** button
5. Go back and look for **Google Identity Services API** and enable that too

### 3. Create OAuth 2.0 Credentials

1. In the left sidebar, go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. If prompted to create a consent screen first:
   - Click **CONFIGURE CONSENT SCREEN**
   - Select **External** for user type
   - Click **CREATE**
   - Fill in the form:
     - App name: `PitchIQ`
     - User support email: Your email
     - Developer contact: Your email
   - Click **SAVE AND CONTINUE**
4. On the scopes page, click **SAVE AND CONTINUE**
5. On summary page, click **BACK TO DASHBOARD**

### 4. Get Your Client ID

1. Go to **APIs & Services** > **Credentials** again
2. Click **+ CREATE CREDENTIALS** > **OAuth 2.0 Client ID**
3. Choose **Web application** from the dropdown
4. Name it: `PitchIQ Web Client`
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (development)
   - `http://localhost:3000` (if using different port)
   - Your deployed domain (when you deploy)
6. Leave **Authorized redirect URIs** empty (not needed for implicit flow)
7. Click **CREATE**
8. Copy your **Client ID** (looks like: `xxx.apps.googleusercontent.com`)

### 5. Update .env.local

1. Open `.env.local` in your project root
2. Replace `your-google-client-id-here.apps.googleusercontent.com` with your actual Client ID
3. Save the file

**Example:**

```
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
```

⚠️ **Important:** Never commit `.env.local` to GitHub. It's already in `.gitignore`.

### 6. Restart Development Server

```bash
npm run dev
```

Your app now uses real Google OAuth!

---

## How It Works

### Login Flow

```
User opens app
    ↓
No user logged in → LoginScreen shows
    ↓
User sees "Sign in with Google" button
    ↓
User clicks button → Google popup appears
    ↓
User logs in with Google account
    ↓
Google returns JWT token
    ↓
App decodes JWT to extract user info:
   - name
   - email
   - picture (profile photo)
   - googleId (unique ID)
    ↓
App logs user in with extracted data
    ↓
HomeScreen appears
```

### Code Implementation

**LoginScreen.jsx:**

```javascript
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const handleGoogleSuccess = (credentialResponse) => {
  // Decode JWT from Google
  const decoded = jwtDecode(credentialResponse.credential);

  // Extract user info
  const userData = {
    name: decoded.name,
    email: decoded.email,
    picture: decoded.picture,
    googleId: decoded.sub,
  };

  // Pass to parent (App.jsx)
  onLogin(userData);
};
```

**App.jsx:**

```javascript
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppContent />
    </GoogleOAuthProvider>
  );
}
```

---

## What Changed

### Before (Mocked)

```javascript
// Fake 1.2 second delay
setTimeout(
  () => onLogin({ name: "Ryngineer", email: "you@company.com" }),
  1200,
);
```

### After (Real OAuth)

```javascript
// Real Google OAuth with JWT decoding
<GoogleLogin
  onSuccess={handleGoogleSuccess}
  onError={handleGoogleError}
  type="standard"
  theme="outline"
  size="large"
/>
```

---

## User Data Available

After login, the `user` object contains:

```javascript
{
  name: "John Doe",                          // User's full name
  email: "john.doe@gmail.com",               // Gmail address
  picture: "https://lh3.googleusercontent.com/...", // Profile photo URL
  googleId: "100123456789..."                // Google unique ID
}
```

You can now:

- Display `user.name` in ProfileScreen
- Use `user.picture` for avatar
- Use `user.email` for backend API calls
- Use `googleId` for uniquely identifying users

---

## Deployment Configuration

When you deploy to production, add your deployed domain:

1. Go back to Google Cloud Console
2. **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Under **Authorized JavaScript origins**, add:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com`

---

## Common Issues

### Issue: "VITE_GOOGLE_CLIENT_ID is missing"

**Solution:**

1. Check if `.env.local` exists in project root
2. Verify it has `VITE_GOOGLE_CLIENT_ID=xxx`
3. Restart dev server: `npm run dev`

### Issue: "Google button doesn't appear"

**Solution:**

1. Check browser console for errors
2. Verify Client ID is valid
3. Check that localhost:5173 is in Google Console authorized origins

### Issue: "JWT decode error"

**Solution:**

1. Ensure `jwt-decode` is installed: `npm install jwt-decode`
2. Check that Google response includes credential JWT
3. Look at browser console logs

---

## Security Best Practices

✅ **Do:**

- Keep `.env.local` out of version control (already in .gitignore)
- Use HTTPS in production
- Validate JWT on backend when deploying
- Store only necessary user data

❌ **Don't:**

- Commit `.env.local` to GitHub
- Store OAuth credentials in frontend code
- Use test Client IDs in production

---

## Next Steps

### For Backend Integration:

1. When deploying, set up backend validation of JWT tokens
2. Change from localStorage to secure HTTP-only cookies
3. Add user database (Firebase, PostgreSQL, etc.)
4. Save prediction history to backend

### For Enhanced Security:

1. Implement refresh tokens
2. Add token expiration handling
3. Validate JWT signatures on backend
4. Rate limit login attempts

---

## Useful Resources

- [Google OAuth Documentation](https://developers.google.com/identity)
- [react-oauth/google GitHub](https://github.com/MomenSherif/react-oauth)
- [jwt-decode Documentation](https://github.com/auth0/jwt-decode)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-modes)

---

**Status:** ✅ Google OAuth integration complete
**Last Updated:** March 15, 2026
