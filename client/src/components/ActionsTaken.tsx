import React, { useState, useEffect, useCallback } from "react";
import {
  ActionTaken,
  CreateActionTakenInput,
  UpdateActionTakenInput,
  fetchActionsTaken,
  createActionTaken,
  updateActionTaken,
} from "../api.js";
import { formatDate } from "./AttachmentSection.js";

export interface ActionsTakenProps {
  ticketId: number;
  currentUser?: {
    id: number;
    fullName: string;
    role?: string;
  } | null;
  isReadOnly?: boolean;
  onActionLogged?: () => void;
}

interface ActionFormData {
  actionDateTime: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

const getInitialFormData = (): ActionFormData => {
  const now = new Date();
  // Format for datetime-local: YYYY-MM-DDTHH:mm
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  return {
    actionDateTime: localIso,
    description: "",
    result: "",
    followUpRequired: false,
    followUpNote: "",
    attachmentNotes: "",
  };
};

export function ActionsTaken({
  ticketId,
  currentUser,
  isReadOnly = false,
  onActionLogged,
}: ActionsTakenProps) {
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  // Form state
  const [formData, setFormData] = useState<ActionFormData>(getInitialFormData());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string>("");
  const [conflictError, setConflictError] = useState<string>("");

  const canManageActions =
    !isReadOnly &&
    currentUser &&
    (currentUser.role === "IT_STAFF" || currentUser.role === "ADMINISTRATOR");

  const loadActions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchActionsTaken(ticketId);
      setActions(data);
    } catch (err: any) {
      setError(err.message || "Failed to load actions taken.");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setEditingAction(null);
    setFormData(getInitialFormData());
    setFormErrors({});
    setApiError("");
    setConflictError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (action: ActionTaken) => {
    setModalMode("edit");
    setEditingAction(action);
    const dateObj = new Date(action.actionDateTime);
    const localIso = !isNaN(dateObj.getTime())
      ? new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      : "";
    setFormData({
      actionDateTime: localIso,
      description: action.description,
      result: action.result,
      followUpRequired: action.followUpRequired,
      followUpNote: action.followUpNote || "",
      attachmentNotes: action.attachmentNotes || "",
    });
    setFormErrors({});
    setApiError("");
    setConflictError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAction(null);
    setFormErrors({});
    setApiError("");
    setConflictError("");
  };

  // Client-side Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedDesc = formData.description.trim();
    if (!trimmedDesc) {
      errors.description = "Action description is required.";
    } else if (trimmedDesc.length < 5 || trimmedDesc.length > 2000) {
      errors.description = "Description must be between 5 and 2000 characters.";
    }

    const trimmedResult = formData.result.trim();
    if (!trimmedResult) {
      errors.result = "Action result is required.";
    } else if (trimmedResult.length < 2 || trimmedResult.length > 2000) {
      errors.result = "Result must be between 2 and 2000 characters.";
    }

    if (formData.followUpRequired) {
      const trimmedFollowUp = formData.followUpNote.trim();
      if (!trimmedFollowUp) {
        errors.followUpNote = "Follow-up note is required when follow-up is checked.";
      } else if (trimmedFollowUp.length < 3 || trimmedFollowUp.length > 1000) {
        errors.followUpNote = "Follow-up note must be between 3 and 1000 characters.";
      }
    }

    if (formData.attachmentNotes && formData.attachmentNotes.length > 500) {
      errors.attachmentNotes = "Attachment notes cannot exceed 500 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setApiError("");
    setConflictError("");

    const isoDateTime = formData.actionDateTime
      ? new Date(formData.actionDateTime).toISOString()
      : undefined;

    try {
      if (modalMode === "create") {
        const payload: CreateActionTakenInput = {
          actionDateTime: isoDateTime,
          description: formData.description.trim(),
          result: formData.result.trim(),
          followUpRequired: formData.followUpRequired,
          followUpNote: formData.followUpRequired ? formData.followUpNote.trim() : null,
          attachmentNotes: formData.attachmentNotes.trim() || null,
        };
        await createActionTaken(ticketId, payload);
      } else if (modalMode === "edit" && editingAction) {
        const payload: UpdateActionTakenInput = {
          actionDateTime: isoDateTime,
          description: formData.description.trim(),
          result: formData.result.trim(),
          followUpRequired: formData.followUpRequired,
          followUpNote: formData.followUpRequired ? formData.followUpNote.trim() : null,
          attachmentNotes: formData.attachmentNotes.trim() || null,
          expectedUpdatedAt: editingAction.updatedAt,
        };
        await updateActionTaken(editingAction.id, payload, ticketId);
      }

      handleCloseModal();
      await loadActions();
      if (onActionLogged) {
        onActionLogged();
      }
    } catch (err: any) {
      if (err.status === 409 || err.code === "CONFLICT") {
        setConflictError(
          "Conflict detected: This record has been updated by another user. Please refresh and review current data."
        );
        // Refresh actions in background so user can see latest state
        loadActions();
      } else {
        setApiError(err.message || "Failed to save action taken.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card shadow-sm mb-4" data-testid="actions-taken-panel" style={{ borderColor: "#2E7D32" }}>
      {/* Section Header */}
      <div
        className="card-header d-flex flex-wrap justify-content-between align-items-center gap-2 py-3"
        style={{ backgroundColor: "#EAF6EF", borderBottom: "2px solid #A5D6A7" }}
      >
        <div className="d-flex align-items-center gap-2">
          <h5 className="mb-0 fw-bold" style={{ color: "#006B3C" }}>
            🛠️ Actions Taken
          </h5>
          <span
            className="badge rounded-pill"
            data-testid="actions-count"
            style={{ backgroundColor: "#006B3C", color: "#FFFFFF", fontSize: "0.85rem", padding: "4px 10px" }}
          >
            {actions.length}
          </span>
        </div>

        {canManageActions && (
          <button
            type="button"
            className="zen-btn-primary d-inline-flex align-items-center gap-1"
            onClick={handleOpenCreateModal}
            data-testid="log-action-btn"
            style={{ minHeight: 40, padding: "6px 14px", fontSize: "0.9rem" }}
          >
            <span>+</span> Log Action Taken
          </button>
        )}
      </div>

      <div className="card-body">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-4" data-testid="actions-loading">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading actions taken...</span>
            </div>
            <p className="text-muted small mt-2">Loading actions taken history...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="alert alert-danger d-flex justify-content-between align-items-center" data-testid="actions-error">
            <span>{error}</span>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={loadActions}
              data-testid="retry-actions-btn"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && actions.length === 0 && (
          <div
            className="text-center py-4 p-3 rounded"
            data-testid="actions-empty"
            style={{ backgroundColor: "#F5F7F6", border: "1px dashed #A5D6A7" }}
          >
            <p className="text-muted mb-1 fw-semibold">No actions taken have been recorded yet for this ticket.</p>
            <p className="text-muted small mb-0">
              {canManageActions
                ? "Click '+ Log Action Taken' to document troubleshooting steps, investigations, or resolutions."
                : "IT Staff will document actions and progress here as work proceeds."}
            </p>
          </div>
        )}

        {/* Actions Table (Desktop view ≥992px) */}
        {!loading && !error && actions.length > 0 && (
          <>
            <div className="table-responsive d-none d-md-block" data-testid="actions-table-wrapper">
              <table className="table table-hover align-middle mb-0" data-testid="actions-table">
                <thead style={{ backgroundColor: "#F5F7F6" }}>
                  <tr className="small text-muted text-uppercase">
                    <th scope="col" style={{ width: "16%" }}>Date / Time</th>
                    <th scope="col" style={{ width: "16%" }}>Performed By</th>
                    <th scope="col" style={{ width: "24%" }}>Description</th>
                    <th scope="col" style={{ width: "20%" }}>Result</th>
                    <th scope="col" style={{ width: "14%" }}>Follow-Up</th>
                    {canManageActions && <th scope="col" style={{ width: "10%" }} className="text-end">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {actions.map((act) => (
                    <tr key={act.id} data-testid={`action-row-${act.id}`}>
                      {/* Date / Time */}
                      <td data-testid={`action-date-${act.id}`} className="small text-nowrap">
                        {formatDate(act.actionDateTime || act.createdAt)}
                      </td>

                      {/* Performed By */}
                      <td data-testid={`action-performer-${act.id}`}>
                        <div className="fw-semibold small">{act.performedBy?.fullName || "IT Staff"}</div>
                        {act.performedBy?.role && (
                          <span
                            className="badge bg-light text-secondary border small"
                            style={{ fontSize: "0.7rem" }}
                          >
                            {act.performedBy.role}
                          </span>
                        )}
                      </td>

                      {/* Description */}
                      <td data-testid={`action-desc-${act.id}`} className="small" style={{ whiteSpace: "pre-wrap" }}>
                        {act.description}
                        {act.attachmentNotes && (
                          <div className="text-muted small mt-1" data-testid={`action-attachment-notes-${act.id}`}>
                            📎 <em>Attachment Notes:</em> {act.attachmentNotes}
                          </div>
                        )}
                      </td>

                      {/* Result */}
                      <td data-testid={`action-result-${act.id}`} className="small" style={{ whiteSpace: "pre-wrap" }}>
                        {act.result}
                      </td>

                      {/* Follow-Up */}
                      <td data-testid={`action-followup-${act.id}`}>
                        {act.followUpRequired ? (
                          <div>
                            <span
                              className="badge"
                              style={{ backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" }}
                            >
                              ⚠️ Required
                            </span>
                            {act.followUpNote && (
                              <div className="small text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                                {act.followUpNote}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="badge bg-light text-muted border">None</span>
                        )}
                      </td>

                      {/* Actions (Edit Button) */}
                      {canManageActions && (
                        <td className="text-end" data-testid={`action-actions-${act.id}`}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleOpenEditModal(act)}
                            data-testid={`edit-action-btn-${act.id}`}
                            style={{ minHeight: 32, fontSize: "0.8rem" }}
                          >
                            Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View (<768px) */}
            <div className="d-md-none" data-testid="actions-mobile-cards">
              {actions.map((act) => (
                <div
                  key={act.id}
                  className="card mb-3 border shadow-none"
                  data-testid={`action-card-${act.id}`}
                  style={{ backgroundColor: "#FAFCFA", borderLeft: "4px solid #006B3C" }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="small fw-bold text-success">{act.performedBy?.fullName || "IT Staff"}</div>
                      <div className="small text-muted">{formatDate(act.actionDateTime || act.createdAt)}</div>
                    </div>

                    <div className="mb-2">
                      <strong className="small text-muted d-block">Description:</strong>
                      <p className="small mb-1" style={{ whiteSpace: "pre-wrap" }}>
                        {act.description}
                      </p>
                    </div>

                    <div className="mb-2">
                      <strong className="small text-muted d-block">Result:</strong>
                      <p className="small mb-1 text-dark" style={{ whiteSpace: "pre-wrap" }}>
                        {act.result}
                      </p>
                    </div>

                    {act.followUpRequired && (
                      <div className="mb-2 p-2 rounded" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                        <span className="badge bg-warning text-dark mb-1">Follow-up Required</span>
                        <div className="small text-warning-emphasis">{act.followUpNote}</div>
                      </div>
                    )}

                    {act.attachmentNotes && (
                      <div className="small text-muted mb-2">
                        📎 <strong>Attachment Notes:</strong> {act.attachmentNotes}
                      </div>
                    )}

                    {canManageActions && (
                      <div className="text-end pt-2 border-top">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleOpenEditModal(act)}
                          data-testid={`mobile-edit-action-btn-${act.id}`}
                        >
                          Edit Action
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Accessible Modal Dialog (Create & Edit Mode) */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          data-testid="action-modal"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(2px)" }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" role="document">
            <div className="modal-content shadow-lg border-0">
              <div
                className="modal-header py-3"
                style={{ backgroundColor: "#EAF6EF", borderBottom: "2px solid #A5D6A7" }}
              >
                <h5 className="modal-title fw-bold" style={{ color: "#006B3C" }} data-testid="modal-title">
                  {modalMode === "create" ? "Log Action Taken" : "Edit Action Taken"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={handleCloseModal}
                  disabled={submitting}
                />
              </div>

              <form onSubmit={handleSubmit} data-testid="action-form">
                <div className="modal-body p-4">
                  {/* API Failure Banner */}
                  {apiError && (
                    <div className="alert alert-danger py-2 small mb-3" data-testid="api-error-banner">
                      {apiError}
                    </div>
                  )}

                  {/* Concurrency Conflict Banner */}
                  {conflictError && (
                    <div className="alert alert-warning py-2 small mb-3" data-testid="conflict-alert">
                      ⚠️ {conflictError}
                    </div>
                  )}

                  <div className="row g-3 mb-3">
                    {/* Action Date / Time */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="actionDateTime" className="form-label small fw-semibold text-secondary">
                        Action Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        id="actionDateTime"
                        className="form-control"
                        value={formData.actionDateTime}
                        onChange={(e) => setFormData({ ...formData, actionDateTime: e.target.value })}
                        disabled={submitting}
                        data-testid="action-datetime-input"
                      />
                    </div>

                    {/* Performed By (Read-only bound to session user) */}
                    <div className="col-12 col-md-6">
                      <label htmlFor="performedBy" className="form-label small fw-semibold text-secondary">
                        Performed By (Auto-attributed)
                      </label>
                      <input
                        type="text"
                        id="performedBy"
                        className="form-control bg-light"
                        value={currentUser?.fullName ? `${currentUser.fullName} (${currentUser.role || "Staff"})` : "Current User"}
                        readOnly
                        disabled
                        data-testid="action-performer-input"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label htmlFor="actionDescription" className="form-label small fw-semibold text-secondary">
                      Action Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="actionDescription"
                      className={`form-control ${formErrors.description ? "is-invalid" : ""}`}
                      rows={3}
                      maxLength={2000}
                      placeholder="Detail the technical action taken, diagnostic test performed, or configuration changed (5–2000 characters)..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={submitting}
                      data-testid="action-description-input"
                    />
                    <div className="d-flex justify-content-between small text-muted mt-1">
                      {formErrors.description ? (
                        <span className="text-danger" data-testid="description-error">
                          {formErrors.description}
                        </span>
                      ) : (
                        <span>Minimum 5 characters required</span>
                      )}
                      <span data-testid="description-char-count">{formData.description.length} / 2000</span>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="mb-3">
                    <label htmlFor="actionResult" className="form-label small fw-semibold text-secondary">
                      Action Result / Outcome <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="actionResult"
                      className={`form-control ${formErrors.result ? "is-invalid" : ""}`}
                      rows={2}
                      maxLength={2000}
                      placeholder="Outcome of the action taken (e.g. Service restarted successfully, replaced RAM module) (2–2000 characters)..."
                      value={formData.result}
                      onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                      disabled={submitting}
                      data-testid="action-result-input"
                    />
                    <div className="d-flex justify-content-between small text-muted mt-1">
                      {formErrors.result ? (
                        <span className="text-danger" data-testid="result-error">
                          {formErrors.result}
                        </span>
                      ) : (
                        <span>Minimum 2 characters required</span>
                      )}
                      <span data-testid="result-char-count">{formData.result.length} / 2000</span>
                    </div>
                  </div>

                  {/* Follow-up Required Checkbox */}
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      id="followUpRequired"
                      className="form-check-input"
                      checked={formData.followUpRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          followUpRequired: e.target.checked,
                          followUpNote: e.target.checked ? formData.followUpNote : "",
                        })
                      }
                      disabled={submitting}
                      data-testid="action-followup-checkbox"
                    />
                    <label htmlFor="followUpRequired" className="form-check-label small fw-semibold text-secondary">
                      Follow-Up Required?
                    </label>
                  </div>

                  {/* Follow-up Note (conditionally visible/required) */}
                  {formData.followUpRequired && (
                    <div className="mb-3 p-3 rounded" style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}>
                      <label htmlFor="followUpNote" className="form-label small fw-semibold text-warning-emphasis">
                        Follow-up Note <span className="text-danger">*</span>
                      </label>
                      <textarea
                        id="followUpNote"
                        className={`form-control ${formErrors.followUpNote ? "is-invalid" : ""}`}
                        rows={2}
                        maxLength={1000}
                        placeholder="Explain what subsequent work or verification is needed (3–1000 characters)..."
                        value={formData.followUpNote}
                        onChange={(e) => setFormData({ ...formData, followUpNote: e.target.value })}
                        disabled={submitting}
                        data-testid="action-followup-note-input"
                      />
                      <div className="d-flex justify-content-between small text-muted mt-1">
                        {formErrors.followUpNote ? (
                          <span className="text-danger" data-testid="followup-note-error">
                            {formErrors.followUpNote}
                          </span>
                        ) : (
                          <span className="text-warning-emphasis">Required when follow-up is checked</span>
                        )}
                        <span>{formData.followUpNote.length} / 1000</span>
                      </div>
                    </div>
                  )}

                  {/* Attachment Notes */}
                  <div className="mb-2">
                    <label htmlFor="attachmentNotes" className="form-label small fw-semibold text-secondary">
                      Attachment Notes (Optional)
                    </label>
                    <input
                      type="text"
                      id="attachmentNotes"
                      className={`form-control ${formErrors.attachmentNotes ? "is-invalid" : ""}`}
                      maxLength={500}
                      placeholder="e.g. Refer to router-config.log or screenshot-01.png"
                      value={formData.attachmentNotes}
                      onChange={(e) => setFormData({ ...formData, attachmentNotes: e.target.value })}
                      disabled={submitting}
                      data-testid="action-attachment-notes-input"
                    />
                    {formErrors.attachmentNotes && (
                      <div className="text-danger small mt-1">{formErrors.attachmentNotes}</div>
                    )}
                  </div>
                </div>

                <div className="modal-footer py-2" style={{ backgroundColor: "#F5F7F6" }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={handleCloseModal}
                    disabled={submitting}
                    data-testid="cancel-action-btn"
                    style={{ minHeight: 40 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="zen-btn-primary"
                    disabled={submitting}
                    data-testid="submit-action-btn"
                    style={{ minHeight: 40 }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Saving...
                      </>
                    ) : modalMode === "create" ? (
                      "Save Action"
                    ) : (
                      "Update Action"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
