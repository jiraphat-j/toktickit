import React, { useState } from "react";
import { loginUser, AuthUser } from "../api.js";

export interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    let hasError = false;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required");
      hasError = true;
    }

    if (!password) {
      setPasswordError("Password is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser(trimmedEmail, password);
      onLoginSuccess(user);
    } catch (err: any) {
      setGeneralError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="zen-auth-container" style={{ maxWidth: 440, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="card shadow-sm p-4 zen-card" style={{ borderRadius: 12, border: "1px solid var(--color-border)" }}>
        <div className="text-center mb-4">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "var(--color-primary-green)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}
          >
            T
          </div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--color-primary-green)", margin: 0 }}>
            TokTickIT
          </h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
            Sign in to access IT services and support
          </p>
        </div>

        {generalError && (
          <div className="alert alert-danger p-2 mb-3" role="alert" style={{ fontSize: "0.85rem" }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="email" className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`}
              placeholder="name@organization.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              disabled={loading}
              autoComplete="email"
            />
            {emailError && (
              <div className="invalid-feedback" role="alert" style={{ fontSize: "0.8rem", display: "block" }}>
                {emailError}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="form-label" style={{ fontWeight: 600, fontSize: "0.85rem" }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className={`form-control ${passwordError ? "is-invalid" : ""}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              disabled={loading}
              autoComplete="current-password"
            />
            {passwordError && (
              <div className="invalid-feedback" role="alert" style={{ fontSize: "0.8rem", display: "block" }}>
                {passwordError}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn w-100 py-2 zen-btn-primary"
            disabled={loading}
            style={{
              backgroundColor: "var(--color-primary-green)",
              color: "#fff",
              fontWeight: 600,
              borderRadius: 8,
              border: "none",
            }}
          >
            {loading ? (
              <span>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Signing in…
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
