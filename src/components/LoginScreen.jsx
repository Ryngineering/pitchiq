import { useState } from "react";

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;
const E164_PHONE_ERROR = "Use E.164 format (example: +14155552671).";

export default function LoginScreen({
  onLogin,
  onContinueAsGuest,
  onPhoneSignIn,
  onOpenRegister,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPhoneLoading, setIsPhoneLoading] = useState(false);
  const [isPhoneAuthOpen, setIsPhoneAuthOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const isBusy = isLoading || isPhoneLoading;
  const normalizedPhone = phone.trim().replace(/[\s()-]/g, "");
  const phoneFormatError =
    phoneTouched && normalizedPhone && !E164_PHONE_REGEX.test(normalizedPhone)
      ? E164_PHONE_ERROR
      : null;

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      await onLogin();
    } catch {
      setIsLoading(false);
    }
  };

  const handlePhoneSignIn = async () => {
    setPhoneTouched(true);

    if (!phone.trim() || !password) {
      setErrorMessage("Enter phone number and password.");
      return;
    }

    if (!E164_PHONE_REGEX.test(normalizedPhone)) {
      return;
    }

    try {
      setIsPhoneLoading(true);
      setErrorMessage(null);
      await onPhoneSignIn?.({ phone, password });
    } catch {
      setErrorMessage("Invalid credentials.");
    } finally {
      setIsPhoneLoading(false);
    }
  };

  const handleGuestEntry = () => {
    if (isBusy) return;
    onContinueAsGuest?.();
  };

  return (
    <div className="app">
      <div className="login-screen">
        <div className="login-glow" />
        <div className="login-glow2" />
        <div className="login-logo-wrap">
          <span className="login-ball">🏏</span>
          <div className="login-logo">PITCHIQ</div>
        </div>
        <div className="login-tagline">IPL 2025 · Predict & Win</div>
        <div className="login-headline">
          Who will <span>win</span> tonight?
        </div>
        <div className="login-desc">
          Predict match winners, beat the odds,
          <br />
          climb the leaderboard with your colleagues.
        </div>

        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={isBusy}
        >
          {!isLoading ? (
            <>
              <svg
                className="google-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </>
          ) : (
            <span>Redirecting to Google...</span>
          )}
        </button>

        <button
          className="phone-entry-btn"
          onClick={() => {
            setErrorMessage(null);
            setIsPhoneAuthOpen(true);
          }}
          disabled={isBusy}
        >
          Login with phone number
        </button>

        <button
          className="guest-btn"
          onClick={handleGuestEntry}
          disabled={isBusy}
        >
          Continue as Guest
        </button>

        <div className="login-terms">
          By continuing you agree to our Terms of Service.
          <br />
          SSO secured via Supabase Auth.
        </div>

        {isPhoneAuthOpen && (
          <div
            className="login-modal-overlay"
            onClick={() => {
              if (!isBusy) {
                setIsPhoneAuthOpen(false);
                setErrorMessage(null);
              }
            }}
          >
            <div
              className="login-modal-card"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                className="login-modal-close"
                onClick={() => {
                  if (!isBusy) {
                    setIsPhoneAuthOpen(false);
                    setErrorMessage(null);
                  }
                }}
                disabled={isBusy}
                aria-label="Close"
              >
                ×
              </button>

              <div className="login-register-title">Sign in with phone</div>
              <div className="login-modal-subtitle">
                Enter your phone number and password to continue.
              </div>
              <div className="login-auth-card">
                <div className="login-input-row">
                  <input
                    className={`login-auth-input ${phoneFormatError ? "login-auth-input-error" : ""}`}
                    type="tel"
                    autoComplete="tel"
                    placeholder="Phone number (example: +14155552671)"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    onBlur={() => setPhoneTouched(true)}
                    disabled={isBusy}
                  />
                  {phoneFormatError && (
                    <div className="login-input-inline-error">
                      {phoneFormatError}
                    </div>
                  )}
                </div>
                <input
                  className="login-auth-input"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isBusy}
                />
                <button
                  className="phone-btn"
                  onClick={() => {
                    void handlePhoneSignIn();
                  }}
                  disabled={isBusy}
                >
                  {isPhoneLoading ? "Signing in..." : "Sign in"}
                </button>
              </div>

              <button
                className="login-link-btn"
                onClick={() => {
                  setErrorMessage(null);
                  setIsPhoneAuthOpen(false);
                  onOpenRegister?.();
                }}
                disabled={isBusy}
              >
                Need access? Register with code
              </button>

              {errorMessage && (
                <div className="login-error-msg">{errorMessage}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
