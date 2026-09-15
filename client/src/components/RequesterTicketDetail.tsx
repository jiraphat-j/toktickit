import { useState, useEffect, useCallback } from "react";
import {
  DevRequester,
  TicketDetail,
  TicketComment,
  fetchTicketDetail,
  toggleProblemResolved,
  fetchTicketComments,
  createTicketComment,
} from "../api.js";
import { AttachmentSection, formatDate } from "./AttachmentSection.js";

export interface RequesterTicketDetailProps {
  ticketId: number;
  currentRequester: DevRequester;
  onBack: () => void;
}

export function RequesterTicketDetail({
  ticketId,
  currentRequester,
  onBack,
}: RequesterTicketDetailProps) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [resolving, setResolving] = useState<boolean>(false);
  const [resolveError, setResolveError] = useState<string>("");

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string>("");

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, commentsList] = await Promise.all([
        fetchTicketDetail(currentRequester.id, ticketId),
        fetchTicketComments(ticketId).catch(() => []),
      ]);
      setTicket(data);
      setComments(commentsList);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [currentRequester.id, ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

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

  const handleToggleResolved = async () => {
    if (!ticket) return;
    const newStatus = !ticket.problemAppearsResolved;
    setResolving(true);
    setResolveError("");
    try {
      const updated = await toggleProblemResolved(ticket.id, newStatus);
      setTicket((prev) => (prev ? { ...prev, problemAppearsResolved: updated.problemAppearsResolved } : null));
    } catch (err: any) {
      setResolveError(err.message || "Failed to update problem resolution indicator.");
    } finally {
      setResolving(false);
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
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

  const isTerminal = ticket?.currentStatus === "CLOSED" || ticket?.currentStatus === "CANCELLED";

  if (loading) {
    return (
      <div className="zen-card" style={{ padding: "3rem 2rem", textAlign: "center" }} data-testid="ticket-detail-loading">
        <div className="zen-spinner" style={{ width: 36, height: 36, margin: "0 auto 1rem" }} />
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading ticket details...</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="zen-card" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }} data-testid="ticket-detail-error">
        <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⚠️</div>
        <h3 style={{ color: "#991B1B", marginBottom: "0.5rem" }}>Unable to View Ticket</h3>
        <p style={{ color: "var(--color-text-muted)", maxWidth: 500, margin: "0 auto 1.5rem" }}>
          {error || "Ticket not found or you do not have permission to view it."}
        </p>
        <button type="button" className="zen-btn-primary" onClick={onBack}>
          ← Back to My Tickets
        </button>
      </div>
    );
  }

  return (
    <div className="zen-ticket-detail" data-testid="ticket-detail-screen">
      {/* Top Navigation Bar */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className="zen-btn-secondary"
          onClick={onBack}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          aria-label="Back to My Tickets"
        >
          ← Back to My Tickets
        </button>
      </div>

      {/* Main Ticket Card */}
      <div className="zen-card" style={{ marginBottom: "1.5rem" }}>
        {/* Ticket Header */}
        <div
          className="zen-ticket-detail-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "1rem",
            paddingBottom: "1rem",
            borderBottom: "1px solid var(--color-border-light)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-primary-green)",
                }}
                data-testid="ticket-number"
              >
                {ticket.ticketNumber}
              </span>
              <span
                style={{
                  display: "inline-block",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "4px",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  backgroundColor: "#DCFCE7",
                  color: "#166534",
                }}
                data-testid="ticket-status"
              >
                {ticket.currentStatus}
              </span>
              <span className={getPriorityBadgeClass(ticket.requestedPriority)} data-testid="ticket-priority">
                {ticket.requestedPriority}
              </span>
              {ticket.problemAppearsResolved && (
                <span
                  style={{
                    display: "inline-block",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    backgroundColor: "#FEF3C7",
                    color: "#92400E",
                    border: "1px solid #FDE68A",
                  }}
                  data-testid="problem-resolved-badge"
                >
                  Problem Appears Resolved
                </span>
              )}
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 600, margin: "0.75rem 0 0.25rem", color: "var(--color-text-main)" }}>
              {ticket.summary}
            </h2>
          </div>
          <div>
            <button
              type="button"
              onClick={handleToggleResolved}
              disabled={resolving || isTerminal}
              className={ticket.problemAppearsResolved ? "zen-btn-secondary" : "zen-btn-primary"}
              data-testid="toggle-problem-resolved-btn"
              style={{
                fontSize: "0.85rem",
                padding: "0.45rem 0.85rem",
                cursor: isTerminal ? "not-allowed" : "pointer",
                opacity: isTerminal ? 0.6 : 1,
              }}
            >
              {resolving
                ? "Updating..."
                : ticket.problemAppearsResolved
                ? "Undo Problem Resolved"
                : "Mark Problem as Resolved"}
            </button>
            {resolveError && (
              <p style={{ color: "#DC2626", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>{resolveError}</p>
            )}
          </div>
        </div>

        {/* Problem Appears Resolved Indicator Banner (UI-Spec 3.3, AC-08) */}
        {ticket.problemAppearsResolved && (
          <div
            style={{
              backgroundColor: "#DCFCE7",
              border: "1px solid #86EFAC",
              borderRadius: "6px",
              padding: "0.75rem 1rem",
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "#166534",
            }}
            data-testid="problem-resolved-banner"
          >
            <span style={{ fontSize: "1.1rem" }}>✓</span>
            <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>
              Requester has indicated this issue appears resolved. Awaiting IT Staff formal resolution.
            </span>
          </div>
        )}

        {/* Read-Only Metadata Grid (AC-21) */}
        <div
          className="zen-ticket-metadata-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            padding: "1.25rem 0",
            borderBottom: "1px solid var(--color-border-light)",
          }}
        >
          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              Requester
            </span>
            <strong style={{ fontSize: "0.95rem" }} data-testid="requester-name">
              {ticket.requester?.fullName || currentRequester.fullName}
            </strong>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              {ticket.requester?.email || currentRequester.email}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              Category
            </span>
            <span className="zen-category-badge" data-testid="ticket-category">
              {ticket.category?.name || "General"}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              Related System
            </span>
            <strong style={{ fontSize: "0.95rem" }} data-testid="ticket-system">
              {ticket.relatedSystem?.name || "N/A"}
            </strong>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              Created Date
            </span>
            <span style={{ fontSize: "0.9rem" }} data-testid="ticket-created-at">
              {formatDate(ticket.createdAt)}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", display: "block" }}>
              Last Updated
            </span>
            <span style={{ fontSize: "0.9rem" }} data-testid="ticket-updated-at">
              {formatDate(ticket.updatedAt)}
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div style={{ paddingTop: "1.25rem" }}>
          <h4 style={{ fontSize: "0.95rem", color: "var(--color-primary-green)", marginBottom: "0.5rem" }}>
            Description
          </h4>
          <div
            className="zen-description-box"
            style={{
              padding: "1rem",
              backgroundColor: "var(--color-card-bg-subtle, #F8FAFC)",
              borderRadius: "6px",
              border: "1px solid var(--color-border-light)",
              whiteSpace: "pre-wrap",
              fontSize: "0.95rem",
              lineHeight: 1.6,
              color: "var(--color-text-main)",
            }}
            data-testid="ticket-description"
          >
            {ticket.description}
          </div>
        </div>
      </div>

      {/* Attachment Section Component */}
      <div className="zen-card">
        <AttachmentSection
          ticketId={ticket.id}
          currentRequester={currentRequester}
          attachments={ticket.attachments || []}
          onAttachmentChange={loadTicket}
        />
      </div>

      {/* Public Comments Section (AC-09, BR-16) */}
      <div className="zen-card" style={{ marginTop: "1.5rem" }} data-testid="requester-comments-section">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 style={{ fontSize: "1.1rem", color: "var(--color-primary-green)", margin: 0 }}>
            💬 Public Comments
          </h4>
          <span
            className="badge"
            style={{ backgroundColor: "#E8F5E9", color: "#1B5E20", fontWeight: 600, padding: "4px 8px" }}
          >
            ✓ Visible to Requester & IT Staff
          </span>
        </div>

        {/* Comments Stream */}
        <div
          className="mb-3 overflow-auto"
          data-testid="requester-comments-feed"
          style={{ maxHeight: 350, minHeight: 80 }}
        >
          {comments.length === 0 ? (
            <p className="text-muted text-center py-3">No public comments yet.</p>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3 mb-2 rounded border"
                data-testid={`requester-comment-${c.id}`}
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
                <p className="mb-1 small" style={{ whiteSpace: "pre-wrap" }}>
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
        <form onSubmit={handlePostComment} data-testid="requester-add-comment-form">
          {commentError && (
            <div className="alert alert-danger py-1 small mb-2">{commentError}</div>
          )}
          <div className="mb-2">
            <textarea
              className="form-control"
              rows={3}
              maxLength={2000}
              placeholder="Type a message or response to IT Staff... (1–2000 chars)"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              disabled={postingComment}
              data-testid="requester-comment-textarea"
            />
            <div className="d-flex justify-content-between small text-muted mt-1">
              <span>Markdown supported</span>
              <span>{commentInput.length} / 2000</span>
            </div>
          </div>
          <button
            type="submit"
            className="zen-btn-primary"
            disabled={postingComment || !commentInput.trim()}
            data-testid="requester-submit-comment-btn"
            style={{ minHeight: 44 }}
          >
            {postingComment ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </div>
  );
}
