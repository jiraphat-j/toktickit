import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import React from "react";
import { RequesterDashboard } from "../../src/components/RequesterDashboard";
import { AuthUser, RequesterDashboardData } from "../../src/api";
import * as api from "../../src/api";

describe("RequesterDashboard UI Component Tests (Issue #62 / UI-DASH-02, STYLE-01, RESP-01, AC-09, AC-11, AC-13)", () => {
  const mockRequesterUser: AuthUser = {
    id: 1,
    fullName: "Somchai Jaidee",
    email: "somchai@toktickit.com",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
  };

  const mockDashboardData: RequesterDashboardData = {
    metrics: {
      totalOpenTickets: 3,
      totalOpen: 3,
      waitingForRequesterCount: 1,
      waitingForRequester: 1,
      recentlyUpdatedCount: 4,
      recentlyUpdated: 4,
      recentlyResolvedCount: 2,
      recentlyResolved: 2,
      inProgress: 1,
      closed: 5,
    },
    attentionTickets: [
      {
        id: 14,
        ticketNumber: "TKT-2026-000014",
        summary: "Cannot connect to KMUTT-Secure Wi-Fi in building CB2",
        currentStatus: "WAITING_FOR_REQUESTER",
        status: "WAITING_FOR_REQUESTER",
        itPriority: "MEDIUM",
        requestedPriority: "HIGH",
        updatedAt: "2026-09-29T11:00:00.000Z",
      },
    ],
    recentTickets: [
      {
        id: 15,
        ticketNumber: "TKT-2026-000015",
        summary: "Request license key for MATLAB 2026",
        currentStatus: "IN_PROGRESS",
        status: "IN_PROGRESS",
        itPriority: "LOW",
        requestedPriority: "LOW",
        updatedAt: "2026-09-29T11:15:00.000Z",
      },
      {
        id: 14,
        ticketNumber: "TKT-2026-000014",
        summary: "Cannot connect to KMUTT-Secure Wi-Fi in building CB2",
        currentStatus: "WAITING_FOR_REQUESTER",
        status: "WAITING_FOR_REQUESTER",
        itPriority: "MEDIUM",
        requestedPriority: "HIGH",
        updatedAt: "2026-09-29T11:00:00.000Z",
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // UI-DASH-02: Metric Cards & Welcome Banner (AC-09, AC-11)
  // -------------------------------------------------------------------------
  it("UI-DASH-02: renders welcome banner with user name, action button, and 4 metric cards", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(mockDashboardData);

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={mockDashboardData}
        onCreateTicket={vi.fn()}
      />
    );

    // Welcome banner
    expect(screen.getByText("My Support Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\+ Create New Ticket/i })).toBeInTheDocument();

    // 4 Metric cards
    expect(screen.getByTestId("card-open-tickets")).toBeInTheDocument();
    expect(screen.getByText("Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    expect(screen.getByTestId("card-waiting-requester")).toBeInTheDocument();
    expect(screen.getByText("Action Needed (Waiting on You)")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();

    expect(screen.getByTestId("card-recently-updated")).toBeInTheDocument();
    expect(screen.getByText("Recently Updated")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();

    expect(screen.getByTestId("card-recently-resolved")).toBeInTheDocument();
    expect(screen.getByText("Recently Resolved")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Drill-down navigation from cards
  // -------------------------------------------------------------------------
  it("UI-DASH-02: clicking metric cards triggers drill-down navigation to My Tickets", async () => {
    const handleNavigateMyTickets = vi.fn();

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={mockDashboardData}
        onNavigateMyTickets={handleNavigateMyTickets}
      />
    );

    // Click Open Tickets card
    fireEvent.click(screen.getByTestId("card-open-tickets"));
    expect(handleNavigateMyTickets).toHaveBeenCalledWith();

    // Click Waiting for Requester card
    fireEvent.click(screen.getByTestId("card-waiting-requester"));
    expect(handleNavigateMyTickets).toHaveBeenCalledWith({ status: "WAITING_FOR_REQUESTER" });

    // Click Recently Resolved card
    fireEvent.click(screen.getByTestId("card-recently-resolved"));
    expect(handleNavigateMyTickets).toHaveBeenCalledWith({ status: "RESOLVED" });
  });

  // -------------------------------------------------------------------------
  // Attention Required Section
  // -------------------------------------------------------------------------
  it("UI-DASH-02: renders Attention Required section and clicking ticket opens details", async () => {
    const handleSelectTicket = vi.fn();

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={mockDashboardData}
        onSelectTicket={handleSelectTicket}
      />
    );

    const attentionSection = screen.getByTestId("attention-required-section");
    expect(attentionSection).toBeInTheDocument();
    expect(within(attentionSection).getByText("Tickets Needing Your Attention")).toBeInTheDocument();
    expect(within(attentionSection).getByText("Cannot connect to KMUTT-Secure Wi-Fi in building CB2")).toBeInTheDocument();

    const respondBtn = within(attentionSection).getByRole("button", { name: /Respond \/ View/i });
    fireEvent.click(respondBtn);
    expect(handleSelectTicket).toHaveBeenCalledWith(14);
  });

  // -------------------------------------------------------------------------
  // Recent Tickets List
  // -------------------------------------------------------------------------
  it("UI-DASH-02: renders recent tickets table and detail button triggers navigation", async () => {
    const handleSelectTicket = vi.fn();

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={mockDashboardData}
        onSelectTicket={handleSelectTicket}
      />
    );

    expect(screen.getByText("Recent Tickets")).toBeInTheDocument();
    expect(screen.getByText("TKT-2026-000015")).toBeInTheDocument();
    expect(screen.getByText("Request license key for MATLAB 2026")).toBeInTheDocument();

    const detailButtons = screen.getAllByRole("button", { name: "View Details" });
    expect(detailButtons.length).toBe(2);
    fireEvent.click(detailButtons[0]);
    expect(handleSelectTicket).toHaveBeenCalledWith(15);
  });

  // -------------------------------------------------------------------------
  // Empty State
  // -------------------------------------------------------------------------
  it("UI-DASH-02: renders encouraging empty state when user has zero tickets", async () => {
    const emptyData: RequesterDashboardData = {
      metrics: {
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
      },
      attentionTickets: [],
      recentTickets: [],
    };

    const handleCreateTicket = vi.fn();

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={emptyData}
        onCreateTicket={handleCreateTicket}
      />
    );

    expect(screen.getByTestId("requester-dashboard-empty")).toBeInTheDocument();
    expect(screen.getByText("You have no active support tickets")).toBeInTheDocument();

    const createBtn = screen.getByRole("button", { name: "+ Create a Ticket" });
    fireEvent.click(createBtn);
    expect(handleCreateTicket).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Loading & Error States
  // -------------------------------------------------------------------------
  it("UI-DASH-02: displays loading spinner when initial data is not provided", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockImplementation(() => new Promise(() => {}));

    render(<RequesterDashboard currentUser={mockRequesterUser} />);

    expect(screen.getByTestId("requester-dashboard-loading")).toBeInTheDocument();
    expect(screen.getByText("Loading your dashboard...")).toBeInTheDocument();
  });

  it("UI-DASH-02: displays safe error banner and retry button on fetch failure", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockRejectedValue(
      new Error("Network connection lost")
    );

    render(<RequesterDashboard currentUser={mockRequesterUser} />);

    await waitFor(() => {
      expect(screen.getByTestId("requester-dashboard-error")).toBeInTheDocument();
      expect(screen.getByText("Network connection lost")).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: "Retry" });
    expect(retryBtn).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Create Ticket Header Action
  // -------------------------------------------------------------------------
  it("UI-DASH-02: clicking + Create New Ticket triggers onCreateTicket callback", async () => {
    const handleCreateTicket = vi.fn();

    render(
      <RequesterDashboard
        currentUser={mockRequesterUser}
        initialData={mockDashboardData}
        onCreateTicket={handleCreateTicket}
      />
    );

    const headerCreateBtn = screen.getByRole("button", { name: /\+ Create New Ticket/i });
    fireEvent.click(headerCreateBtn);
    expect(handleCreateTicket).toHaveBeenCalledTimes(1);
  });
});
