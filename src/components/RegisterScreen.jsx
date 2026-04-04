import { useState } from "react";

export default function RegisterScreen({ onRegister, onGoToSignIn }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [errorMessage, setErrorMessage] = useState(null);

  const handleRegister = async () => {
    if (
      !phone.trim() ||
      !password ||
      !firstName.trim() ||
      !lastName.trim() ||
      !inviteCode.trim()
    ) {
      setErrorMessage("All registration fields are required.");
      return;
    }

    try {
      setIsRegistering(true);
      setErrorMessage(null);

      const registerResult = await onRegister?.({
        phone,
        password,
        firstName,
        lastName,
        inviteCode,
      });
      const error = registerResult?.error ?? null;

      if (error) {
        const message =
          typeof error?.message === "string" && error.message.length > 0
            ? error.message
            : "Registration failed. Try again.";
        setErrorMessage(message);
        return;
      }

      onGoToSignIn?.();
    } catch {
      setErrorMessage("Registration failed. Try again.");
    } finally {
      setIsRegistering(false);
    }
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
        <div className="login-tagline">Registration</div>
        <div className="login-headline">
          Request <span>access</span>
        </div>
        <div className="login-desc">
          Enter your details and shared code.
          <br />
          Your account will be pending admin approval.
        </div>

        <div className="register-auth-card">
          <input
            className="login-auth-input"
            type="tel"
            autoComplete="tel"
            placeholder="Phone number (example: +14155552671)"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={isRegistering}
          />
          <input
            className="login-auth-input"
            type="password"
            autoComplete="new-password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isRegistering}
          />
          <input
            className="login-auth-input"
            type="text"
            autoComplete="given-name"
            placeholder="First name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={isRegistering}
          />
          <input
            className="login-auth-input"
            type="text"
            autoComplete="family-name"
            placeholder="Last name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={isRegistering}
          />
          <input
            className="login-auth-input"
            type="text"
            placeholder="Shared invite code"
            value={inviteCode}
            onChange={(event) => setInviteCode(event.target.value)}
            disabled={isRegistering}
          />
          <button
            className="phone-btn"
            onClick={() => {
              void handleRegister();
            }}
            disabled={isRegistering}
          >
            {isRegistering ? "Registering..." : "Register"}
          </button>
        </div>

        <button
          className="login-link-btn"
          onClick={onGoToSignIn}
          disabled={isRegistering}
        >
          Sign in
        </button>

        {errorMessage && <div className="login-error-msg">{errorMessage}</div>}
      </div>
    </div>
  );
}
