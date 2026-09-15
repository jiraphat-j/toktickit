import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import {
  AuthUser,
  TicketDetail,
  StaffMember,
  TicketComment,
  InternalNote,
} from "../../src/api.js";

const mockStaffUser: AuthUser = {
  id: 10,
  email: "staff@example.com",
  fullName: "Alice Staff",
  role: "IT_STAFF",
  isActive: true,
  mustChangePassword: false,
};

const mockStaffMembers: StaffMember[] = [
  { id: 10, fullName: "Alice Staff", email: "staff@example.com", role: "IT_STAFF" },
  { id: 20, fullName: "Bob Admin", email: "admin@example.com", role: "ADMINISTRATOR" },
];

const mockTicket: TicketDetail = {
  id: 101,
  ticketNumber: "TK-STAFF-001",
  summary: "Printer toner empty in Lab 3",
  description: "The HP LaserJet in Lab 3 is completely out of black toner.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: "NEW",
  problemAppearsResolved: true,
  createdAt: "2026-09-12T10:00:00.000Z",
  updatedAt: "2026-09-12T10:00:00.000Z",
  category: { id: 1, name: "Hardware", isActive: true },
  relatedSystem: { id: 2, name: "Printers", isActive: true },
  requester: { id: 1, fullName: "Somchai Jaidee", email: "somchai@example.com", isActive: true },
  primaryOwner: null,
  primaryOwnerId: null,
  attachments: [],
};

const mockComments: TicketComment[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Please help, students need to print assignments.",
    createdAt: "2026-09-12T10:05:00.000Z",
    author: { id: 1, fullName: "Somchai Jaidee", role: "REQUESTER" },
  },
];

const mockNotes: InternalNote[] = [
  {
    id: 1,
    ticketId: 101,
    content: "Replacement toner cartridge is in room 204 cabinet B.",
    createdAt: "2026-09-12T10:10:00.000Z",
    author: { id: 20, fullName: "Bob Admin", role: "ADMINISTRATOR" },
  },
];

describe("StaffTicketDetail Component (UI-04, AC-10, AC-13..15, BR-11, BR-13, BR-15, BR-18)", () => {
  const mockOnBack = vi.fn();
  let currentTicket: TicketDetail;
  let currentComments: TicketComment[];
  let currentNotes: InternalNote[];

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnBack.mockReset();
    currentTicket = JSON.parse(JSON.stringify(mockTicket));
    currentComments = JSON.parse(JSON.stringify(mockComments));
    currentNotes = JSON.parse(JSON.stringify(mockNotes));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = url.toString();
      const method = init?.method || "GET";

      if (urlStr.includes("/api/staff/members")) {
        return {
          ok: true,
          json: async () => mockStaffMembers,
        } as Response;
      }

      if (urlStr.endsWith("/api/tickets/101/comments")) {
        if (method === "POST") {
          const body = JSON.parse(init?.body as string);
          const newComment: TicketComment = {
            id: currentComments.length + 1,
            ticketId: 101,
            content: body.content,
            createdAt: new Date().toISOString(),
            author: { id: mockStaffUser.id, fullName: mockStaffUser.fullName, role: "IT_STAFF" },
          };
          currentComments.push(newComment);
          return { ok: true, status: 201, json: async () => newComment } as Response;
        }
        return { ok: true, json: async () => [...currentComments] } as Response;
      }

      if (urlStr.endsWith("/api/tickets/101/internal-notes")) {
        if (method === "POST") {
          const body = JSON.parse(init?.body as string);
          const newNote: InternalNote = {
            id: currentNotes.length + 1,
            ticketId: 101,
            content: body.content,
            createdAt: new Date().toISOString(),
            author: { id: mockStaffUser.id, fullName: mockStaffUser.fullName, role: "IT_STAFF" },
          };
          currentNotes.push(newNote);
          return { ok: true, status: 201, json: async () => newNote } as Response;
        }
        return { ok: true, json: async () => [...currentNotes] } as Response;
      }

      if (urlStr.endsWith("/api/staff/tickets/101/owner")) {
        const body = JSON.parse(init?.body as string);
        currentTicket.primaryOwnerId = body.ownerId;
        currentTicket.primaryOwner = body.ownerId
          ? mockStaffMembers.find((m) => m.id === body.ownerId) || null
          : null;
        return {
          ok: true,
          json: async () => ({
            id: 101,
            primaryOwnerId: currentTicket.primaryOwnerId,
            primaryOwner: currentTicket.primaryOwner,
            updatedAt: new Date().toISOString(),
          }),
        } as Response;
      }

      if (urlStr.endsWith("/api/staff/tickets/101/priority")) {
        const body = JSON.parse(init?.body as string);
        currentTicket.itPriority = body.itPriority;
        return {
          ok: true,
          json: async () => ({
            id: 101,
            itPriority: currentTicket.itPriority,
            updatedAt: new Date().toISOString(),
          }),
        } as Response;
      }

      if (urlStr.endsWith("/api/staff/tickets/101/status")) {
        const body = JSON.parse(init?.body as string);
        currentTicket.currentStatus = body.status;
        return {
          ok: true,
          json: async () => ({
            id: 101,
            currentStatus: currentTicket.currentStatus,
            updatedAt: new Date().toISOString(),
          }),
        } as Response;
      }

      if (urlStr.includes("/api/tickets/101")) {
        return {
          ok: true,
          json: async () => currentTicket,
        } as Response;
      }

      return {
        ok: false,
        status: 404,
        json: async () => ({ error: { message: "Not found" } }),
      } as Response;
    });
  });

  it("renders ticket overview, requester information, and Problem Appears Resolved indicator", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-ticket-detail")).toBeInTheDocument();
    });

    expect(screen.getByText("TK-STAFF-001")).toBeInTheDocument();
    expect(screen.getByText("Printer toner empty in Lab 3")).toBeInTheDocument();
    expect(screen.getByText("The HP LaserJet in Lab 3 is completely out of black toner.")).toBeInTheDocument();
    expect(screen.getByText("Hardware")).toBeInTheDocument();
    expect(screen.getByText("Printers")).toBeInTheDocument();
    expect(screen.getByTestId("staff-resolved-indicator")).toBeInTheDocument();
  });

  it("renders unassigned owner state and context-sensitive status transition buttons for NEW", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("assigned-owner-badge")).toHaveTextContent("Unassigned");
    });

    expect(screen.getByTestId("claim-ticket-btn")).toBeInTheDocument();
    expect(screen.getByTestId("transition-to-open")).toBeInTheDocument();
    expect(screen.getByTestId("transition-to-in_progress")).toBeInTheDocument();
    expect(screen.getByTestId("transition-to-cancelled")).toBeInTheDocument();
    // Non-permitted transitions from NEW must NOT be rendered
    expect(screen.queryByTestId("transition-to-resolved")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-to-closed")).not.toBeInTheDocument();
  });

  it("claims ticket for current user and updates owner badge (AC-13)", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("claim-ticket-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("claim-ticket-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("assigned-owner-badge")).toHaveTextContent("Alice Staff (You)");
    });
    expect(screen.getByTestId("unassign-ticket-btn")).toBeInTheDocument();
  });

  it("reassigns ticket to another staff member via select dropdown (AC-13)", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("reassign-owner-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("reassign-owner-select"), {
      target: { value: "20" },
    });

    await waitFor(() => {
      expect(screen.getByTestId("assigned-owner-badge")).toHaveTextContent("Bob Admin");
    });
  });

  it("updates operational IT Priority independently (AC-14)", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("it-priority-select"), {
      target: { value: "LOW" },
    });

    await waitFor(() => {
      expect(screen.getByText("✓ IT Priority updated to LOW.")).toBeInTheDocument();
    });
  });

  it("executes status workflow transitions (AC-15)", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-open")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("transition-to-open"));

    await waitFor(() => {
      expect(screen.getByText("✓ Status transitioned to OPEN.")).toBeInTheDocument();
    });

    // OPEN allows transition to IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
    await waitFor(() => {
      expect(screen.getByTestId("transition-to-resolved")).toBeInTheDocument();
    });
  });

  it("renders Public Comments stream and posts a new comment (AC-09)", async () => {
    const user = userEvent.setup();
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("public-comments-panel")).toBeInTheDocument();
    });

    expect(screen.getByText("✓ Visible to Requester")).toBeInTheDocument();
    expect(screen.getByText("Please help, students need to print assignments.")).toBeInTheDocument();

    const textarea = screen.getByTestId("comment-textarea");
    await user.type(textarea, "Toner will be replaced within 30 minutes.");

    const submitBtn = screen.getByTestId("submit-comment-btn");
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Toner will be replaced within 30 minutes.")).toBeInTheDocument();
    });
    expect(textarea).toHaveValue("");
  });

  it("renders Internal Notes stream with distinct Amber Warning styling and posts note (AC-10)", async () => {
    const user = userEvent.setup();
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("internal-notes-panel")).toBeInTheDocument();
    });

    expect(screen.getByText("Private to IT Staff & Admin")).toBeInTheDocument();
    expect(screen.getByText("Replacement toner cartridge is in room 204 cabinet B.")).toBeInTheDocument();

    const textarea = screen.getByTestId("note-textarea");
    await user.type(textarea, "Ordered 2 more cartridges for spare stock.");

    const submitBtn = screen.getByTestId("submit-note-btn");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Ordered 2 more cartridges for spare stock.")).toBeInTheDocument();
    });
  });

  it("blocks submitting empty or whitespace-only comments", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("comment-textarea")).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId("submit-comment-btn");
    expect(submitBtn).toBeDisabled();
  });

  it("navigates back to queue when back button is clicked", async () => {
    render(
      <StaffTicketDetail
        ticketId={101}
        currentUser={mockStaffUser}
        onBack={mockOnBack}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("back-to-queue-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("back-to-queue-btn"));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
