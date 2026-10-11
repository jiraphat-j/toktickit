import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { StaffDashboard } from "../../src/components/StaffDashboard";
import { AuthUser, StaffDashboardData } from "../../src/api";
import * as api from "../../src/api";

describe("StaffDashboard UI Component Tests (Issue #61 / UI-DASH-01, STYLE-01, RESP-01, AC-10, AC-11, AC-13)", () => {
  const mockStaffUser: AuthUser = {
    id: 2,
    fullName: "Somsak ITStaff",
    email: "somsak@toktickit.com",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
  };

  const mockDashboardData: StaffDashboardData = {
    metrics: {
      unassignedCount: 7,
      myTicketsCount: 4,
      criticalHighCount: 3,
      myActionsCount: 12,
      unassigned: 7,
      myAssigned: 4,
      new: 5,
      open: 2,
      inProgress: 6,
      waitingForRequester: 2,
      recentlyUpdated: 10,
      priorityCounts: {
        high: 3,
        medium: 6,
        low: 4,
      },
    },
    statusBreakdown: {
      NEW: 5,
      OPEN: 2,
      IN_PROGRESS: 6,
      WAITING_FOR_REQUESTER: 2,
      RESOLVED: 4,
      CLOSED: 15,
      REOPENED: 1,
      CANCELLED: 2,
    },
    priorityBreakdown: {
      LOW: 4,
      MEDIUM: 6,
      HIGH: 3,
      CRITICAL: 0,
    },
    recentTickets: [
      {
        id: 16,
        ticketNumber: "TKT-2026-000016",
        summary: "Database connection timeout in Lab 502",
        currentStatus: "IN_PROGRESS",
        status: "IN_PROGRESS",
        itPriority: "HIGH",
        primaryOwner: {
          id: 2,
          fullName: "Somsak ITStaff",
        },
        owner: {
          id: 2,
          name: "Somsak ITStaff",
        },
        updatedAt: "2026-09-29T11:30:00.000Z",
      },
      {
        id: 17,
        ticketNumber: "TKT-2026-000017",
        summary: "Wi-Fi access point reboot required in CB2",
        currentStatus: "NEW",
        status: "NEW",
        itPriority: "MEDIUM",
        primaryOwner: null,
        owner: null,
        updatedAt: "2026-09-29T11:00:00.000Z",
      },
    ],
    myRecentActions: [
      {
        id: 10,
        ticketId: 14,
        ticketNumber: "TKT-2026-000014",
        actionDateTime: "2026-09-29T10:30:00.000Z",
        description: "Reconfigured AP radio frequencies",
        result: "Interference resolved completely",
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // UI-DASH-01: Metric Cards & Drill-down Navigation (AC-10, AC-11)
  // -------------------------------------------------------------------------
  it("UI-DASH-01: renders all 4 metric cards with correct counts and triggers drill-down navigation", async () => {
    const handleNavigateQueue = vi.fn();
    const handleSelectTicket = vi.fn();

    render(
      <StaffDashboard
        currentUser={mockStaffUser}
        initialData={mockDashboardData}
        onNavigateQueue={handleNavigateQueue}
        onSelectTicket={handleSelectTicket}
      />
    );

    // 1. Verify metric values
    expect(screen.getByTestId("count-unassigned")).toHaveTextContent("7");
    expect(screen.getByTestId("count-my-tickets")).toHaveTextContent("4");
    expect(screen.getByTestId("count-high-priority")).toHaveTextContent("3");
    expect(screen.getByTestId("count-my-actions")).toHaveTextContent("12");

    // 2. Drill-down: Unassigned Queue button
    const unassignedBtn = screen.getByRole("button", { name: /View Unassigned Queue/i });
    fireEvent.click(unassignedBtn);
    expect(handleNavigateQueue).toHaveBeenCalledWith({ owner: "unassigned" });

    // 3. Drill-down: My Tickets button
    const myTicketsBtn = screen.getByRole("button", { name: /View My Tickets/i });
    fireEvent.click(myTicketsBtn);
    expect(handleNavigateQueue).toHaveBeenCalledWith({ owner: "2" });

    // 4. Drill-down: High Priority button
    const highPriorityBtn = screen.getByRole("button", { name: /View High Priority/i });
    fireEvent.click(highPriorityBtn);
    expect(handleNavigateQueue).toHaveBeenCalledWith({ priority: "HIGH" });
  });

  // -------------------------------------------------------------------------
  // Recent Tickets Table & Actions Selection
  // -------------------------------------------------------------------------
  it("renders recent tickets table and personal actions list with open actions", async () => {
    const handleSelectTicket = vi.fn();

    render(
      <StaffDashboard
        currentUser={mockStaffUser}
        initialData={mockDashboardData}
        onSelectTicket={handleSelectTicket}
      />
    );

    // Verify recent tickets rendered
    expect(screen.getByText("TKT-2026-000016")).toBeInTheDocument();
    expect(screen.getByText("Database connection timeout in Lab 502")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000017")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();

    // Click Open button for first ticket
    const openButtons = screen.getAllByRole("button", { name: /^Open$/i });
    fireEvent.click(openButtons[0]);
    expect(handleSelectTicket).toHaveBeenCalledWith(16);

    // Verify my recent actions
    expect(screen.getByText("TKT-2026-000014")).toBeInTheDocument();
    expect(screen.getByText("Reconfigured AP radio frequencies")).toBeInTheDocument();
    expect(screen.getByText(/Interference resolved completely/)).toBeInTheDocument();

    // Click View Ticket Details from action item
    const viewTicketBtn = screen.getByRole("button", { name: /View Ticket Details/i });
    fireEvent.click(viewTicketBtn);
    expect(handleSelectTicket).toHaveBeenCalledWith(14);
  });

  // -------------------------------------------------------------------------
  // STYLE-01: Zen Green styling and Status Badges (AC-13)
  // -------------------------------------------------------------------------
  it("STYLE-01: applies Zen Green design language and appropriate status & priority badges", () => {
    render(
      <StaffDashboard
        currentUser={mockStaffUser}
        initialData={mockDashboardData}
      />
    );

    // Header styling
    const heading = screen.getByRole("heading", { name: /IT Staff Operational Dashboard/i });
    expect(heading).toBeInTheDocument();

    // Status badges in breakdown
    const newBadge = screen.getByTestId("status-badge-NEW");
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveTextContent("5");

    const inProgressBadge = screen.getByTestId("status-badge-IN_PROGRESS");
    expect(inProgressBadge).toBeInTheDocument();
    expect(inProgressBadge).toHaveTextContent("6");

    // Priority widgets
    expect(screen.getByText("High Priority")).toBeInTheDocument();
    expect(screen.getByText("Medium Priority")).toBeInTheDocument();
    expect(screen.getByText("Low Priority")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // RESP-01: Responsive grid layout (AC-13)
  // -------------------------------------------------------------------------
  it("RESP-01: uses responsive grid columns and table-responsive wrappers", () => {
    const { container } = render(
      <StaffDashboard
        currentUser={mockStaffUser}
        initialData={mockDashboardData}
      />
    );

    // Metric cards grid uses Bootstrap responsive column classes
    const metricGrid = screen.getByTestId("metric-cards-grid");
    expect(metricGrid).toHaveClass("row");
    expect(metricGrid.children[0]).toHaveClass("col-12");
    expect(metricGrid.children[0]).toHaveClass("col-sm-6");
    expect(metricGrid.children[0]).toHaveClass("col-lg-3");

    // Table has table-responsive container to prevent horizontal overflow
    const tableResponsive = container.querySelector(".table-responsive");
    expect(tableResponsive).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Loading & Error States
  // -------------------------------------------------------------------------
  it("handles loading and safe failure error states gracefully", async () => {
    vi.spyOn(api, "fetchStaffDashboard").mockRejectedValueOnce(
      new Error("Network timeout connecting to server.")
    );

    render(<StaffDashboard currentUser={mockStaffUser} />);

    // Initially in loading state
    expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();

    // Resolves to error state
    await waitFor(() => {
      expect(screen.getByTestId("dashboard-error")).toBeInTheDocument();
      expect(screen.getByText(/Network timeout connecting to server/i)).toBeInTheDocument();
    });

    // Retry button is available
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Empty State (Zero tickets / zero actions)
  // -------------------------------------------------------------------------
  it("displays clean empty state indicators when no tickets or actions exist", () => {
    const emptyData: StaffDashboardData = {
      metrics: {
        unassignedCount: 0,
        myTicketsCount: 0,
        criticalHighCount: 0,
        myActionsCount: 0,
      },
      statusBreakdown: {},
      priorityBreakdown: {},
      recentTickets: [],
      myRecentActions: [],
    };

    render(<StaffDashboard currentUser={mockStaffUser} initialData={emptyData} />);

    expect(screen.getByTestId("count-unassigned")).toHaveTextContent("0");
    expect(screen.getByTestId("count-my-tickets")).toHaveTextContent("0");
    expect(screen.getByTestId("empty-recent-tickets")).toHaveTextContent("No tickets recorded yet.");
    expect(screen.getByTestId("empty-recent-actions")).toHaveTextContent(
      "You have not logged any actions taken yet."
    );
  });
});
