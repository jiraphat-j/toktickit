import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  RequesterDashboardData,
  RequesterDashboardTicket,
  fetchRequesterDashboard,
} from "../api.js";

export interface RequesterDashboardProps {
  currentUser: AuthUser;
  onSelectTicket?: (ticketId: number) => void;
  onCreateTicket?: () => void;
  onNavigateMyTickets?: (filter?: { status?: string }) => void;
  initialData?: RequesterDashboardData;
}

export const RequesterDashboard: React.FC<RequesterDashboardProps> = ({
  currentUser,
  onSelectTicket,
  onCreateTicket,
  onNavigateMyTickets,
  initialData,
}) => {
  const [data, setData] = useState<RequesterDashboardData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchRequesterDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load support dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!initialData) {
      loadDashboard();
    }
  }, [initialData, loadDashboard]);

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  // Status badge styling helper
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "NEW":
        return "badge bg-info text-dark";
      case "OPEN":
        return "badge bg-primary";
      case "IN_PROGRESS":
        return "badge bg-warning text-dark";
      case "WAITING_FOR_REQUESTER":
        return "badge bg-secondary";
      case "RESOLVED":
        return "badge bg-success";
      case "CLOSED":
        return "badge bg-dark";
      case "REOPENED":
        return "badge bg-danger";
      case "CANCELLED":
        return "badge bg-light text-muted border";
      default:
        return "badge bg-secondary";
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "WAITING_FOR_REQUESTER":
        return "Waiting for You";
      case "IN_PROGRESS":
        return "In Progress";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  // Priority badge styling helper
  const getPriorityBadgeClass = (priority?: string) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return "badge bg-danger";
      case "MEDIUM":
        return "badge bg-warning text-dark";
      case "LOW":
        return "badge bg-success";
      default:
        return "badge bg-light text-dark border";
    }
  };

  if (loading) {
    return (
      <div
        className="text-center py-5"
        data-testid="requester-dashboard-loading"
        style={{ minHeight: "350px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}
      >
        <div
          className="spinner-border text-success"
          role="status"
          style={{ width: "3rem", height: "3rem", color: "#006B3C" }}
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted" style={{ fontWeight: 500 }}>
          Loading your dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger my-4 p-4 shadow-sm" role="alert" data-testid="requester-dashboard-error">
        <h4 className="alert-heading fw-bold">Unable to Load Dashboard</h4>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <button
            type="button"
            className="btn btn-outline-danger px-4"
            onClick={() => loadDashboard()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalOpenTickets: 0,
    totalOpen: 0,
    waitingForRequesterCount: 0,
    waitingForRequester: 0,
    recentlyUpdatedCount: 0,
    recentlyUpdated: 0,
    recentlyResolvedCount: 0,
    recentlyResolved: 0,
    inProgress: 0,
    closed: 0,
  };

  const attentionTickets = data?.attentionTickets || [];
  const recentTickets = data?.recentTickets || [];
  const isCompletelyEmpty = metrics.totalOpenTickets === 0 && recentTickets.length === 0;

  return (
    <div className="requester-dashboard pb-5" data-testid="requester-dashboard">
      {/* 1. Header Banner */}
      <div
        className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 p-4 mb-4 rounded-3 shadow-sm"
        style={{
          backgroundColor: "#FFFFFF",
          borderLeft: "6px solid #006B3C",
          border: "1px solid #E5E7EB",
          borderLeftWidth: "6px",
        }}
      >
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: "#111827" }}>
            My Support Dashboard
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Welcome back, <strong>{currentUser.fullName}</strong>. Here is a summary of your active tickets.
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            title="Refresh dashboard metrics"
          >
            {refreshing ? "Refreshing..." : "↻ Refresh"}
          </button>
          {onCreateTicket && (
            <button
              type="button"
              className="btn btn-success fw-semibold shadow-sm d-flex align-items-center gap-2"
              style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
              onClick={onCreateTicket}
            >
              <span>+</span> Create New Ticket
            </button>
          )}
        </div>
      </div>

      {/* 2. Operational Metric Cards Grid */}
      <div className="row g-3 mb-4">
        {/* Card 1: Total Open Tickets */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card h-100 shadow-sm border-0 position-relative"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "4px solid #006B3C",
              cursor: onNavigateMyTickets ? "pointer" : "default",
              transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            }}
            onClick={() => onNavigateMyTickets && onNavigateMyTickets()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigateMyTickets && onNavigateMyTickets();
              }
            }}
            aria-label="View Open Tickets"
            data-testid="card-open-tickets"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Open Tickets
                </span>
                <div className="display-6 fw-bold mt-2" style={{ color: "#006B3C" }}>
                  {metrics.totalOpenTickets}
                </div>
              </div>
              <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <small className="text-muted">Active requests</small>
                <small className="fw-semibold" style={{ color: "#006B3C" }}>
                  View All →
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Action Needed (Waiting for Requester) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card h-100 shadow-sm border-0 position-relative"
            style={{
              backgroundColor: metrics.waitingForRequesterCount > 0 ? "#FFFBEB" : "#FFFFFF",
              borderTop: metrics.waitingForRequesterCount > 0 ? "4px solid #D97706" : "4px solid #9CA3AF",
              cursor: onNavigateMyTickets ? "pointer" : "default",
              transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            }}
            onClick={() => onNavigateMyTickets && onNavigateMyTickets({ status: "WAITING_FOR_REQUESTER" })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigateMyTickets && onNavigateMyTickets({ status: "WAITING_FOR_REQUESTER" });
              }
            }}
            aria-label="View Action Needed Tickets"
            data-testid="card-waiting-requester"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Action Needed (Waiting on You)
                </span>
                <div
                  className="display-6 fw-bold mt-2"
                  style={{ color: metrics.waitingForRequesterCount > 0 ? "#D97706" : "#6B7280" }}
                >
                  {metrics.waitingForRequesterCount}
                </div>
              </div>
              <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <small className="text-muted">Awaiting your response</small>
                <small className="fw-semibold" style={{ color: metrics.waitingForRequesterCount > 0 ? "#D97706" : "#6B7280" }}>
                  Review →
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recently Updated (Last 7 Days) */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card h-100 shadow-sm border-0 position-relative"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "4px solid #2563EB",
              cursor: onNavigateMyTickets ? "pointer" : "default",
              transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            }}
            onClick={() => onNavigateMyTickets && onNavigateMyTickets()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigateMyTickets && onNavigateMyTickets();
              }
            }}
            aria-label="View Recently Updated Tickets"
            data-testid="card-recently-updated"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Recently Updated
                </span>
                <div className="display-6 fw-bold mt-2" style={{ color: "#2563EB" }}>
                  {metrics.recentlyUpdatedCount}
                </div>
              </div>
              <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <small className="text-muted">Past 7 days</small>
                <small className="fw-semibold" style={{ color: "#2563EB" }}>
                  Check Activity →
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Recently Resolved */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card h-100 shadow-sm border-0 position-relative"
            style={{
              backgroundColor: "#FFFFFF",
              borderTop: "4px solid #059669",
              cursor: onNavigateMyTickets ? "pointer" : "default",
              transition: "transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out",
            }}
            onClick={() => onNavigateMyTickets && onNavigateMyTickets({ status: "RESOLVED" })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNavigateMyTickets && onNavigateMyTickets({ status: "RESOLVED" });
              }
            }}
            aria-label="View Recently Resolved Tickets"
            data-testid="card-recently-resolved"
          >
            <div className="card-body p-3 d-flex flex-column justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: "0.75rem", letterSpacing: "0.5px" }}>
                  Recently Resolved
                </span>
                <div className="display-6 fw-bold mt-2" style={{ color: "#059669" }}>
                  {metrics.recentlyResolvedCount}
                </div>
              </div>
              <div className="mt-3 pt-2 border-top d-flex justify-content-between align-items-center">
                <small className="text-muted">Completed tickets</small>
                <small className="fw-semibold" style={{ color: "#059669" }}>
                  View Resolved →
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Empty State Encouragement (When 0 tickets exist) */}
      {isCompletelyEmpty && (
        <div
          className="card text-center p-5 shadow-sm border-0 my-4"
          style={{ backgroundColor: "#FFFFFF", borderRadius: "12px" }}
          data-testid="requester-dashboard-empty"
        >
          <div className="mb-3" style={{ fontSize: "3rem" }}>
            🟢
          </div>
          <h3 className="h4 fw-bold text-dark mb-2">You have no active support tickets</h3>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: "460px" }}>
            Need help with hardware, software, or network access? Our IT Staff team is ready to assist you.
          </p>
          <div>
            {onCreateTicket && (
              <button
                type="button"
                className="btn btn-success px-4 py-2 fw-semibold"
                style={{ backgroundColor: "#006B3C", borderColor: "#006B3C" }}
                onClick={onCreateTicket}
              >
                + Create a Ticket
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. Attention Required Section (Waiting for Requester) */}
      {!isCompletelyEmpty && attentionTickets.length > 0 && (
        <div className="mb-4" data-testid="attention-required-section">
          <div
            className="p-3 rounded-3 shadow-sm mb-3 d-flex align-items-center gap-3"
            style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
          >
            <span style={{ fontSize: "1.4rem" }}>⚠️</span>
            <div>
              <h2 className="h6 fw-bold mb-0 text-dark">Tickets Needing Your Attention</h2>
              <small className="text-muted">
                Staff has requested additional information. Please provide feedback to help resolve these requests.
              </small>
            </div>
          </div>

          <div className="row g-3">
            {attentionTickets.map((ticket: RequesterDashboardTicket) => (
              <div key={ticket.id} className="col-12 col-md-6">
                <div
                  className="card h-100 shadow-sm border-0"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderLeft: "4px solid #D97706",
                    transition: "box-shadow 0.15s ease",
                  }}
                >
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-light text-dark border font-monospace">
                        {ticket.ticketNumber}
                      </span>
                      <span className={getStatusBadgeClass(ticket.currentStatus)}>
                        {formatStatus(ticket.currentStatus)}
                      </span>
                    </div>
                    <h3 className="h6 fw-bold text-dark mb-2 text-truncate" title={ticket.summary}>
                      {ticket.summary}
                    </h3>
                    <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                      <small className="text-muted">Updated: {formatDate(ticket.updatedAt)}</small>
                      {onSelectTicket && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning text-dark fw-semibold"
                          onClick={() => onSelectTicket(ticket.id)}
                        >
                          Respond / View →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Tickets Section */}
      {!isCompletelyEmpty && (
        <div className="card shadow-sm border-0" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
            <div>
              <h2 className="h5 fw-bold mb-0" style={{ color: "#111827" }}>
                Recent Tickets
              </h2>
              <small className="text-muted">Your 5 most recently active support requests</small>
            </div>
            {onNavigateMyTickets && (
              <button
                type="button"
                className="btn btn-sm btn-outline-success fw-semibold"
                style={{ borderColor: "#006B3C", color: "#006B3C" }}
                onClick={() => onNavigateMyTickets()}
              >
                View All My Tickets
              </button>
            )}
          </div>

          <div className="card-body p-0">
            {recentTickets.length === 0 ? (
              <div className="text-center py-4 text-muted">No recent tickets to display.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th scope="col" style={{ width: "160px" }}>Ticket #</th>
                      <th scope="col">Summary</th>
                      <th scope="col" style={{ width: "150px" }}>Status</th>
                      <th scope="col" style={{ width: "100px" }}>Priority</th>
                      <th scope="col" style={{ width: "170px" }}>Last Updated</th>
                      <th scope="col" className="text-end" style={{ width: "120px" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((ticket: RequesterDashboardTicket) => (
                      <tr key={ticket.id}>
                        <td>
                          <span className="font-monospace fw-semibold" style={{ color: "#006B3C" }}>
                            {ticket.ticketNumber}
                          </span>
                        </td>
                        <td>
                          <span
                            className="fw-medium text-dark text-truncate d-inline-block"
                            style={{ maxWidth: "340px", verticalAlign: "middle" }}
                            title={ticket.summary}
                          >
                            {ticket.summary}
                          </span>
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(ticket.currentStatus)}>
                            {formatStatus(ticket.currentStatus)}
                          </span>
                        </td>
                        <td>
                          <span className={getPriorityBadgeClass(ticket.itPriority || ticket.requestedPriority)}>
                            {ticket.itPriority || ticket.requestedPriority || "MEDIUM"}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(ticket.updatedAt)}</td>
                        <td className="text-end">
                          {onSelectTicket && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => onSelectTicket(ticket.id)}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
