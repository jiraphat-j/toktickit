import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  TicketDetail,
  TicketStatus,
  Priority,
  StaffMember,
  TicketComment,
  InternalNote,
  fetchTicketDetail,
  fetchStaffMembers,
  updateTicketOwner,
  updateTicketPriority,
  updateTicketStatus,
  fetchTicketComments,
  createTicketComment,
  fetchInternalNotes,
  createInternalNote,
} from "../api.js";
import { AttachmentSection, formatDate } from "./AttachmentSection.js";

export interface StaffTicketDetailProps {
  ticketId: number;
  currentUser: AuthUser;
  onBack: () => void;
}

const STATUS_TRANSITIONS: Record<string, TicketStatus[]> = {
  NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
  OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"],
  CANCELLED: ["REOPENED"],
};

export function StaffTicketDetail({ ticketId, currentUser, onBack }: StaffTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [updatingOwner, setUpdatingOwner] = useState<boolean>(false);
  const [updatingPriority, setUpdatingPriority] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>("");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  // Comments state
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>("");

  // Internal notes state
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [noteInput, setNoteInput] = useState<string>("");
  const [postingNote, setPostingNote] = useState<boolean>(false);
  const [noteError, setNoteError] = useState<string>("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [ticketData, staffList, commentsList, notesList] = await Promise.all([
        fetchTicketDetail(currentUser.id, ticketId),
        fetchStaffMembers().catch(() => []),
        fetchTicketComments(ticketId).catch(() => []),
        fetchInternalNotes(ticketId).catch(() => []),
      ]);
      setTicket(ticketData);
      setStaffMembers(staffList);
      setComments(commentsList);
      setInternalNotes(notesList);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, currentUser.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Claim or assign owner
  const handleAssignOwner = async (ownerId: number | null) => {
    if (!ticket) return;
    setUpdatingOwner(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await updateTicketOwner(ticket.id, ownerId);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              primaryOwnerId: res.primaryOwnerId,
              primaryOwner: res.primaryOwner,
            }
          : null
      );
      setActionSuccess(
        ownerId === currentUser.id
          ? "You have claimed this ticket."
          : ownerId === null
          ? "Ticket has been unassigned."
          : `Ticket reassigned to ${res.primaryOwner?.fullName || "staff member"}.`
      );
    } catch (err: any) {
      setActionError(err.message || "Failed to update ticket owner.");
    } finally {
      setUpdatingOwner(false);
    }
  };

  // Update IT Priority
  const handlePriorityChange = async (newPriority: Priority) => {
    if (!ticket || newPriority === ticket.itPriority) return;
    setUpdatingPriority(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await updateTicketPriority(ticket.id, newPriority);
      setTicket((prev) => (prev ? { ...prev, itPriority: res.itPriority } : null));
      setActionSuccess(`IT Priority updated to ${newPriority}.`);
    } catch (err: any) {
      setActionError(err.message || "Failed to update IT priority.");
    } finally {
      setUpdatingPriority(false);
    }
  };

  // Update Ticket Status
  const handleStatusTransition = async (targetStatus: TicketStatus) => {
    if (!ticket) return;
    setUpdatingStatus(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await updateTicketStatus(ticket.id, targetStatus);
      setTicket((prev) => (prev ? { ...prev, currentStatus: res.currentStatus } : null));
      setActionSuccess(`Status transitioned to ${targetStatus}.`);
    } catch (err: any) {
      setActionError(err.message || "Failed to update ticket status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Post Public Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    const trimmed = commentInput.trim();
    if (!trimmed) {
      setCommentError("Comment content cannot be empty.");
      return;
    }
    if (trimmed.length > 2000) {
      setCommentError("Comment cannot exceed 2000 characters.");
      return;
    }

    setPostingComment(true);
    setCommentError("");
    try {
      const newComment = await createTicketComment(ticket.id, trimmed);
      setComments((prev) => [...prev, newComment]);
      setCommentInput("");
    } catch (err: any) {
      setCommentError(err.message || "Failed to post comment.");
    } finally {
      setPostingComment(false);
    }
  };

  // Post Internal Note
  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;
    const trimmed = noteInput.trim();
    if (!trimmed) {
      setNoteError("Internal note content cannot be empty.");
      return;
    }
    if (trimmed.length > 2000) {
      setNoteError("Internal note cannot exceed 2000 characters.");
      return;
    }

    setPostingNote(true);
    setNoteError("");
    try {
      const newNote = await createInternalNote(ticket.id, trimmed);
      setInternalNotes((prev) => [...prev, newNote]);
      setNoteInput("");
    } catch (err: any) {
      setNoteError(err.message || "Failed to post internal note.");
    } finally {
      setPostingNote(false);
    }
  };

  const getStatusBadgeClass = (status: TicketStatus) => {
    switch (status) {
      case "NEW":
        return "zen-status-new";
      case "OPEN":
        return "zen-status-open";
      case "IN_PROGRESS":
        return "zen-status-in-progress";
      case "WAITING_FOR_REQUESTER":
        return "zen-status-waiting";
      case "RESOLVED":
        return "zen-status-resolved";
      case "CLOSED":
        return "zen-status-closed";
      case "REOPENED":
        return "zen-status-reopened";
      case "CANCELLED":
        return "zen-status-cancelled";
      default:
        return "";
    }
  };

  const getPriorityBadgeClass = (priority?: Priority | null) => {
    switch (priority) {
      case "HIGH":
        return "zen-priority-badge zen-priority-high";
      case "MEDIUM":
        return "zen-priority-badge zen-priority-medium";
      case "LOW":
        return "zen-priority-badge zen-priority-low";
      default:
        return "zen-priority-badge";
    }
  };

  if (loading) {
    return (
      <div className="zen-card p-5 text-center" data-testid="staff-ticket-detail-loading">
        <div className="spinner-border text-success" role="status" style={{ width: 40, height: 40 }} />
        <p className="mt-3 text-muted">Loading ticket operations details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card p-5 text-center" data-testid="staff-ticket-detail-error">
        <div style={{ fontSize: "2.5rem" }}>⚠️</div>
        <h3 className="text-danger mt-2">Error Loading Ticket</h3>
        <p className="text-muted">{error || "Ticket not found or access denied."}</p>
        <button type="button" className="zen-btn-primary mt-3" onClick={onBack}>
          ← Back to Ticket Queue
        </button>
      </div>
    );
  }

  const allowedTransitions = STATUS_TRANSITIONS[ticket.currentStatus] || [];
  const isClaimedByMe = ticket.primaryOwnerId === currentUser.id;

  return (
    <div className="zen-staff-ticket-detail" data-testid="staff-ticket-detail">
      {/* Navigation Header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          type="button"
          className="zen-btn-secondary"
          onClick={onBack}
          data-testid="back-to-queue-btn"
          style={{ minHeight: 44 }}
        >
          ← Back to Ticket Queue
        </button>
        <div className="text-muted small">
          Created: {formatDate(ticket.createdAt)} | Last Updated: {formatDate(ticket.updatedAt)}
        </div>
      </div>

      {/* Action Messages */}
      {actionError && (
        <div className="alert alert-danger py-2 mb-3" role="alert" data-testid="action-error-banner">
          ⚠️ {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success py-2 mb-3" role="alert" data-testid="action-success-banner">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Problem Appears Resolved Indicator Banner */}
      {ticket.problemAppearsResolved && (
        <div
          className="alert py-2 mb-3 d-flex align-items-center"
          role="alert"
          data-testid="staff-resolved-indicator"
          style={{ backgroundColor: "#FEF3C7", borderColor: "#FDE68A", color: "#92400E" }}
        >
          <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>✓</span>
          <div>
            <strong>Problem Appears Resolved:</strong> The requester has indicated that this issue appears to be resolved. You may verify and proceed to transition status to RESOLVED.
          </div>
        </div>
      )}

      {/* Main Ticket Overview Card */}
      <div className="card mb-4 zen-card shadow-sm">
        <div className="card-header bg-white py-3 border-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <span className="badge bg-light text-dark me-2 font-monospace" style={{ fontSize: "1rem" }}>
              {ticket.ticketNumber}
            </span>
            <span className={`badge ${getStatusBadgeClass(ticket.currentStatus)} me-2`}>
              {ticket.currentStatus}
            </span>
            <span className={getPriorityBadgeClass(ticket.itPriority)}>
              IT Priority: {ticket.itPriority || "MEDIUM"}
            </span>
          </div>
          <div className="text-muted small">
            <strong>Requester:</strong> {ticket.requester?.fullName} ({ticket.requester?.email})
          </div>
        </div>

        <div className="card-body">
          <h4 className="card-title text-success mb-2">{ticket.summary}</h4>
          <div className="mb-3 d-flex flex-wrap gap-3 text-muted small">
            <div>
              <strong>Category:</strong> {ticket.category?.name}
            </div>
            <div>
              <strong>Related System:</strong> {ticket.relatedSystem?.name}
            </div>
            <div>
              <strong>Requested Priority:</strong>{" "}
              <span className={getPriorityBadgeClass(ticket.requestedPriority)}>
                {ticket.requestedPriority}
              </span>
            </div>
          </div>
          <div className="p-3 bg-light rounded border text-secondary" style={{ whiteSpace: "pre-wrap" }}>
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Operational Controls Toolbar */}
      <div className="card mb-4 border-success shadow-sm" style={{ borderLeft: "4px solid #0B7A46" }}>
        <div className="card-header bg-light py-2">
          <h6 className="mb-0 text-success fw-bold">⚙️ Operational Controls & State Transitions</h6>
        </div>
        <div className="card-body">
          <div className="row g-3 align-items-center">
            {/* Primary Owner / Claiming */}
            <div className="col-12 col-md-5">
              <label className="form-label small fw-bold mb-1">Assigned IT Owner:</label>
              <div className="d-flex gap-2 align-items-center">
                <span
                  className="badge px-3 py-2 text-dark bg-light border"
                  data-testid="assigned-owner-badge"
                  style={{ minWidth: 140, textAlign: "left" }}
                >
                  {ticket.primaryOwner
                    ? `👤 ${ticket.primaryOwner.fullName}${isClaimedByMe ? " (You)" : ""}`
                    : "Unassigned"}
                </span>

                {/* Claim / Unassign Button */}
                {isClaimedByMe ? (
                  <button
                    type="button"
                    className="zen-btn-secondary"
                    onClick={() => handleAssignOwner(null)}
                    disabled={updatingOwner}
                    data-testid="unassign-ticket-btn"
                    style={{ minHeight: 44, whiteSpace: "nowrap" }}
                  >
                    {updatingOwner ? "..." : "Unassign"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="zen-btn-primary"
                    onClick={() => handleAssignOwner(currentUser.id)}
                    disabled={updatingOwner}
                    data-testid="claim-ticket-btn"
                    style={{ minHeight: 44, whiteSpace: "nowrap" }}
                  >
                    {updatingOwner ? "..." : "Claim Ticket"}
                  </button>
                )}

                {/* Reassign Dropdown */}
                <select
                  className="form-select"
                  value={ticket.primaryOwnerId || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    handleAssignOwner(val ? parseInt(val, 10) : null);
                  }}
                  disabled={updatingOwner}
                  data-testid="reassign-owner-select"
                  style={{ minHeight: 44, maxWidth: 180 }}
                  aria-label="Reassign ticket owner"
                >
                  <option value="">Reassign to...</option>
                  <option value="">Unassign</option>
                  {staffMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* IT Priority Override */}
            <div className="col-12 col-md-3">
              <label className="form-label small fw-bold mb-1" htmlFor="it-priority-select">
                Operational IT Priority:
              </label>
              <select
                id="it-priority-select"
                className="form-select"
                value={ticket.itPriority || "MEDIUM"}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                disabled={updatingPriority}
                data-testid="it-priority-select"
                style={{ minHeight: 44 }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            {/* Status Workflow Action Buttons */}
            <div className="col-12 col-md-4">
              <label className="form-label small fw-bold mb-1">Workflow Status Transitions:</label>
              <div className="d-flex flex-wrap gap-2" data-testid="status-transition-actions">
                {allowedTransitions.length === 0 ? (
                  <span className="text-muted small">No permitted transitions from {ticket.currentStatus}</span>
                ) : (
                  allowedTransitions.map((target) => (
                    <button
                      key={target}
                      type="button"
                      className="btn btn-sm btn-outline-success"
                      onClick={() => handleStatusTransition(target)}
                      disabled={updatingStatus}
                      data-testid={`transition-to-${target.toLowerCase()}`}
                      style={{ minHeight: 44, minWidth: 80, fontWeight: 600 }}
                    >
                      → {target.replace(/_/g, " ")}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attachments Section (Lab 2 continuity) */}
      <div className="mb-4">
        <AttachmentSection
          ticketId={ticket.id}
          currentRequester={{
            id: currentUser.id,
            fullName: currentUser.fullName,
            email: currentUser.email,
            isActive: currentUser.isActive,
          }}
          attachments={ticket.attachments || []}
          onAttachmentChange={loadData}
        />
      </div>

      {/* Dual Communication Threads Grid */}
      <div className="row g-4">
        {/* 1. Public Comments Stream (Zen Green Accent) */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            data-testid="public-comments-panel"
            style={{ borderColor: "#2E7D32" }}
          >
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#E8F5E9", borderBottom: "2px solid #A5D6A7" }}
            >
              <h5 className="mb-0 text-success fw-bold">💬 Public Comments</h5>
              <span
                className="badge"
                style={{ backgroundColor: "#C8E6C9", color: "#1B5E20", fontWeight: 600 }}
              >
                ✓ Visible to Requester
              </span>
            </div>
            <div className="card-body d-flex flex-column">
              <p className="text-muted small mb-3">
                Messages in this stream are visible to both the requester and IT staff.
              </p>

              {/* Comments Feed */}
              <div
                className="flex-grow-1 overflow-auto mb-3"
                data-testid="comments-feed"
                style={{ maxHeight: 350, minHeight: 120 }}
              >
                {comments.length === 0 ? (
                  <p className="text-muted text-center py-4">No public comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 mb-2 rounded border"
                      data-testid={`comment-item-${c.id}`}
                      style={{
                        backgroundColor: c.author.role === "REQUESTER" ? "#F9FBF9" : "#F1F8F3",
                        borderLeft: c.author.role === "REQUESTER" ? "4px solid #81C784" : "4px solid #2E7D32",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>{c.author.fullName}</strong>
                        <span className="badge bg-light text-secondary small border">
                          {c.author.role}
                        </span>
                      </div>
                      <p className="mb-1 small text-dark" style={{ whiteSpace: "pre-wrap" }}>
                        {c.content}
                      </p>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {formatDate(c.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handlePostComment} data-testid="add-comment-form">
                {commentError && (
                  <div className="alert alert-danger py-1 small mb-2">{commentError}</div>
                )}
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={2000}
                    placeholder="Type public message to requester... (1–2000 chars)"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    disabled={postingComment}
                    data-testid="comment-textarea"
                  />
                  <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>Markdown supported</span>
                    <span>{commentInput.length} / 2000</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="zen-btn-primary w-100"
                  disabled={postingComment || !commentInput.trim()}
                  data-testid="submit-comment-btn"
                  style={{ minHeight: 44 }}
                >
                  {postingComment ? "Posting..." : "Post Public Comment"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* 2. Internal Notes Stream (Amber Warning Accent) */}
        <div className="col-12 col-lg-6">
          <div
            className="card shadow-sm h-100"
            data-testid="internal-notes-panel"
            style={{
              backgroundColor: "#FFFBEB",
              border: "2px solid #FDE68A",
            }}
          >
            <div
              className="card-header d-flex justify-content-between align-items-center"
              style={{ backgroundColor: "#FEF3C7", borderBottom: "2px solid #FCD34D" }}
            >
              <h5 className="mb-0 fw-bold" style={{ color: "#92400E" }}>
                🔒 Internal Notes
              </h5>
              <span
                className="badge"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                }}
              >
                Private to IT Staff & Admin
              </span>
            </div>
            <div className="card-body d-flex flex-column">
              <div
                className="alert py-2 small mb-3 border-warning text-warning-emphasis"
                style={{ backgroundColor: "#FEF9C3", borderColor: "#FDE047" }}
              >
                ⚠️ <strong>Staff Confidentiality:</strong> These notes are never visible to the requester. Use for internal diagnostics, handover notes, or team coordination.
              </div>

              {/* Internal Notes Feed */}
              <div
                className="flex-grow-1 overflow-auto mb-3"
                data-testid="notes-feed"
                style={{ maxHeight: 350, minHeight: 120 }}
              >
                {internalNotes.length === 0 ? (
                  <p className="text-muted text-center py-4">No internal notes posted yet.</p>
                ) : (
                  internalNotes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 mb-2 rounded border"
                      data-testid={`note-item-${n.id}`}
                      style={{
                        backgroundColor: "#FEFCE8",
                        borderLeft: "4px solid #D97706",
                        borderColor: "#FDE68A",
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong style={{ color: "#78350F" }}>{n.author.fullName}</strong>
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning small">
                          {n.author.role}
                        </span>
                      </div>
                      <p className="mb-1 small" style={{ color: "#451A03", whiteSpace: "pre-wrap" }}>
                        {n.content}
                      </p>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {formatDate(n.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Internal Note Form */}
              <form onSubmit={handlePostNote} data-testid="add-note-form">
                {noteError && (
                  <div className="alert alert-danger py-1 small mb-2">{noteError}</div>
                )}
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    rows={3}
                    maxLength={2000}
                    placeholder="Write confidential internal note... (1–2000 chars)"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    disabled={postingNote}
                    data-testid="note-textarea"
                    style={{ borderColor: "#FCD34D" }}
                  />
                  <div className="d-flex justify-content-between small text-muted mt-1">
                    <span>Confidential to staff</span>
                    <span>{noteInput.length} / 2000</span>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn w-100"
                  disabled={postingNote || !noteInput.trim()}
                  data-testid="submit-note-btn"
                  style={{
                    backgroundColor: "#D97706",
                    borderColor: "#B45309",
                    color: "white",
                    fontWeight: 600,
                    minHeight: 44,
                  }}
                >
                  {postingNote ? "Saving Note..." : "Post Internal Note"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
