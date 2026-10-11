import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AppHeader } from "../../src/components/AppHeader.js";
import { StaffDashboard } from "../../src/components/StaffDashboard.js";
import { RequesterDashboard } from "../../src/components/RequesterDashboard.js";
import { ActionsTaken } from "../../src/components/ActionsTaken.js";
import { AuthUser, StaffDashboardData, RequesterDashboardData, ActionItem } from "../../src/api.js";
import * as api from "../../src/api.js";

describe("Zen Green Visual Consistency, Responsive Audits & Accessibility (Issue #63 / STYLE-01, RESP-01, AC-13)", () => {
  const staffUser: AuthUser = {
    id: 2,
    fullName: "Somsak ITStaff",
    email: "somsak@toktickit.com",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
  };

  const requesterUser: AuthUser = {
    id: 1,
    fullName: "Somchai Jaidee",
    email: "somchai@toktickit.com",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
  };

  const mockStaffData: StaffDashboardData = {
    metrics: {
      unassignedCount: 4,
      myTicketsCount: 3,
      criticalHighCount: 2,
      myActionsCount: 8,
      unassigned: 4,
      myAssigned: 3,
      new: 2,
      open: 2,
      inProgress: 3,
      waitingForRequester: 1,
      recentlyUpdated: 5,
      priorityCounts: { high: 2, medium: 3, low: 2 },
    },
    statusBreakdown: {
      NEW: 2,
      OPEN: 2,
      IN_PROGRESS: 3,
      WAITING_FOR_REQUESTER: 1,
      RESOLVED: 4,
      CLOSED: 10,
      REOPENED: 0,
      CANCELLED: 1,
    },
    priorityBreakdown: { LOW: 2, MEDIUM: 3, HIGH: 2, CRITICAL: 0 },
    recentTickets: [
      {
        id: 10,
        ticketNumber: "TKT-2026-000010",
        summary: "Database query timeout in server room",
        currentStatus: "IN_PROGRESS",
        itPriority: "HIGH",
        primaryOwner: { id: 2, fullName: "Somsak ITStaff" },
        updatedAt: "2026-10-10T10:00:00.000Z",
      },
    ],
    myRecentActions: [
      {
        id: 1,
        ticketId: 10,
        ticketNumber: "TKT-2026-000010",
        actionDateTime: "2026-10-10T10:30:00.000Z",
        description: "Reconfigured connection pool parameters",
        result: "Timeout rate decreased",
      },
    ],
  };

  const mockRequesterData: RequesterDashboardData = {
    metrics: {
      totalOpenTickets: 2,
      totalOpen: 2,
      waitingForRequesterCount: 1,
      waitingForRequester: 1,
      recentlyUpdatedCount: 3,
      recentlyUpdated: 3,
      recentlyResolvedCount: 1,
      recentlyResolved: 1,
      inProgress: 1,
      closed: 4,
    },
    attentionTickets: [
      {
        id: 14,
        ticketNumber: "TKT-2026-000014",
        summary: "Cannot connect to KMUTT-Secure Wi-Fi",
        currentStatus: "WAITING_FOR_REQUESTER",
        itPriority: "MEDIUM",
        requestedPriority: "MEDIUM",
        updatedAt: "2026-10-10T11:00:00.000Z",
      },
    ],
    recentTickets: [
      {
        id: 14,
        ticketNumber: "TKT-2026-000014",
        summary: "Cannot connect to KMUTT-Secure Wi-Fi",
        currentStatus: "WAITING_FOR_REQUESTER",
        itPriority: "MEDIUM",
        requestedPriority: "MEDIUM",
        updatedAt: "2026-10-10T11:00:00.000Z",
      },
    ],
  };

  const mockActions: ActionItem[] = [
    {
      id: 101,
      ticketId: 10,
      actionDateTime: "2026-10-10T09:00:00.000Z",
      description: "Tested power supply and replaced capacitor",
      result: "Voltages stabilized at 12V rail",
      performedById: 2,
      performedBy: { id: 2, fullName: "Somsak ITStaff", email: "somsak@toktickit.com", role: "IT_STAFF" },
      followUpRequired: false,
      followUpNote: null,
      attachmentNotes: "See photo attached",
      createdAt: "2026-10-10T09:00:00.000Z",
      updatedAt: "2026-10-10T09:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // 1. Accessibility & ARIA Landmarks
  // -------------------------------------------------------------------------
  it("A11Y-01: Navigation header provides semantic ARIA navigation landmark and brand identity", () => {
    render(
      <AppHeader
        currentUser={staffUser}
        activeTab="dashboard"
        onTabChange={vi.fn()}
      />
    );

    const nav = screen.getByRole("navigation", { name: /Main Navigation/i });
    expect(nav).toBeInTheDocument();

    const brand = screen.getByText("TokTickIT");
    expect(brand).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // 2. Keyboard Navigation on Metric Cards (role="button", tabIndex=0, Enter/Space)
  // -------------------------------------------------------------------------
  it("KEYBOARD-01: Metric cards support keyboard focus and Enter key trigger", () => {
    const handleNavigate = vi.fn();

    render(
      <RequesterDashboard
        currentUser={requesterUser}
        initialData={mockRequesterData}
        onNavigateMyTickets={handleNavigate}
      />
    );

    const openCard = screen.getByTestId("card-open-tickets");
    expect(openCard).toHaveAttribute("tabIndex", "0");
    expect(openCard).toHaveAttribute("role", "button");

    // Press Enter to navigate
    fireEvent.keyDown(openCard, { key: "Enter" });
    expect(handleNavigate).toHaveBeenCalledTimes(1);

    // Press Space to navigate
    fireEvent.keyDown(openCard, { key: " " });
    expect(handleNavigate).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // 3. Responsive Containers & Zero Overflow Wrappers
  // -------------------------------------------------------------------------
  it("RESP-01: Tables are wrapped in .table-responsive to prevent horizontal overflow", () => {
    const { container } = render(
      <RequesterDashboard
        currentUser={requesterUser}
        initialData={mockRequesterData}
      />
    );

    const tableWrapper = container.querySelector(".table-responsive");
    expect(tableWrapper).toBeInTheDocument();
  });

  it("RESP-02: ActionsTaken component provides both desktop table and mobile card views", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce(mockActions as any);
    const { container } = render(
      <ActionsTaken
        ticketId={10}
        currentUser={staffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-table-wrapper")).toBeInTheDocument();
    });

    // Desktop table view wrapper has responsive desktop classes
    const desktopView = screen.getByTestId("actions-table-wrapper");
    expect(desktopView).toBeInTheDocument();
    expect(desktopView).toHaveClass("d-none", "d-md-block");

    // Mobile card view wrapper has mobile-only classes
    const mobileView = screen.getByTestId("actions-mobile-cards");
    expect(mobileView).toBeInTheDocument();
    expect(mobileView).toHaveClass("d-md-none");
  });

  // -------------------------------------------------------------------------
  // 4. Non-color Status and Priority Cues
  // -------------------------------------------------------------------------
  it("CUES-01: Status and Priority indicators include legible text labels alongside badges", () => {
    render(
      <RequesterDashboard
        currentUser={requesterUser}
        initialData={mockRequesterData}
      />
    );

    // Attention alert has explicit descriptive heading and explanation
    expect(screen.getByText("Tickets Needing Your Attention")).toBeInTheDocument();
    expect(
      screen.getByText(/Staff has requested additional information/i)
    ).toBeInTheDocument();

    // Metric cards have text descriptions
    expect(screen.getByText("Active requests")).toBeInTheDocument();
    expect(screen.getByText("Awaiting your response")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // 5. Interactive Touch Targets & Clear Labels
  // -------------------------------------------------------------------------
  it("TOUCH-01: Primary actions feature distinct buttons with clear accessible text", () => {
    const handleCreate = vi.fn();

    render(
      <RequesterDashboard
        currentUser={requesterUser}
        initialData={mockRequesterData}
        onCreateTicket={handleCreate}
      />
    );

    const createBtn = screen.getByRole("button", { name: /\+ Create New Ticket/i });
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).not.toBeDisabled();

    fireEvent.click(createBtn);
    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});
