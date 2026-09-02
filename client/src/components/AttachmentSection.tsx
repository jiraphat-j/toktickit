import React, { useState, useRef } from "react";
import {
  DevRequester,
  AttachmentMeta,
  uploadTicketAttachment,
  removeTicketAttachment,
  getAttachmentDownloadUrl,
} from "../api.js";

export interface AttachmentSectionProps {
  ticketId: number;
  currentRequester: DevRequester;
  attachments: AttachmentMeta[];
  onAttachmentChange: () => void;
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}

export function AttachmentSection({
  ticketId,
  currentRequester,
  attachments,
  onAttachmentChange,
}: AttachmentSectionProps) {
  // Upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Soft-removal modal states
  const [removalTarget, setRemovalTarget] = useState<AttachmentMeta | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removalError, setRemovalError] = useState<string>("");
  const [isRemoving, setIsRemoving] = useState<boolean>(false);

  const activeAttachments = attachments.filter((a) => !a.isRemoved);
  const removedAttachments = attachments.filter((a) => a.isRemoved);
  const isCapReached = activeAttachments.length >= 5;

  // File selection & validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError("Only JPG, PNG, WEBP, and PDF files are allowed.");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setUploadError("Attachment exceeds the maximum allowed size of 5 MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // Upload submission
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (isCapReached) {
      setUploadError("Maximum 5 active attachments reached. Please remove an attachment first.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      await uploadTicketAttachment(ticketId, selectedFile, currentRequester.id);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onAttachmentChange();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment.");
    } finally {
      setIsUploading(false);
    }
  };

  // Open removal modal
  const openRemovalModal = (att: AttachmentMeta) => {
    setRemovalTarget(att);
    setRemovalReason("");
    setRemovalError("");
  };

  // Close removal modal
  const closeRemovalModal = () => {
    setRemovalTarget(null);
    setRemovalReason("");
    setRemovalError("");
  };

  // Soft-removal submission (AC-13, BR-21)
  const handleConfirmRemoval = async () => {
    if (!removalTarget) return;
    const trimmed = removalReason.trim();
    if (trimmed.length < 3) {
      setRemovalError("Reason must be at least 3 characters long.");
      return;
    }

    setIsRemoving(true);
    setRemovalError("");

    try {
      await removeTicketAttachment(currentRequester.id, removalTarget.id, trimmed);
      closeRemovalModal();
      onAttachmentChange();
    } catch (err: any) {
      setRemovalError(err.message || "Failed to remove attachment.");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="zen-attachment-section" data-testid="attachment-section">
      <div className="zen-attachment-header">
        <h3 className="zen-card-title" style={{ margin: 0 }}>
          Attachments ({activeAttachments.length}/5 active)
        </h3>
      </div>

      {/* Active Attachment Limit Warning (AC-11, BR-19) */}
      {isCapReached && (
        <div
          className="zen-alert zen-alert-warning"
          data-testid="cap-reached-alert"
          style={{ marginTop: "1rem", marginBottom: "1rem" }}
        >
          <strong>Active attachment limit reached:</strong> Maximum 5 active attachments allowed per ticket.
          Remove an existing attachment before uploading a new one.
        </div>
      )}

      {/* Active Attachments List (AC-12) */}
      <div className="zen-attachment-list" style={{ marginTop: "1rem" }}>
        <h4 style={{ fontSize: "0.95rem", color: "var(--color-primary-green)", marginBottom: "0.5rem" }}>
          Active Attachments
        </h4>
        {activeAttachments.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem", fontStyle: "italic", margin: "0.5rem 0" }}>
            No active attachments.
          </p>
        ) : (
          <div className="zen-attachment-grid">
            {activeAttachments.map((att) => (
              <div key={att.id} className="zen-attachment-card" data-testid={`attachment-item-${att.id}`}>
                <div className="zen-attachment-info">
                  <div className="zen-attachment-name" title={att.originalFileName}>
                    📎 {att.originalFileName}
                  </div>
                  <div className="zen-attachment-meta">
                    {formatFileSize(att.sizeBytes)} • {formatDate(att.uploadedAt)}
                  </div>
                </div>
                <div className="zen-attachment-actions">
                  <a
                    href={getAttachmentDownloadUrl(att.id)}
                    download={att.originalFileName}
                    className="zen-btn-secondary"
                    style={{ fontSize: "0.85rem", padding: "0.3rem 0.6rem", textDecoration: "none" }}
                    aria-label={`Download ${att.originalFileName}`}
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    className="zen-btn-danger"
                    style={{ fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}
                    onClick={() => openRemovalModal(att)}
                    aria-label={`Remove ${att.originalFileName}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Soft-Removed Attachments List (AC-14, AC-32, BR-22) */}
      {removedAttachments.length > 0 && (
        <div className="zen-removed-attachment-list" style={{ marginTop: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", marginBottom: "0.5rem" }}>
            Removed Attachments (Metadata Only)
          </h4>
          <div className="zen-attachment-grid">
            {removedAttachments.map((att) => (
              <div
                key={att.id}
                className="zen-attachment-card is-removed"
                data-testid={`removed-attachment-item-${att.id}`}
                style={{ opacity: 0.8, backgroundColor: "var(--color-card-bg-subtle, #F8FAFC)" }}
              >
                <div className="zen-attachment-info">
                  <div
                    className="zen-attachment-name"
                    style={{ textDecoration: "line-through", color: "var(--color-text-muted)" }}
                  >
                    📎 {att.originalFileName}
                  </div>
                  <div className="zen-attachment-meta">
                    {formatFileSize(att.sizeBytes)} • Removed {att.removedAt ? formatDate(att.removedAt) : ""}
                  </div>
                  {att.removedReason && (
                    <div
                      className="zen-removed-reason"
                      style={{ fontSize: "0.8rem", color: "#DC2626", marginTop: "0.25rem" }}
                    >
                      <strong>Reason:</strong> {att.removedReason}
                    </div>
                  )}
                </div>
                <div className="zen-attachment-actions">
                  <span
                    className="zen-badge-removed"
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      backgroundColor: "#FEE2E2",
                      color: "#991B1B",
                      fontWeight: 600,
                    }}
                  >
                    Removed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload New Attachment Form (AC-11, BR-18) */}
      <div className="zen-upload-box" style={{ marginTop: "1.5rem" }}>
        <h4 style={{ fontSize: "0.95rem", color: "var(--color-primary-green)", marginBottom: "0.5rem" }}>
          Add Supporting Attachment
        </h4>
        <form onSubmit={handleUploadSubmit} className="zen-upload-form">
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              ref={fileInputRef}
              type="file"
              id="ticket-detail-file-input"
              accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
              disabled={isCapReached || isUploading}
              onChange={handleFileChange}
              className="zen-form-control"
              style={{ maxWidth: 350, padding: "0.4rem 0.6rem" }}
              aria-label="Choose file to attach"
            />
            <button
              type="submit"
              className="zen-btn-primary"
              disabled={!selectedFile || isCapReached || isUploading}
              style={{ minWidth: 100 }}
            >
              {isUploading ? "Uploading..." : "Upload File"}
            </button>
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "0.35rem" }}>
            Supported formats: JPG, PNG, WEBP, PDF (Max size: 5 MB)
          </div>
          {uploadError && (
            <div className="zen-error-msg" role="alert" style={{ marginTop: "0.35rem" }}>
              {uploadError}
            </div>
          )}
        </form>
      </div>

      {/* Soft-Removal Confirmation Modal (AC-13, BR-21) */}
      {removalTarget && (
        <div
          className="zen-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="removal-modal-title"
          data-testid="removal-modal"
        >
          <div className="zen-modal-content">
            <div className="zen-modal-header">
              <h3 id="removal-modal-title" style={{ margin: 0, fontSize: "1.2rem", color: "#991B1B" }}>
                Confirm Soft Removal
              </h3>
            </div>
            <div className="zen-modal-body" style={{ margin: "1rem 0" }}>
              <p style={{ margin: "0 0 1rem" }}>
                Are you sure you want to remove{" "}
                <strong>{removalTarget.originalFileName}</strong>?
              </p>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 1rem" }}>
                This file will be soft-removed (cannot be downloaded or restored), but metadata will be retained for
                audit purposes.
              </p>

              <label
                htmlFor="removal-reason-input"
                style={{ display: "block", fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.35rem" }}
              >
                Removal Reason (required, minimum 3 characters):
              </label>
              <textarea
                id="removal-reason-input"
                className={`zen-form-control ${removalError ? "is-invalid" : ""}`}
                rows={3}
                placeholder="e.g. Uploaded wrong screenshot, replaced by newer version..."
                value={removalReason}
                onChange={(e) => {
                  setRemovalReason(e.target.value);
                  if (removalError) setRemovalError("");
                }}
                disabled={isRemoving}
                style={{ width: "100%", resize: "vertical" }}
                aria-required="true"
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem", fontSize: "0.8rem" }}>
                <span style={{ color: removalReason.trim().length < 3 ? "#DC2626" : "var(--color-text-muted)" }}>
                  {removalReason.trim().length} / 3 min characters
                </span>
              </div>

              {removalError && (
                <div className="zen-error-msg" role="alert" style={{ marginTop: "0.5rem" }}>
                  {removalError}
                </div>
              )}
            </div>
            <div className="zen-modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="zen-btn-secondary"
                onClick={closeRemovalModal}
                disabled={isRemoving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="zen-btn-danger"
                onClick={handleConfirmRemoval}
                disabled={isRemoving || removalReason.trim().length < 3}
                data-testid="confirm-removal-button"
              >
                {isRemoving ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
