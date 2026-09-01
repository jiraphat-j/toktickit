import React, { useState, useEffect } from "react";
import { DevRequester, fetchActiveDevRequesters } from "../api.js";

interface RequesterSelectorProps {
  onSelect: (requester: DevRequester) => void;
}

export const RequesterSelector: React.FC<RequesterSelectorProps> = ({ onSelect }) => {
  const [requesters, setRequesters] = useState<DevRequester[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const loadRequesters = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveDevRequesters();
      setRequesters(data);
    } catch (err: any) {
      setError(err.message || "Failed to load development requesters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequesters();
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setValidationError("Please select a Development Requester to continue.");
      return;
    }
    const found = requesters.find((r) => r.id === parseInt(selectedId, 10));
    if (found) {
      onSelect(found);
    } else {
      setValidationError("Selected requester is invalid or no longer active.");
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "4rem auto", padding: "0 1rem" }}>
      <div className="zen-card">
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.4rem" }}>🟢</span>
            <span style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--color-primary-green)" }}>
              TokTickIT
            </span>
          </div>

          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              backgroundColor: "var(--color-pale-green)",
              color: "var(--color-primary-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              fontSize: "1.5rem",
            }}
          >
            👤
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 700, margin: "0 0 0.5rem" }}>
            Select Development Requester
          </h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
            Choose a development requester to simulate the current user context for Lab 2.
          </p>
        </div>

        {/* BR-03 Disclaimer Notice */}
        <div className="zen-notice-box">
          <span style={{ fontSize: "1.1rem" }}>ℹ️</span>
          <div>
            <strong>Testing mechanism only:</strong> This screen is for testing only and is not a login screen. Authentication will be introduced in Lab 3.
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--color-secondary-green)" }}>
            <div className="spinner-border spinner-border-sm me-2" role="status" />
            <span>Loading active requesters…</span>
          </div>
        )}

        {!loading && error && (
          <div className="zen-alert-danger">
            <div style={{ marginBottom: "0.75rem" }}>
              <strong>Failed to load development requesters:</strong> {error}
            </div>
            <button
              type="button"
              className="zen-btn-secondary"
              style={{ fontSize: "0.85rem", padding: "0.3rem 0.8rem" }}
              onClick={loadRequesters}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && requesters.length === 0 && (
          <div className="zen-alert-empty">
            <p style={{ margin: 0, fontWeight: 500 }}>
              No active development requesters found.
            </p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
              Please ensure database migrations and seeds have been executed on the backend.
            </p>
          </div>
        )}

        {!loading && !error && requesters.length > 0 && (
          <form onSubmit={handleContinue}>
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="requester-select" className="zen-label">
                Development Requester <span className="zen-required">*</span>
              </label>
              <select
                id="requester-select"
                className={`zen-select ${validationError ? "is-invalid" : ""}`}
                value={selectedId}
                onChange={(e) => {
                  setSelectedId(e.target.value);
                  setValidationError(null);
                }}
              >
                <option value="">-- Choose a Requester --</option>
                {requesters.map((req) => (
                  <option key={req.id} value={req.id}>
                    {req.fullName} ({req.email})
                  </option>
                ))}
              </select>
              {validationError && <div className="zen-error-msg">{validationError}</div>}
              <small style={{ display: "block", marginTop: "0.4rem", color: "var(--color-text-muted)" }}>
                Only active development requesters are shown.
              </small>
            </div>

            <button type="submit" className="zen-btn-primary" style={{ width: "100%" }}>
              <span>Continue</span>
              <span>➔</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
