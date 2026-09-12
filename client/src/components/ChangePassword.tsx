import React, { useState } from "react";
import { changeUserPassword, logoutUser, AuthUser } from "../api.js";

export interface ChangePasswordProps {
  user: AuthUser;
  onPasswordChanged: () => void;
  onLogout?: () => void;
}

export const ChangePassword: React.FC<ChangePasswordProps> = ({
  user,
  onPasswordChanged,
  onLogout,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Real-time requirement checks (AC-03, BR-03, UI-02)
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isFormValid) {
      setErrorMsg("Please satisfy all password complexity requirements.");
      return;
    }

    setLoading(true);
    try {
      await changeUserPassword(newPassword, confirmPassword);
      setSuccessMsg("Password updated successfully! Redirecting…");
      setTimeout(() => {
        onPasswordChanged();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      await logoutUser();
    } catch {}
    if (onLogout) onLogout();
  };

  return (
    <div className="zen-auth-container" style={{ maxWidth: 480, margin: "3rem auto", padding: "0 1rem" }}>
      <div className="card shadow-sm p-4 zen-card" style={{ borderRadius: 12, border: "1px solid var(--color-border)" }}>
        <div className="text-center mb-4">
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "var(--color-accent-amber, #f59e0b)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 0.75rem",
              fontSize: "1.3rem",
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-primary-green)", margin: 0 }}>
            Change Password Required
          </h2>
          <p style={{ color: "var(--color-muted)", fontSize: "0.88rem", marginTop: "0.4rem" }}>
            Hello <strong>{user.fullName}</strong>. For your security, you must update your initial password before accessing TokTickIT.
          </p>
        </div>

        {errorMsg && (
          <div className="alert alert-danger p-2 mb-3" role="alert" style={{ fontSize: "0.85rem" }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="alert alert-success p-2 mb-3" role="alert" style={{ fontSize: "0.85rem" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-3">
            <label htmlFor="newPassword" style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", marginBottom: 4 }}>
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="form-control"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="confirmPassword" style={{ fontWeight: 600, fontSize: "0.85rem", display: "block", marginBottom: 4 }}>
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-control"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              autoComplete="new-password"
            />
          </div>

          {/* Interactive Password Requirements Checklist (UI-02) */}
          <div
            className="p-3 mb-4"
            style={{
              backgroundColor: "var(--color-page-bg, #f9fafb)",
              borderRadius: 8,
              border: "1px solid var(--color-border, #e5e7eb)",
              fontSize: "0.82rem",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.5rem", color: "var(--color-secondary-green)" }}>
              Password Requirements:
            </div>
            <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <li style={{ color: hasMinLength ? "var(--color-primary-green)" : "#6b7280" }}>
                {hasMinLength ? "✓" : "○"} At least 8 characters
              </li>
              <li style={{ color: hasUppercase ? "var(--color-primary-green)" : "#6b7280" }}>
                {hasUppercase ? "✓" : "○"} At least one uppercase letter (A-Z)
              </li>
              <li style={{ color: hasLowercase ? "var(--color-primary-green)" : "#6b7280" }}>
                {hasLowercase ? "✓" : "○"} At least one lowercase letter (a-z)
              </li>
              <li style={{ color: hasNumber ? "var(--color-primary-green)" : "#6b7280" }}>
                {hasNumber ? "✓" : "○"} At least one number (0-9)
              </li>
              <li style={{ color: passwordsMatch ? "var(--color-primary-green)" : "#6b7280" }}>
                {passwordsMatch ? "✓" : "○"} Passwords must match
              </li>
            </ul>
          </div>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn flex-grow-1 py-2 zen-btn-primary"
              disabled={loading || !isFormValid}
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
                  Updating password…
                </span>
              ) : (
                "Update Password"
              )}
            </button>

            {onLogout && (
              <button
                type="button"
                className="btn btn-outline-secondary py-2"
                onClick={handleLogoutClick}
                disabled={loading}
                style={{ borderRadius: 8 }}
              >
                Sign Out
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
