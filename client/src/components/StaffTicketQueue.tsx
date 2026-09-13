import React, { useState, useEffect, useCallback } from "react";
import {
  AuthUser,
  Category,
  Priority,
  StaffTicketStatus,
  StaffTicketSummary,
  StaffTicketQueueResponse,
  StaffMember,
  fetchActiveCategories,
  fetchStaffTickets,
  fetchStaffMembers,
} from "../api";

export interface StaffTicketQueueProps {
  currentUser: AuthUser;
  onSelectTicket?: (ticketId: number) => void;
}

export const StaffTicketQueue: React.FC<StaffTicketQueueProps> = ({
  currentUser,
  onSelectTicket,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [tickets, setTickets] = useState<StaffTicketSummary[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Query filters state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "ticketNumber" | "itPriority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if system has 0 tickets overall (empty state vs no-results state)
  const [totalQueueTickets, setTotalQueueTickets] = useState<number | null>(null);

  // Check if any filter is active
  const isFilterActive =
    activeSearch.trim() !== "" ||
    selectedCategory !== "" ||
    selectedPriority !== "" ||
    selectedStatus !== "" ||
    selectedOwner !== "";

  // Load initial reference data: Categories and Staff Members
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchActiveCategories(), fetchStaffMembers()])
      .then(([cats, members]) => {
        if (isMounted) {
          setCategories(cats);
          setStaffMembers(members);
        }
      })
      .catch((err) => {
        console.error("Failed to load reference data for staff queue:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch staff tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: StaffTicketQueueResponse = await fetchStaffTickets({
        search: activeSearch.trim() || undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        itPriority: (selectedPriority as Priority) || undefined,
        currentStatus: (selectedStatus as StaffTicketStatus) || undefined,
        ownerId: selectedOwner || undefined,
        sortBy,
        sortOrder,
        page,
        limit,
      });

      setTickets(res.items || []);
      if (res.pagination) {
        setPagination(res.pagination);
        if (!isFilterActive) {
          setTotalQueueTickets(res.pagination.totalItems);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load staff tickets.");
    } finally {
      setLoading(false);
    }
  }, [
    activeSearch,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    selectedOwner,
    sortBy,
    sortOrder,
    page,
    limit,
    isFilterActive,
  ]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
    setSelectedOwner("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
  };

  // Toggle sorting on column click
  const handleSort = (column: "createdAt" | "updatedAt" | "ticketNumber" | "itPriority") => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder(column === "ticketNumber" ? "asc" : "desc");
    }
    setPage(1);
  };

  const renderSortIndicator = (column: "createdAt" | "updatedAt" | "ticketNumber" | "itPriority") => {
    if (sortBy !== column) {
      return <span style={{ opacity: 0.3, marginLeft: "0.25rem" }}>↕</span>;
    }
    return (
      <span style={{ marginLeft: "0.25rem", color: "var(--color-primary-green)" }}>
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case "HIGH":
        return "zen-priority-badge zen-priority-high";
      case "MEDIUM":
        return "zen-priority-badge zen-priority-medium";
      case "LOW":
      default:
        return "zen-priority-badge zen-priority-low";
    }
  };

  const getStatusBadgeStyle = (status: StaffTicketStatus): React.CSSProperties => {
    switch (status) {
      case "NEW":
        return { backgroundColor: "#DCFCE7", color: "#166534", border: "1px solid #86EFAC" };
      case "OPEN":
        return { backgroundColor: "#E0F2FE", color: "#075985", border: "1px solid #7DD3FC" };
      case "IN_PROGRESS":
        return { backgroundColor: "#FEF3C7", color: "#92400E", border: "1px solid #FCD34D" };
      case "RESOLVED":
        return { backgroundColor: "#F3F4F6", color: "#374151", border: "1px solid #D1D5DB" };
      default:
        return { backgroundColor: "#F3F4F6", color: "#374151" };
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="zen-my-tickets-container" data-testid="staff-ticket-queue">
      {/* Queue Header */}
      <div className="zen-toolbar-header" style={{ marginBottom: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0, color: "var(--color-text-dark)" }}>
            IT Staff Ticket Queue
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
            Monitor, filter, and manage incoming support tickets across departments
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="zen-toolbar-card" style={{ marginBottom: "1.25rem" }}>
        <div className="zen-filter-row" style={{ flexWrap: "wrap", gap: "0.75rem" }}>
          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="zen-search-container"
            style={{ flex: "1 1 240px", minWidth: "220px", display: "flex", gap: "0.5rem" }}
          >
            <input
              type="text"
              className="zen-search-input"
              placeholder="Search by ticket # or summary..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search tickets"
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="zen-btn-primary"
              style={{ minHeight: "44px", padding: "0 1rem" }}
              aria-label="Submit search"
            >
              Search
            </button>
            {activeSearch && (
              <button
                type="button"
                className="zen-btn-clear"
                onClick={() => {
                  setSearchInput("");
                  setActiveSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                style={{ minHeight: "44px" }}
              >
                ✕
              </button>
            )}
          </form>

          {/* Category Filter */}
          <select
            className="zen-filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Category"
            style={{ minHeight: "44px" }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="zen-filter-select"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Status"
            style={{ minHeight: "44px" }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          {/* Priority Filter */}
          <select
            className="zen-filter-select"
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Priority"
            style={{ minHeight: "44px" }}
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          {/* Owner Filter */}
          <select
            className="zen-filter-select"
            value={selectedOwner}
            onChange={(e) => {
              setSelectedOwner(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Owner"
            style={{ minHeight: "44px" }}
          >
            <option value="">All Owners</option>
            <option value="unassigned">Unassigned Only</option>
            <option value="me">Assigned to Me</option>
            {staffMembers
              .filter((m) => m.id !== currentUser.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
          </select>

          {/* Page Size */}
          <select
            className="zen-filter-select"
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            aria-label="Page Size"
            style={{ minHeight: "44px", width: "90px" }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>

          {/* Clear Filters Button */}
          {isFilterActive && (
            <button
              type="button"
              className="zen-btn-clear"
              onClick={handleClearFilters}
              aria-label="Clear all filters"
              style={{ minHeight: "44px", padding: "0 1rem" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="zen-alert-danger" role="alert" style={{ marginBottom: "1rem" }}>
          <span>{error}</span>
          <button
            type="button"
            className="zen-btn-secondary"
            style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem", fontSize: "0.8rem", minHeight: "44px" }}
            onClick={() => loadTickets()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && tickets.length === 0 ? (
        <div className="zen-state-card" style={{ padding: "3rem" }}>
          <div className="zen-spinner" style={{ width: 36, height: 36, margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading staff queue tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        /* Empty State vs No-Results State */
        isFilterActive || (totalQueueTickets !== null && totalQueueTickets > 0) ? (
          /* No-Results State */
          <div className="zen-state-card" data-testid="no-results-state" style={{ padding: "3rem 1.5rem" }}>
            <div className="zen-state-icon" style={{ fontSize: "2.5rem" }}>🔍</div>
            <h3 className="zen-state-title" style={{ marginTop: "0.75rem" }}>No tickets match your filters</h3>
            <p className="zen-state-desc" style={{ maxWidth: "460px", margin: "0.5rem auto 1.5rem" }}>
              There are no support tickets in the queue matching the selected combination of criteria.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={handleClearFilters}
              style={{ minHeight: "44px", padding: "0 1.5rem" }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Empty State (0 tickets in system) */
          <div className="zen-state-card" data-testid="empty-state" style={{ padding: "3rem 1.5rem" }}>
            <div className="zen-state-icon" style={{ fontSize: "2.5rem" }}>📥</div>
            <h3 className="zen-state-title" style={{ marginTop: "0.75rem" }}>Ticket queue is empty</h3>
            <p className="zen-state-desc" style={{ maxWidth: "460px", margin: "0.5rem auto 1.5rem" }}>
              All tickets have been addressed or no tickets have been created yet.
            </p>
          </div>
        )
      ) : (
        <>
          {/* Desktop / Tablet Table View (>= 768px, AC-12, AC-22) */}
          <div className="zen-table-container">
            <table className="zen-table">
              <thead>
                <tr>
                  <th
                    className="zen-th-sortable"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSort("ticketNumber")}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("ticketNumber")}
                    aria-label="Sort by Ticket Number"
                  >
                    Ticket No {renderSortIndicator("ticketNumber")}
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Requester</th>
                  <th
                    className="zen-th-sortable"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSort("itPriority")}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("itPriority")}
                    aria-label="Sort by IT Priority"
                  >
                    IT Priority {renderSortIndicator("itPriority")}
                  </th>
                  <th>Status</th>
                  <th>Assigned Owner</th>
                  <th
                    className="zen-th-sortable"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSort("createdAt")}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("createdAt")}
                    aria-label="Sort by Created Date"
                  >
                    Created {renderSortIndicator("createdAt")}
                  </th>
                  <th style={{ textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <button
                        type="button"
                        className="zen-table-link"
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                        aria-label={`Open ticket ${t.ticketNumber}`}
                      >
                        {t.ticketNumber}
                      </button>
                    </td>
                    <td style={{ maxWidth: "260px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <span
                          style={{
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={t.summary}
                        >
                          {t.summary}
                        </span>
                        {t.problemAppearsResolved && (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              width: "fit-content",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              border: "1px solid #FCD34D",
                            }}
                          >
                            ✓ Problem Appears Resolved
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="zen-category-badge">{t.category?.name || "General"}</span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.85rem" }}>
                        <span style={{ fontWeight: 500 }}>{t.requester?.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(t.itPriority)}>
                        {t.itPriority}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                          ...getStatusBadgeStyle(t.currentStatus),
                        }}
                      >
                        {t.currentStatus}
                      </span>
                    </td>
                    <td>
                      {t.primaryOwner ? (
                        <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text-dark)" }}>
                          👤 {t.primaryOwner.fullName}
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-block",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            backgroundColor: "#FEE2E2",
                            color: "#991B1B",
                            border: "1px solid #FCA5A5",
                          }}
                        >
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="zen-btn-secondary"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          fontSize: "0.82rem",
                          minHeight: "44px",
                          cursor: "pointer",
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card List (< 768px, AC-22, >= 44px touch targets) */}
          <div className="zen-mobile-ticket-list" data-testid="mobile-ticket-list">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="zen-mobile-card"
                onClick={() => onSelectTicket && onSelectTicket(t.id)}
                style={{ cursor: "pointer", minHeight: "44px" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && onSelectTicket && onSelectTicket(t.id)}
                aria-label={`Open ticket ${t.ticketNumber}`}
              >
                <div className="zen-mobile-card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary-green)", fontSize: "1rem" }}>
                    {t.ticketNumber}
                  </span>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span className={getPriorityBadgeClass(t.itPriority)}>
                      {t.itPriority}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        ...getStatusBadgeStyle(t.currentStatus),
                      }}
                    >
                      {t.currentStatus}
                    </span>
                  </div>
                </div>

                <div className="zen-mobile-card-summary" style={{ margin: "0.5rem 0", fontWeight: 600 }}>
                  {t.summary}
                </div>

                {t.problemAppearsResolved && (
                  <div style={{ marginBottom: "0.5rem" }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        backgroundColor: "#FEF3C7",
                        color: "#92400E",
                        border: "1px solid #FCD34D",
                      }}
                    >
                      ✓ Problem Appears Resolved
                    </span>
                  </div>
                )}

                <div className="zen-mobile-card-details" style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                  <div>📂 {t.category?.name}</div>
                  <div>👤 Requester: {t.requester?.fullName}</div>
                  <div>
                    🛠️ Owner:{" "}
                    {t.primaryOwner ? (
                      <span style={{ fontWeight: 600, color: "var(--color-text-dark)" }}>{t.primaryOwner.fullName}</span>
                    ) : (
                      <span style={{ color: "#DC2626", fontWeight: 600 }}>Unassigned</span>
                    )}
                  </div>
                  <div>📅 Created: {formatDate(t.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Toolbar (AC-12, BR-23) */}
          <div className="zen-pagination-bar" style={{ marginTop: "1rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Showing {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.totalItems)}–
              {Math.min(pagination.page * pagination.limit, pagination.totalItems)} of {pagination.totalItems} tickets
            </div>

            <div className="zen-page-controls" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <button
                type="button"
                className="zen-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                style={{ minHeight: "44px", minWidth: "44px", padding: "0 0.75rem" }}
              >
                &laquo; Prev
              </button>

              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>

              <button
                type="button"
                className="zen-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                aria-label="Next page"
                style={{ minHeight: "44px", minWidth: "44px", padding: "0 0.75rem" }}
              >
                Next &raquo;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
