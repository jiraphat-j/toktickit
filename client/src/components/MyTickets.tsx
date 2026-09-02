import React, { useState, useEffect, useCallback } from "react";
import {
  DevRequester,
  Category,
  Priority,
  TicketStatus,
  TicketListItem,
  TicketListResponse,
  fetchActiveCategories,
  fetchMyTickets,
} from "../api";

interface MyTicketsProps {
  currentRequester: DevRequester;
  onCreateTicketClick: () => void;
  onSelectTicket?: (ticketId: number) => void;
}

export const MyTickets: React.FC<MyTicketsProps> = ({
  currentRequester,
  onCreateTicketClick,
  onSelectTicket,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 8,
    total: 0,
    totalPages: 1,
  });

  // Query filters state
  const [searchInput, setSearchInput] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "ticketNumber">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track if requester has 0 tickets overall (empty state vs no-results)
  const [requesterTotalTickets, setRequesterTotalTickets] = useState<number | null>(null);

  // Check if any filter is active
  const isFilterActive =
    activeSearch.trim() !== "" ||
    selectedCategory !== "" ||
    selectedPriority !== "" ||
    selectedStatus !== "";

  // Load categories on mount
  useEffect(() => {
    let isMounted = true;
    fetchActiveCategories()
      .then((cats) => {
        if (isMounted) setCategories(cats);
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: TicketListResponse = await fetchMyTickets(currentRequester.id, {
        search: activeSearch.trim() || undefined,
        categoryId: selectedCategory ? parseInt(selectedCategory, 10) : undefined,
        requestedPriority: (selectedPriority as Priority) || undefined,
        currentStatus: (selectedStatus as TicketStatus) || undefined,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });

      let safeItems: TicketListItem[] = [];
      if (res && Array.isArray(res.items)) {
        safeItems = res.items;
      } else if (Array.isArray(res)) {
        safeItems = res;
      }
      setTickets(safeItems);

      if (res && res.pagination) {
        setPagination(res.pagination);
        if (!isFilterActive) {
          setRequesterTotalTickets(res.pagination.total);
        }
      } else {
        setPagination({
          page: 1,
          pageSize: 8,
          total: safeItems.length,
          totalPages: Math.max(1, Math.ceil(safeItems.length / 8)),
        });
        if (!isFilterActive) {
          setRequesterTotalTickets(safeItems.length);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  }, [
    currentRequester.id,
    activeSearch,
    selectedCategory,
    selectedPriority,
    selectedStatus,
    sortBy,
    sortOrder,
    page,
    pageSize,
    isFilterActive,
  ]);

  // When requester changes, reset filters and reload
  useEffect(() => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
    setSortBy("createdAt");
    setSortOrder("desc");
    setPage(1);
    setRequesterTotalTickets(null);
  }, [currentRequester.id]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  // Search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput);
    setPage(1);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchInput("");
    setActiveSearch("");
    setSelectedCategory("");
    setSelectedPriority("");
    setSelectedStatus("");
    setPage(1);
  };

  // Sorting handler
  const handleSort = (field: "createdAt" | "updatedAt" | "ticketNumber") => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setPage(1);
  };

  const renderSortIndicator = (field: "createdAt" | "updatedAt" | "ticketNumber") => {
    if (sortBy !== field) {
      return <span className="zen-sort-icon">⇅</span>;
    }
    return (
      <span className="zen-sort-icon active">
        {sortOrder === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getPriorityBadgeClass = (priority: Priority) => {
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

  return (
    <div className="zen-my-tickets-container">
      {/* Header Toolbar */}
      <div className="zen-toolbar">
        <div className="zen-toolbar-header">
          <div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, margin: 0 }}>My Tickets</h2>
            <p style={{ margin: "0.25rem 0 0", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              View and manage your submitted support requests
            </p>
          </div>
          <button
            type="button"
            className="zen-btn-primary"
            onClick={onCreateTicketClick}
          >
            + Create Ticket
          </button>
        </div>

        {/* Filter Controls Row */}
        <div className="zen-filter-row">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="zen-search-container">
            <input
              type="text"
              className="zen-search-input"
              placeholder="Search Ticket # or Summary..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search tickets"
            />
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
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
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
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
          </select>

          {/* Clear Filters Button */}
          {isFilterActive && (
            <button
              type="button"
              className="zen-btn-clear"
              onClick={handleClearFilters}
              aria-label="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="zen-alert-danger" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="zen-btn-secondary"
            style={{ marginLeft: "1rem", padding: "0.25rem 0.5rem", fontSize: "0.8rem" }}
            onClick={() => loadTickets()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State (initial) */}
      {loading && tickets.length === 0 ? (
        <div className="zen-state-card">
          <div className="zen-spinner" style={{ width: 32, height: 32 }} />
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>Loading your tickets...</p>
        </div>
      ) : (tickets || []).length === 0 ? (
        /* Empty State vs No-Results State (BR-28, AC-19, AC-20) */
        isFilterActive || (requesterTotalTickets !== null && requesterTotalTickets > 0) ? (
          /* No-Results State (Search/filter returned 0) */
          <div className="zen-state-card" data-testid="no-results-state">
            <div className="zen-state-icon">🔍</div>
            <h3 className="zen-state-title">No tickets match your criteria</h3>
            <p className="zen-state-desc">
              We couldn't find any tickets matching your current search or filter combination.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={handleClearFilters}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          /* Empty State (Requester has zero tickets ever) */
          <div className="zen-state-card" data-testid="empty-state">
            <div className="zen-state-icon">📋</div>
            <h3 className="zen-state-title">You haven't created any tickets yet</h3>
            <p className="zen-state-desc">
              Need assistance with hardware, software, or campus IT services? Submit your first ticket now.
            </p>
            <button
              type="button"
              className="zen-btn-primary"
              onClick={onCreateTicketClick}
            >
              + Create Ticket
            </button>
          </div>
        )
      ) : (
        <>
          {/* Desktop / Tablet Table View (>= 768px) */}
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
                  <th
                    className="zen-th-sortable"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSort("createdAt")}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("createdAt")}
                    aria-label="Sort by Created Date"
                  >
                    Created Date {renderSortIndicator("createdAt")}
                  </th>
                  <th
                    className="zen-th-sortable"
                    tabIndex={0}
                    role="button"
                    onClick={() => handleSort("updatedAt")}
                    onKeyDown={(e) => e.key === "Enter" && handleSort("updatedAt")}
                    aria-label="Sort by Last Updated"
                  >
                    Last Updated {renderSortIndicator("updatedAt")}
                  </th>
                  <th>Summary</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Attachments</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <span
                        className="zen-table-link"
                        style={{ fontFamily: "monospace" }}
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        {t.ticketNumber}
                      </span>
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      {formatDate(t.createdAt)}
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      {formatDate(t.updatedAt)}
                    </td>
                    <td style={{ fontWeight: 500 }}>
                      <span
                        className="zen-table-link"
                        onClick={() => onSelectTicket && onSelectTicket(t.id)}
                      >
                        {t.summary}
                      </span>
                    </td>
                    <td>
                      <span className="zen-category-badge">{t.category?.name || "General"}</span>
                    </td>
                    <td>
                      <span className={getPriorityBadgeClass(t.requestedPriority)}>
                        {t.requestedPriority}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          backgroundColor: "#DCFCE7",
                          color: "#166534",
                        }}
                      >
                        {t.currentStatus}
                      </span>
                    </td>
                    <td>
                      {t._count && t._count.attachments > 0 ? (
                        <span className="zen-attachment-badge">
                          📎 {t._count.attachments}
                        </span>
                      ) : (
                        <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (< 768px, AC-28, AC-29) */}
          <div className="zen-mobile-ticket-list" data-testid="mobile-ticket-list">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="zen-mobile-card"
                onClick={() => onSelectTicket && onSelectTicket(t.id)}
              >
                <div className="zen-mobile-card-top">
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--color-primary-green)" }}>
                    {t.ticketNumber}
                  </span>
                  <span className={getPriorityBadgeClass(t.requestedPriority)}>
                    {t.requestedPriority}
                  </span>
                </div>
                <div className="zen-mobile-card-summary">{t.summary}</div>
                <div className="zen-mobile-card-details">
                  <span>📂 {t.category?.name}</span>
                  <span>📅 Created: {formatDate(t.createdAt)}</span>
                  <span>🕒 Updated: {formatDate(t.updatedAt)}</span>
                  {t._count && t._count.attachments > 0 && (
                    <span>📎 {t._count.attachments}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Bar (AC-18, BR-27) */}
          <div className="zen-pagination-bar">
            {/* Total items info */}
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Showing {Math.min((pagination.page - 1) * pagination.pageSize + 1, pagination.total)}–
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} tickets
            </div>

            {/* Controls */}
            <div className="zen-page-controls">
              <button
                type="button"
                className="zen-page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                &laquo; Prev
              </button>

              {/* Numbered pages */}
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  type="button"
                  className={`zen-page-btn ${pNum === pagination.page ? "active" : ""}`}
                  onClick={() => setPage(pNum)}
                  aria-label={`Page ${pNum}`}
                >
                  {pNum}
                </button>
              ))}

              <button
                type="button"
                className="zen-page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                aria-label="Next page"
              >
                Next &raquo;
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="zen-page-size-label">
              <span>Per page:</span>
              <select
                className="zen-filter-select"
                style={{ minWidth: "70px", padding: "0.35rem 0.5rem" }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                aria-label="Page size"
              >
                <option value={8}>8</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
