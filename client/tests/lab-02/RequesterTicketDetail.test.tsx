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

const mockTicketDetail: api.TicketDetail = {
  id: 101,
  ticketNumber: "TKT-2026-000101",
  requesterId: 1,
  categoryId: 1,
  relatedSystemId: 1,
  summary: "Laptop screen flickers intermittently",
  description: "The corporate laptop display blinks black every 10 seconds when HDMI is plugged in.",
  requestedPriority: "HIGH",
  itPriority: null,
  currentStatus: "NEW",
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
  attachments: [
    {
      id: 1,
      ticketId: 101,
      originalFileName: "screenshot.png",
      storedFileName: "uuid-1.png",
      mimeType: "image/png",
      sizeBytes: 102400,
      uploadedAt: "2026-08-29T10:05:00.000Z",
      isRemoved: false,
      removedAt: null,
      removedReason: null,
    },
  ],
};

describe("RequesterTicketDetail Component (Issue 8 / UI-08)", () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-08 (AC-21): renders complete ticket detail in read-only mode for owned ticket", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockTicketDetail);

    render(
      <RequesterTicketDetail
        ticketId={101}
        currentRequester={mockRequester}
        onBack={mockOnBack}
      />
    );

    // Initial loading state
    expect(screen.getByTestId("ticket-detail-loading")).toBeInTheDocument();

    // Await ticket loaded
    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-screen")).toBeInTheDocument();
    });

    // Verify Read-Only Header Fields (AC-21)
    expect(screen.getByTestId("ticket-number")).toHaveTextContent("TKT-2026-000101");
    expect(screen.getByTestId("ticket-status")).toHaveTextContent("NEW");
    expect(screen.getByTestId("ticket-priority")).toHaveTextContent("HIGH");
    expect(screen.getByText("Laptop screen flickers intermittently")).toBeInTheDocument();

    // Verify Read-Only Metadata Grid
    expect(screen.getByTestId("requester-name")).toHaveTextContent("Somchai Jaidee");
    expect(screen.getByText("somchai.j@kmutt.ac.th")).toBeInTheDocument();
    expect(screen.getByTestId("ticket-category")).toHaveTextContent("Hardware");
    expect(screen.getByTestId("ticket-system")).toHaveTextContent("Corporate Laptop");
    expect(screen.getByTestId("ticket-created-at")).not.toBeEmptyDOMElement();
    expect(screen.getByTestId("ticket-updated-at")).not.toBeEmptyDOMElement();

    // Verify Description
    expect(screen.getByTestId("ticket-description")).toHaveTextContent(
      "The corporate laptop display blinks black every 10 seconds when HDMI is plugged in."
    );

    // Verify Attachment section is present
    expect(screen.getByTestId("attachment-section")).toBeInTheDocument();
  });

  it("UI-08 (AC-21): strictly excludes comments, notes, actions taken, and status modification controls", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockTicketDetail);

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

    // Check that NO comment input, textarea, or section exists
    expect(screen.queryByPlaceholderText(/comment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/add comment/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/actions taken/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/internal notes/i)).not.toBeInTheDocument();

    // Check that NO status dropdown or workflow controls exist
    expect(screen.queryByRole("combobox", { name: /status/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/change status/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/assign to/i)).not.toBeInTheDocument();
  });

  it("UI-08: invokes onBack callback when clicking Back to My Tickets", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockResolvedValueOnce(mockTicketDetail);

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

    const backBtn = screen.getByRole("button", { name: /back to my tickets/i });
    fireEvent.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("UI-08 (AC-22): renders error view with back button when ticket access is denied or not found", async () => {
    vi.spyOn(api, "fetchTicketDetail").mockRejectedValueOnce(
      new Error("Ticket not found or access denied.")
    );

    render(
      <RequesterTicketDetail
        ticketId={999}
        currentRequester={mockRequester}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("ticket-detail-error")).toBeInTheDocument();
    });

    expect(screen.getByText(/Unable to View Ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/Ticket not found or access denied/i)).toBeInTheDocument();

    const backBtn = screen.getByRole("button", { name: /back to my tickets/i });
    fireEvent.click(backBtn);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
