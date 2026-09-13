import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { RequesterTicketDetail } from "../../src/components/RequesterTicketDetail.js";
import * as api from "../../src/api.js";

const mockRequester: api.DevRequester = {
  id: 1,
  fullName: "Somchai Jaidee",
  email: "somchai.j@kmutt.ac.th",
  isActive: true,
};

const baseTicketDetail: api.TicketDetail = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 1,
  summary: "Laptop screen flickers intermittently",
  description: "The display blinks black every 10 seconds.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "IN_PROGRESS",
  problemAppearsResolved: false,
  createdAt: "2026-08-29T10:00:00.000Z",
  updatedAt: "2026-08-29T11:30:00.000Z",
  requester: {
    id: 1,
    fullName: "Somchai Jaidee",
    email: "somchai.j@kmutt.ac.th",
    isActive: true,
    createdAt: "2026-08-29T00:00:00.000Z",
    updatedAt: "2026-08-29T00:00:00.000Z",
  },
  category: {
    id: 1,
    name: "Hardware",
    isActive: true,
  },
  relatedSystem: {
    id: 1,
    name: "Corporate Laptop",
    isActive: true,
  },
  attachments: [],
};

describe("RequesterTicketDetail - Problem Appears Resolved Indicator (REQ-03, AC-08, BR-10)", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("REQ-03 / AC-08: renders button as 'Mark Problem as Resolved' when problemAppearsResolved is false", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce({
      ...baseTicketDetail,
      problemAppearsResolved: false,
    });

    render(
      <RequesterTicketDetail
        ticketId={101}
        currentRequester={mockRequester}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
    });

    // Toggle button is available
    const toggleBtn = screen.getByTestId("toggle-problem-resolved-btn");
    expect(toggleBtn).toHaveTextContent("Mark Problem as Resolved");

    // Resolved badge and banner should NOT be present when false
    expect(screen.queryByTestId("problem-resolved-badge")).not.toBeInTheDocument();
    expect(screen.queryByTestId("problem-resolved-banner")).not.toBeInTheDocument();
  });

  it("REQ-03 / AC-08: toggles problemAppearsResolved to true on button click", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce({
      ...baseTicketDetail,
      problemAppearsResolved: false,
    });
    const toggleSpy = vi.spyOn(api, "toggleProblemResolved").mockResolvedValueOnce({
      id: 101,
      problemAppearsResolved: true,
      currentStatus: "IN_PROGRESS",
    });

    render(
      <RequesterTicketDetail
        ticketId={101}
        currentRequester={mockRequester}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByTestId("toggle-problem-resolved-btn");
    expect(toggleBtn).toHaveTextContent("Mark Problem as Resolved");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(101, true);
    });

    // Verify UI updates to resolved state
    await waitFor(() => {
      expect(screen.getByTestId("problem-resolved-badge")).toHaveTextContent("Problem Appears Resolved");
    });
    expect(screen.getByTestId("problem-resolved-banner")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-problem-resolved-btn")).toHaveTextContent("Undo Problem Resolved");
  });

  it("REQ-03 / AC-08: toggles problemAppearsResolved back to false on button click", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce({
      ...baseTicketDetail,
      problemAppearsResolved: true,
    });
    const toggleSpy = vi.spyOn(api, "toggleProblemResolved").mockResolvedValueOnce({
      id: 101,
      problemAppearsResolved: false,
      currentStatus: "IN_PROGRESS",
    });

    render(
      <RequesterTicketDetail
        ticketId={101}
        currentRequester={mockRequester}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
    });

    // Verify initial resolved state
    expect(screen.getByTestId("problem-resolved-badge")).toHaveTextContent("Problem Appears Resolved");
    expect(screen.getByTestId("problem-resolved-banner")).toBeInTheDocument();

    const toggleBtn = screen.getByTestId("toggle-problem-resolved-btn");
    expect(toggleBtn).toHaveTextContent("Undo Problem Resolved");

    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(toggleSpy).toHaveBeenCalledWith(101, false);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("problem-resolved-badge")).not.toBeInTheDocument();
    });
    expect(screen.queryByTestId("problem-resolved-banner")).not.toBeInTheDocument();
    expect(screen.getByTestId("toggle-problem-resolved-btn")).toHaveTextContent("Mark Problem as Resolved");
  });
});
