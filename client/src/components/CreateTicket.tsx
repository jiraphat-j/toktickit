import React, { useState, useEffect } from "react";
import {
  DevRequester,
  Category,
  RelatedSystem,
  Priority,
  Ticket,
  fetchActiveCategories,
  fetchActiveRelatedSystems,
  createTicket,
  uploadTicketAttachment,
} from "../api.js";

interface CreateTicketProps {
  currentRequester: DevRequester;
  onSuccessViewTickets: () => void;
  onCancel: () => void;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const CreateTicket: React.FC<CreateTicketProps> = ({
  currentRequester,
  onSuccessViewTickets,
  onCancel,
}) => {
  // Reference data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [refLoading, setRefLoading] = useState<boolean>(true);
  const [refError, setRefError] = useState<string | null>(null);

  // Form input state
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<Priority>("MEDIUM");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);

  // Status & Validation state
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  // Load active reference data on mount (AC-31)
  useEffect(() => {
    async function loadReferenceData() {
      setRefLoading(true);
      setRefError(null);
      try {
        const [cats, systems] = await Promise.all([
          fetchActiveCategories(),
          fetchActiveRelatedSystems(),
        ]);
        setCategories(cats);
        setRelatedSystems(systems);
      } catch (err: any) {
        setRefError(err.message || "Failed to load reference data");
      } finally {
        setRefLoading(false);
      }
    }

    loadReferenceData();
  }, []);

  // Client-side file validation helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) {
      setFile(null);
      return;
    }

    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Only JPG, JPEG, PNG, WEBP, and PDF files are allowed",
      }));
      e.target.value = "";
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setFieldErrors((prev) => ({
        ...prev,
        file: "Attachment size cannot exceed 5 MB",
      }));
      e.target.value = "";
      setFile(null);
      return;
    }

    // Clear file error and set valid file
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
    setFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.file;
      return next;
    });
  };

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setAttachmentError(null);

    const errors: Record<string, string> = {};

    // Validate Category
    if (!categoryId) {
      errors.category = "Please select a category";
    }

    // Validate Related System
    if (!relatedSystemId) {
      errors.relatedSystem = "Please select a related system";
    }

    // Validate Summary (5-150 chars, trimmed)
    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      errors.summary = "Summary is required";
    } else if (trimmedSummary.length < 5 || trimmedSummary.length > 150) {
      errors.summary = "Summary must be between 5 and 150 characters";
    }

    // Validate Description (10-2000 chars, trimmed)
    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "Description is required";
    } else if (trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
      errors.description = "Description must be between 10 and 2000 characters";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      // Generate client-side UUID for idempotency (BR-14)
      const idempotencyKey =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "idemp-" + Date.now() + "-" + Math.random().toString(36).substring(2);

      // Step 1: Create Ticket (POST /api/tickets)
      const newTicket = await createTicket(
        {
          categoryId: Number(categoryId),
          relatedSystemId: Number(relatedSystemId),
          summary: trimmedSummary,
          description: trimmedDesc,
          requestedPriority,
        },
        currentRequester.id,
        idempotencyKey
      );

      // Step 2: Upload attachment if present (BR-16, AC-07)
      if (file) {
        try {
          await uploadTicketAttachment(newTicket.id, file, currentRequester.id);
        } catch (attErr: any) {
          // Ticket is NOT rolled back upon attachment failure (AC-07)
          setAttachmentError(
            attErr.message || "Failed to upload attachment. You can retry from ticket detail."
          );
        }
      }

      setCreatedTicket(newTicket);
    } catch (err: any) {
      // AC-06: Preserve all form values upon server failure
      setServerError(err.message || "Failed to create ticket. Please check your network and retry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCategoryId("");
    setRelatedSystemId("");
    setRequestedPriority("MEDIUM");
    setSummary("");
    setDescription("");
    setFile(null);
    setFieldErrors({});
    setServerError(null);
    setAttachmentError(null);
    setCreatedTicket(null);
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ---------------------------------------------------------------------------
  // Success View (AC-01, UI-05)
  // ---------------------------------------------------------------------------
  if (createdTicket) {
    return (
      <div className="zen-card zen-success-card" style={{ maxWidth: 680, margin: "1rem auto" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.5rem", color: "var(--color-primary-green)" }}>
          Ticket Created Successfully!
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.95rem", margin: "0 0 0.75rem" }}>
          Your support request has been registered with the official Ticket Number:
        </p>

        <div>
          <span className="zen-ticket-number">{createdTicket.ticketNumber}</span>
        </div>

        {attachmentError && (
          <div className="zen-alert-warning" style={{ textAlign: "left", marginTop: "1rem" }}>
            <strong>Attachment Notice:</strong> The ticket was created, but your attachment could not be uploaded ({attachmentError}).
          </div>
        )}

        <div
          style={{
            backgroundColor: "var(--color-page-bg)",
            borderRadius: "var(--radius-sm)",
            padding: "1rem",
            textAlign: "left",
            margin: "1.25rem 0",
            fontSize: "0.9rem",
          }}
        >
          <p style={{ margin: "0 0 0.4rem" }}>
            <strong>Summary:</strong> {createdTicket.summary}
          </p>
          <p style={{ margin: "0 0 0.4rem" }}>
            <strong>Status:</strong> <span className="zen-badge zen-badge-new">{createdTicket.currentStatus}</span>
          </p>
          <p style={{ margin: 0 }}>
            <strong>Requested Priority:</strong>{" "}
            <span
              className={`zen-badge ${
                createdTicket.requestedPriority === "HIGH"
                  ? "zen-badge-high"
                  : createdTicket.requestedPriority === "MEDIUM"
                  ? "zen-badge-medium"
                  : "zen-badge-low"
              }`}
            >
              {createdTicket.requestedPriority}
            </span>
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginTop: "1.5rem" }}>
          <button type="button" className="zen-btn-primary" onClick={onSuccessViewTickets}>
            View in My Tickets
          </button>
          <button type="button" className="zen-btn-secondary" onClick={handleResetForm}>
            Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Create Ticket Form View
  // ---------------------------------------------------------------------------
  return (
    <div className="zen-card" style={{ maxWidth: 840, margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.35rem", color: "var(--color-primary-green)" }}>
          New Support Ticket
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", margin: 0 }}>
          Submit an IT support request. Required fields are marked with an asterisk (<span className="zen-required">*</span>).
        </p>
      </div>

      {serverError && (
        <div className="zen-alert-danger" role="alert">
          <strong>Submission Failed:</strong> {serverError}
        </div>
      )}

      {refError && (
        <div className="zen-alert-danger" role="alert">
          <strong>Reference Data Error:</strong> {refError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Requester Identity (Read-only, BR-10) */}
        <div className="zen-form-group">
          <label htmlFor="requester-display" className="zen-label">
            Requester
          </label>
          <input
            id="requester-display"
            type="text"
            className="zen-input zen-field-readonly"
            value={`${currentRequester.fullName} (${currentRequester.email})`}
            readOnly
            disabled
          />
        </div>

        {/* Two-column layout for Category and Related System */}
        <div className="zen-form-grid">
          {/* Category */}
          <div className="zen-form-group" style={{ margin: 0 }}>
            <label htmlFor="category-select" className="zen-label">
              Category <span className="zen-required">*</span>
            </label>
            <select
              id="category-select"
              className={`zen-select ${fieldErrors.category ? "is-invalid" : ""}`}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={refLoading || isSubmitting}
              aria-required="true"
              aria-invalid={!!fieldErrors.category}
            >
              <option value="">-- Select Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {fieldErrors.category && (
              <div className="zen-error-msg">{fieldErrors.category}</div>
            )}
          </div>

          {/* Related System */}
          <div className="zen-form-group" style={{ margin: 0 }}>
            <label htmlFor="related-system-select" className="zen-label">
              Related System <span className="zen-required">*</span>
            </label>
            <select
              id="related-system-select"
              className={`zen-select ${fieldErrors.relatedSystem ? "is-invalid" : ""}`}
              value={relatedSystemId}
              onChange={(e) => setRelatedSystemId(e.target.value)}
              disabled={refLoading || isSubmitting}
              aria-required="true"
              aria-invalid={!!fieldErrors.relatedSystem}
            >
              <option value="">-- Select Related System --</option>
              {relatedSystems.map((sys) => (
                <option key={sys.id} value={sys.id}>
                  {sys.name}
                </option>
              ))}
            </select>
            {fieldErrors.relatedSystem && (
              <div className="zen-error-msg">{fieldErrors.relatedSystem}</div>
            )}
          </div>
        </div>

        {/* Requested Priority */}
        <div className="zen-form-group">
          <label className="zen-label">
            Requested Priority <span className="zen-required">*</span>
          </label>
          <div className="zen-priority-group" role="radiogroup" aria-label="Requested Priority">
            {(["LOW", "MEDIUM", "HIGH"] as Priority[]).map((p) => (
              <label key={p} className="zen-priority-label">
                <input
                  type="radio"
                  name="requestedPriority"
                  value={p}
                  checked={requestedPriority === p}
                  onChange={() => setRequestedPriority(p)}
                  disabled={isSubmitting}
                />
                <span
                  className={`zen-badge ${
                    p === "HIGH"
                      ? "zen-badge-high"
                      : p === "MEDIUM"
                      ? "zen-badge-medium"
                      : "zen-badge-low"
                  }`}
                >
                  {p}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Summary (5-150 chars) */}
        <div className="zen-form-group">
          <label htmlFor="ticket-summary" className="zen-label">
            Summary <span className="zen-required">*</span>
          </label>
          <input
            id="ticket-summary"
            type="text"
            className={`zen-input ${fieldErrors.summary ? "is-invalid" : ""}`}
            placeholder="Brief description of the problem (5–150 characters)"
            value={summary}
            maxLength={150}
            onChange={(e) => setSummary(e.target.value)}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!fieldErrors.summary}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {fieldErrors.summary ? (
              <div className="zen-error-msg">{fieldErrors.summary}</div>
            ) : <span />}
            <div className="zen-char-count">{summary.trim().length}/150</div>
          </div>
        </div>

        {/* Description (10-2000 chars) */}
        <div className="zen-form-group">
          <label htmlFor="ticket-description" className="zen-label">
            Description <span className="zen-required">*</span>
          </label>
          <textarea
            id="ticket-description"
            className={`zen-textarea ${fieldErrors.description ? "is-invalid" : ""}`}
            placeholder="Detailed explanation of the issue, steps to reproduce, or error messages (10–2000 characters)"
            value={description}
            maxLength={2000}
            rows={5}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
            aria-required="true"
            aria-invalid={!!fieldErrors.description}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {fieldErrors.description ? (
              <div className="zen-error-msg">{fieldErrors.description}</div>
            ) : <span />}
            <div className="zen-char-count">{description.trim().length}/2000</div>
          </div>
        </div>

        {/* Attachment Picker (Optional, Max 5MB, JPG/PNG/WEBP/PDF) */}
        <div className="zen-form-group">
          <label htmlFor="ticket-attachment" className="zen-label">
            Supporting Attachment (Optional)
          </label>
          <div className="zen-file-upload-box">
            <input
              id="ticket-attachment"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
              className="zen-input"
              style={{ height: "auto", padding: "0.4rem" }}
            />
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>
              Accepted file formats: JPG, PNG, WEBP, PDF (Maximum size: 5 MB)
            </div>

            {file && (
              <div className="zen-file-chip">
                <span>📎 {file.name} ({formatFileSize(file.size)})</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  title="Remove attachment"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
          {fieldErrors.file && (
            <div className="zen-error-msg">{fieldErrors.file}</div>
          )}
        </div>

        {/* Actions */}
        <div className="zen-form-actions">
          <button
            type="submit"
            className="zen-btn-primary"
            disabled={isSubmitting || refLoading}
          >
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                <span>Submitting…</span>
              </>
            ) : (
              "Submit Ticket"
            )}
          </button>

          <button
            type="button"
            className="zen-btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
