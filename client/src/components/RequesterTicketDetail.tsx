import { useState, useEffect, useCallback } from "react";
import { DevRequester, TicketDetail, fetchTicketDetail } from "../api.js";
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

  const loadTicket = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchTicketDetail(currentRequester.id, ticketId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details.");
    } finally {
      setLoading(false);
    }
  }, [currentRequester.id, ticketId]);

  useEffect(() => {
    loadTicket();
  }, [loadTicket]);

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
            </div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 600, margin: "0.75rem 0 0.25rem", color: "var(--color-text-main)" }}>
              {ticket.summary}
            </h2>
          </div>
        </div>

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
    </div>
  );
}
