import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  StaffDashboardData,
  StaffDashboardTicket,
  StaffDashboardAction,
  fetchStaffDashboard,
} from "../api.js";

export interface StaffDashboardProps {
  currentUser: AuthUser;
  onSelectTicket?: (ticketId: number) => void;
  onNavigateQueue?: (filter?: { owner?: string; priority?: string; status?: string }) => void;
  initialData?: StaffDashboardData;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  currentUser,
  onSelectTicket,
  onNavigateQueue,
  initialData,
}) => {
  const [data, setData] = useState<StaffDashboardData | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const result = await fetchStaffDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to load operational dashboard.");
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

  // Priority badge styling helper
  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case "HIGH":
      case "CRITICAL":
        return "badge bg-danger";
      case "MEDIUM":
        return "badge bg-warning text-dark";
      case "LOW":
        return "badge bg-success";
      default:
        return "badge bg-secondary";
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div
        data-testid="dashboard-loading"
        className="text-center py-5"
        style={{ color: "var(--color-primary-green)" }}
      >
        <div className="spinner-border text-success" role="status" aria-label="Loading operational dashboard">
          <span className="visually-hidden">Loading operational dashboard…</span>
        </div>
        <p className="mt-3 fw-medium">Loading operational dashboard…</p>
      </div>
    );
  }

  // 2. Error State (Safe failure)
  if (error) {
    return (
      <div className="card shadow-sm p-4 border-danger my-4" data-testid="dashboard-error">
        <div className="alert alert-danger d-flex align-items-center justify-content-between mb-0" role="alert">
          <div>
            <strong>Error loading dashboard:</strong> {error}
          </div>
          <button
            type="button"
            className="zen-btn-secondary ms-3"
            onClick={() => loadDashboard()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    unassignedCount: 0,
    myTicketsCount: 0,
    criticalHighCount: 0,
    myActionsCount: 0,
  };

  const statusBreakdown = data?.statusBreakdown || {};
  const priorityBreakdown = data?.priorityBreakdown || {};
  const recentTickets = data?.recentTickets || [];
  const myRecentActions = data?.myRecentActions || [];

  return (
    <div className="zen-staff-dashboard" data-testid="staff-dashboard">
      {/* 1. Header / Welcome Banner */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="mb-1" style={{ color: "var(--color-primary-green)", fontWeight: 700 }}>
            IT Staff Operational Dashboard
          </h2>
          <p className="text-muted mb-0" style={{ fontSize: "0.95rem" }}>
            Operational workload overview for <strong>{currentUser.fullName}</strong> ({currentUser.role})
          </p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button
            type="button"
            className="zen-btn-secondary"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
          >
            <span>🔄</span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          {onNavigateQueue && (
            <button
              type="button"
              className="zen-btn-primary"
              onClick={() => onNavigateQueue()}
            >
              Ticket Queue →
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Cards (Grid of 4) */}
      <div className="row g-3 mb-4" data-testid="metric-cards-grid">
        {/* Card 1: Unassigned Tickets */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm h-100 p-3"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid #0284c7",
            }}
            data-testid="card-unassigned"
          >
            <div className="d-flex justify-content-between align-items-center text-muted mb-1">
              <span className="fw-semibold" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                Unassigned Tickets
              </span>
              <span style={{ fontSize: "1.2rem" }}>📋</span>
            </div>
            <div className="h2 mb-1 fw-bold" style={{ color: "var(--color-text-main)" }} data-testid="count-unassigned">
              {metrics.unassignedCount}
            </div>
            <div className="mt-auto pt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100 text-truncate"
                onClick={() => onNavigateQueue?.({ owner: "unassigned" })}
                style={{ fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
              >
                View Unassigned Queue →
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: My Assigned Tickets */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm h-100 p-3"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid var(--color-primary-green)",
            }}
            data-testid="card-my-tickets"
          >
            <div className="d-flex justify-content-between align-items-center text-muted mb-1">
              <span className="fw-semibold" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                My Assigned Tickets
              </span>
              <span style={{ fontSize: "1.2rem" }}>👤</span>
            </div>
            <div className="h2 mb-1 fw-bold" style={{ color: "var(--color-text-main)" }} data-testid="count-my-tickets">
              {metrics.myTicketsCount}
            </div>
            <div className="mt-auto pt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-success w-100 text-truncate"
                onClick={() => onNavigateQueue?.({ owner: String(currentUser.id) })}
                style={{
                  fontSize: "0.8rem",
                  borderRadius: "var(--radius-sm)",
                  color: "var(--color-primary-green)",
                  borderColor: "var(--color-primary-green)",
                }}
              >
                View My Tickets →
              </button>
            </div>
          </div>
        </div>

        {/* Card 3: High Priority Tickets */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm h-100 p-3"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid var(--color-error)",
            }}
            data-testid="card-high-priority"
          >
            <div className="d-flex justify-content-between align-items-center text-muted mb-1">
              <span className="fw-semibold" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                High Priority Active
              </span>
              <span style={{ fontSize: "1.2rem" }}>🔥</span>
            </div>
            <div className="h2 mb-1 fw-bold text-danger" data-testid="count-high-priority">
              {metrics.criticalHighCount}
            </div>
            <div className="mt-auto pt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger w-100 text-truncate"
                onClick={() => onNavigateQueue?.({ priority: "HIGH" })}
                style={{ fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
              >
                View High Priority →
              </button>
            </div>
          </div>
        </div>

        {/* Card 4: My Actions Logged */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div
            className="card shadow-sm h-100 p-3"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-md)",
              borderLeft: "4px solid #7c3aed",
            }}
            data-testid="card-my-actions"
          >
            <div className="d-flex justify-content-between align-items-center text-muted mb-1">
              <span className="fw-semibold" style={{ fontSize: "0.85rem", textTransform: "uppercase" }}>
                My Actions Logged
              </span>
              <span style={{ fontSize: "1.2rem" }}>🛠️</span>
            </div>
            <div className="h2 mb-1 fw-bold" style={{ color: "#7c3aed" }} data-testid="count-my-actions">
              {metrics.myActionsCount}
            </div>
            <div className="mt-auto pt-2">
              <span className="badge bg-light text-muted border w-100 py-1" style={{ fontSize: "0.8rem" }}>
                Personal Contribution
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Status Breakdown & Priority Workload Widgets */}
      <div className="row g-3 mb-4">
        {/* Status Distribution */}
        <div className="col-12 col-lg-8">
          <div className="card shadow-sm p-3 h-100" style={{ backgroundColor: "var(--color-surface)" }}>
            <h5 className="card-title fw-bold mb-3" style={{ color: "var(--color-primary-green)" }}>
              Ticket Status Breakdown
            </h5>
            <div className="d-flex flex-wrap gap-2" data-testid="status-breakdown-list">
              {[
                { key: "NEW", label: "New", color: "bg-info text-dark" },
                { key: "OPEN", label: "Open", color: "bg-primary text-white" },
                { key: "IN_PROGRESS", label: "In Progress", color: "bg-warning text-dark" },
                { key: "WAITING_FOR_REQUESTER", label: "Waiting for Requester", color: "bg-secondary text-white" },
                { key: "RESOLVED", label: "Resolved", color: "bg-success text-white" },
                { key: "CLOSED", label: "Closed", color: "bg-dark text-white" },
                { key: "REOPENED", label: "Reopened", color: "bg-danger text-white" },
                { key: "CANCELLED", label: "Cancelled", color: "bg-light text-muted border" },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  className={`btn btn-sm d-flex align-items-center gap-2 ${st.color}`}
                  onClick={() => onNavigateQueue?.({ status: st.key })}
                  style={{ borderRadius: "var(--radius-sm)", cursor: "pointer" }}
                  data-testid={`status-badge-${st.key}`}
                >
                  <span>{st.label}</span>
                  <span className="badge bg-white text-dark rounded-pill fw-bold">
                    {statusBreakdown[st.key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="col-12 col-lg-4">
          <div className="card shadow-sm p-3 h-100" style={{ backgroundColor: "var(--color-surface)" }}>
            <h5 className="card-title fw-bold mb-3" style={{ color: "var(--color-primary-green)" }}>
              Priority Distribution
            </h5>
            <div className="d-flex flex-column gap-2" data-testid="priority-breakdown-list">
              <div
                className="d-flex justify-content-between align-items-center p-2 rounded"
                style={{ backgroundColor: "#FEE2E2", cursor: "pointer" }}
                onClick={() => onNavigateQueue?.({ priority: "HIGH" })}
              >
                <span className="fw-semibold text-danger">High Priority</span>
                <span className="badge bg-danger rounded-pill fs-6">{priorityBreakdown["HIGH"] || 0}</span>
              </div>
              <div
                className="d-flex justify-content-between align-items-center p-2 rounded"
                style={{ backgroundColor: "#FEF3C7", cursor: "pointer" }}
                onClick={() => onNavigateQueue?.({ priority: "MEDIUM" })}
              >
                <span className="fw-semibold text-warning-emphasis">Medium Priority</span>
                <span className="badge bg-warning text-dark rounded-pill fs-6">{priorityBreakdown["MEDIUM"] || 0}</span>
              </div>
              <div
                className="d-flex justify-content-between align-items-center p-2 rounded"
                style={{ backgroundColor: "#DCFCE7", cursor: "pointer" }}
                onClick={() => onNavigateQueue?.({ priority: "LOW" })}
              >
                <span className="fw-semibold text-success">Low Priority</span>
                <span className="badge bg-success rounded-pill fs-6">{priorityBreakdown["LOW"] || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Recent Tickets Table & My Recent Actions */}
      <div className="row g-4 mb-4">
        {/* Recent Tickets Table */}
        <div className="col-12 col-xl-7">
          <div className="card shadow-sm p-3 h-100" style={{ backgroundColor: "var(--color-surface)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title fw-bold mb-0" style={{ color: "var(--color-primary-green)" }}>
                Recently Updated Tickets
              </h5>
              <span className="text-muted" style={{ fontSize: "0.85rem" }}>
                Top {recentTickets.length} active tickets
              </span>
            </div>

            {recentTickets.length === 0 ? (
              <div className="text-center py-4 text-muted border rounded" data-testid="empty-recent-tickets">
                No tickets recorded yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: "0.9rem" }}>
                  <thead className="table-light">
                    <tr>
                      <th>Ticket #</th>
                      <th>Summary</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Owner</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTickets.map((t: StaffDashboardTicket) => (
                      <tr key={t.id} data-testid={`recent-ticket-row-${t.id}`}>
                        <td className="fw-bold font-monospace" style={{ fontSize: "0.85rem" }}>
                          {t.ticketNumber}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 180 }} title={t.summary}>
                          {t.summary}
                        </td>
                        <td>
                          <span className={getStatusBadgeClass(t.currentStatus || t.status || "")}>
                            {t.currentStatus || t.status}
                          </span>
                        </td>
                        <td>
                          <span className={getPriorityBadgeClass(t.itPriority)}>
                            {t.itPriority}
                          </span>
                        </td>
                        <td className="text-muted" style={{ fontSize: "0.85rem" }}>
                          {t.primaryOwner?.fullName || t.owner?.name || "Unassigned"}
                        </td>
                        <td>
                          {onSelectTicket && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              onClick={() => onSelectTicket(t.id)}
                              style={{ fontSize: "0.8rem", borderRadius: "var(--radius-sm)" }}
                            >
                              Open
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

        {/* My Recent Actions Taken */}
        <div className="col-12 col-xl-5">
          <div className="card shadow-sm p-3 h-100" style={{ backgroundColor: "var(--color-surface)" }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title fw-bold mb-0" style={{ color: "var(--color-primary-green)" }}>
                My Recent Actions Taken
              </h5>
              <span className="badge bg-light text-muted border" style={{ fontSize: "0.75rem" }}>
                Last 5
              </span>
            </div>

            {myRecentActions.length === 0 ? (
              <div className="text-center py-4 text-muted border rounded" data-testid="empty-recent-actions">
                You have not logged any actions taken yet.
              </div>
            ) : (
              <div className="d-flex flex-column gap-2" data-testid="my-recent-actions-list">
                {myRecentActions.map((act: StaffDashboardAction) => (
                  <div
                    key={act.id}
                    className="p-2 border rounded"
                    style={{ backgroundColor: "var(--color-page-bg)", fontSize: "0.85rem" }}
                    data-testid={`recent-action-item-${act.id}`}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-bold font-monospace text-primary">
                        {act.ticketNumber}
                      </span>
                      <span className="text-muted" style={{ fontSize: "0.75rem" }}>
                        {formatDate(act.actionDateTime)}
                      </span>
                    </div>
                    <div className="text-truncate fw-medium mb-1" title={act.description}>
                      {act.description}
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: "0.8rem" }} title={act.result}>
                      <em>Result:</em> {act.result}
                    </div>
                    {onSelectTicket && (
                      <div className="text-end mt-1">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none"
                          style={{ fontSize: "0.75rem", color: "var(--color-secondary-green)" }}
                          onClick={() => onSelectTicket(act.ticketId)}
                        >
                          View Ticket Details →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StaffDashboard;
