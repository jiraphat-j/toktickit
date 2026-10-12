import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { StaffTicketDetail } from "../../src/components/StaffTicketDetail.js";
import {
  AuthUser,
  TicketDetail,
  StaffMember,
  ActionTaken,
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

const createMockTicket = (status: TicketDetail["currentStatus"]): TicketDetail => ({
  id: 101,
  ticketNumber: "TK-WF-001",
  summary: "Workflow test ticket",
  description: "Testing ticket workflow transitions and resolution gate.",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  currentStatus: status,
  problemAppearsResolved: false,
  createdAt: "2026-09-12T10:00:00.000Z",
  updatedAt: "2026-09-12T10:00:00.000Z",
  category: { id: 1, name: "Hardware", isActive: true },
  relatedSystem: { id: 2, name: "Network", isActive: true },
  requester: { id: 1, fullName: "Somchai Jaidee", email: "somchai@example.com", isActive: true },
  primaryOwner: mockStaffMembers[0],
  primaryOwnerId: 10,
  attachments: [],
});

const mockActions: ActionTaken[] = [
  {
    id: 1,
    ticketId: 101,
    actionDateTime: "2026-09-12T10:15:00.000Z",
    description: "Replaced faulty switch port and tested connection.",
    result: "Connection stabilized at 1Gbps.",
    performedById: 10,
    performedBy: { id: 10, fullName: "Alice Staff", role: "IT_STAFF" },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: null,
    createdAt: "2026-09-12T10:15:00.000Z",
    updatedAt: "2026-09-12T10:15:00.000Z",
  },
];

describe("TicketWorkflow Component & Resolution Gate (UI-WF-01, AC-06, AC-07, BR-13, BR-15)", () => {
  const mockOnBack = vi.fn();
  let currentTicket: TicketDetail;
  let currentActions: ActionTaken[];
  let statusEndpointOverride: ((body: any) => Promise<Response>) | null = null;

  const setupFetchMock = (ticketStatus: TicketDetail["currentStatus"], actions: ActionTaken[] = []) => {
    currentTicket = createMockTicket(ticketStatus);
    currentActions = [...actions];
    statusEndpointOverride = null;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
      const urlStr = url.toString();
      const method = init?.method || "GET";

      if (urlStr.includes("/api/staff/members")) {
        return {
          ok: true,
          json: async () => mockStaffMembers,
        } as Response;
      }

      if (urlStr.includes("/api/tickets/101/comments")) {
        return { ok: true, json: async () => [] } as Response;
      }

      if (urlStr.includes("/api/tickets/101/internal-notes")) {
        return { ok: true, json: async () => [] } as Response;
      }

      if (urlStr.includes("/api/tickets/101/actions-taken")) {
        return { ok: true, json: async () => ({ actions: currentActions }) } as Response;
      }

      if (urlStr.endsWith("/api/staff/tickets/101/status") || urlStr.endsWith("/api/tickets/101/status")) {
        const body = JSON.parse(init?.body as string);
        if (statusEndpointOverride) {
          return statusEndpointOverride(body);
        }
        if (body.status === "RESOLVED" && currentActions.length === 0) {
          return {
            ok: false,
            status: 400,
            json: async () => ({
              error: {
                code: "RESOLUTION_GATE_FAILED",
                message: "At least one Action Taken must be logged before resolving this ticket.",
              },
            }),
          } as Response;
        }
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

      if (urlStr.includes("/api/tickets/101/staff-detail") || (urlStr.includes("/api/tickets/101") && method === "GET")) {
        return {
          ok: true,
          json: async () => currentTicket,
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnBack.mockReset();
  });

  it("UI-WF-01: renders only permitted transition buttons dynamically for NEW status", async () => {
    setupFetchMock("NEW", []);
    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-open")).toBeInTheDocument();
      expect(screen.getByTestId("transition-to-in_progress")).toBeInTheDocument();
      expect(screen.getByTestId("transition-to-cancelled")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("transition-to-resolved")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-to-closed")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-to-waiting_for_requester")).not.toBeInTheDocument();
  });

  it("UI-WF-01: disables RESOLVED button and shows warning banner when 0 actions logged for IN_PROGRESS status", async () => {
    setupFetchMock("IN_PROGRESS", []);
    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-resolved")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByTestId("transition-to-resolved");
    expect(resolveBtn).toBeDisabled();
    expect(resolveBtn).toHaveAttribute(
      "title",
      "At least one Action Taken must be logged before resolving this ticket (Resolution Gate)"
    );

    const warningBanner = screen.getByTestId("resolution-gate-warning");
    expect(warningBanner).toBeInTheDocument();
    expect(warningBanner).toHaveTextContent("Resolution Gate: At least 1 Action Taken must be logged before resolving this ticket.");
  });

  it("UI-WF-01: enables RESOLVED button and hides warning banner when actions >= 1 exist", async () => {
    setupFetchMock("IN_PROGRESS", mockActions);
    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-resolved")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByTestId("transition-to-resolved");
    expect(resolveBtn).not.toBeDisabled();
    expect(screen.queryByTestId("resolution-gate-warning")).not.toBeInTheDocument();
  });

  it("UI-WF-01: successfully transitions status to RESOLVED when actions exist", async () => {
    setupFetchMock("IN_PROGRESS", mockActions);
    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-resolved")).toBeInTheDocument();
    });

    const resolveBtn = screen.getByTestId("transition-to-resolved");
    fireEvent.click(resolveBtn);

    await waitFor(() => {
      expect(screen.getByTestId("action-success-banner")).toHaveTextContent("Status transitioned to RESOLVED.");
    });
  });

  it("UI-WF-01: renders permitted transitions for RESOLVED status (CLOSED and REOPENED)", async () => {
    setupFetchMock("RESOLVED", mockActions);
    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-closed")).toBeInTheDocument();
      expect(screen.getByTestId("transition-to-reopened")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("transition-to-resolved")).not.toBeInTheDocument();
    expect(screen.queryByTestId("transition-to-in_progress")).not.toBeInTheDocument();
  });

  it("UI-WF-01: displays error when status transition request fails", async () => {
    setupFetchMock("OPEN", []);

    statusEndpointOverride = async () =>
      ({
        ok: false,
        status: 409,
        json: async () => ({
          error: {
            code: "CONFLICT",
            message: "Ticket has been modified by another user. Please refresh and retry.",
          },
        }),
      } as Response);

    render(<StaffTicketDetail ticketId={101} currentUser={mockStaffUser} onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByTestId("transition-to-in_progress")).toBeInTheDocument();
    });

    const inProgressBtn = screen.getByTestId("transition-to-in_progress");
    fireEvent.click(inProgressBtn);

    await waitFor(() => {
      expect(screen.getByTestId("action-error-banner")).toHaveTextContent("Ticket has been modified by another user. Please refresh and retry.");
    });
  });
});
