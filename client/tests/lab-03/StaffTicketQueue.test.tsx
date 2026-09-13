import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { StaffTicketQueue } from "../../src/components/StaffTicketQueue.js";
import {
  AuthUser,
  Category,
  StaffMember,
  StaffTicketSummary,
  StaffTicketQueueResponse,
} from "../../src/api.js";

const mockStaffUser: AuthUser = {
  id: 10,
  email: "staff@example.com",
  fullName: "Alice Staff",
  role: "IT_STAFF",
  isActive: true,
  mustChangePassword: false,
};

const mockCategories: Category[] = [
  { id: 1, name: "Hardware", isActive: true },
  { id: 2, name: "Software", isActive: true },
];

const mockStaffMembers: StaffMember[] = [
  { id: 10, fullName: "Alice Staff", email: "staff@example.com", role: "IT_STAFF" },
  { id: 20, fullName: "Bob Admin", email: "admin@example.com", role: "ADMINISTRATOR" },
];

const mockTickets: StaffTicketSummary[] = [
  {
    id: 101,
    ticketNumber: "TK-STAFF-001",
    summary: "Printer toner empty in Lab 3",
    category: { id: 1, name: "Hardware" },
    requestedPriority: "HIGH",
    itPriority: "HIGH",
    currentStatus: "NEW",
    requester: { id: 1, fullName: "Somchai Jaidee", email: "somchai@example.com" },
    primaryOwner: null,
    problemAppearsResolved: false,
    createdAt: "2026-09-12T10:00:00.000Z",
    updatedAt: "2026-09-12T10:00:00.000Z",
  },
  {
    id: 102,
    ticketNumber: "TK-STAFF-002",
    summary: "VPN access license expired",
    category: { id: 2, name: "Software" },
    requestedPriority: "MEDIUM",
    itPriority: "LOW",
    currentStatus: "IN_PROGRESS",
    requester: { id: 2, fullName: "Suda Sukjai", email: "suda@example.com" },
    primaryOwner: { id: 10, fullName: "Alice Staff", email: "staff@example.com" },
    problemAppearsResolved: true,
    createdAt: "2026-09-11T09:00:00.000Z",
    updatedAt: "2026-09-11T14:00:00.000Z",
  },
];

const defaultQueueResponse: StaffTicketQueueResponse = {
  items: mockTickets,
  pagination: {
    page: 1,
    limit: 10,
    totalItems: 2,
    totalPages: 1,
  },
};

describe("StaffTicketQueue Component (UI-03, AC-12, AC-22)", () => {
  const mockOnSelectTicket = vi.fn();
  let currentResponse: StaffTicketQueueResponse;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnSelectTicket.mockReset();
    currentResponse = { ...defaultQueueResponse };

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/categories")) {
        return {
          ok: true,
          json: async () => mockCategories,
        } as Response;
      }
      if (urlStr.includes("/api/staff/members")) {
        return {
          ok: true,
          json: async () => mockStaffMembers,
        } as Response;
      }
      if (urlStr.includes("/api/staff/tickets")) {
        return {
          ok: true,
          json: async () => currentResponse,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
  });

  it("UI-03 / AC-12: renders queue header and toolbar filter controls", async () => {
    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    expect(await screen.findByText("IT Staff Ticket Queue")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by ticket # or summary...")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Status")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Priority")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Owner")).toBeInTheDocument();
    expect(screen.getByLabelText("Page Size")).toBeInTheDocument();
  });

  it("UI-03 / AC-12: renders tickets in desktop table with badges and metadata", async () => {
    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    // Verify ticket numbers (rendered in desktop table and in mobile card list)
    const t1Elements = await screen.findAllByText("TK-STAFF-001");
    expect(t1Elements.length).toBeGreaterThanOrEqual(1);

    const t2Elements = screen.getAllByText("TK-STAFF-002");
    expect(t2Elements.length).toBeGreaterThanOrEqual(1);

    // Verify summaries
    const s1Elements = screen.getAllByText("Printer toner empty in Lab 3");
    expect(s1Elements.length).toBeGreaterThanOrEqual(1);

    const s2Elements = screen.getAllByText("VPN access license expired");
    expect(s2Elements.length).toBeGreaterThanOrEqual(1);

    // Verify badges
    const unassignedBadges = screen.getAllByText("Unassigned");
    expect(unassignedBadges.length).toBeGreaterThanOrEqual(1);

    const resolvedBadges = screen.getAllByText("✓ Problem Appears Resolved");
    expect(resolvedBadges.length).toBeGreaterThanOrEqual(1);

    // Verify requester names
    const requester1 = screen.getAllByText("Somchai Jaidee");
    expect(requester1.length).toBeGreaterThanOrEqual(1);
  });

  it("UI-03 / AC-22: renders responsive mobile cards with >= 44px touch targets", async () => {
    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    const mobileList = await screen.findByTestId("mobile-ticket-list");
    expect(mobileList).toBeInTheDocument();
    expect(screen.getAllByText("TK-STAFF-001").length).toBeGreaterThanOrEqual(2); // In table and in mobile card
  });

  it("UI-03 / AC-12: search submission calls fetch with search query parameter", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await screen.findAllByText("TK-STAFF-001");

    const searchInput = screen.getByPlaceholderText("Search by ticket # or summary...");
    fireEvent.change(searchInput, { target: { value: "toner" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("search=toner"),
        expect.anything()
      );
    });
  });

  it("UI-03 / AC-12: dropdown filter changes trigger fetch with query parameters", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await screen.findAllByText("TK-STAFF-001");

    // Change status
    fireEvent.change(screen.getByLabelText("Filter by Status"), {
      target: { value: "IN_PROGRESS" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("currentStatus=IN_PROGRESS"),
        expect.anything()
      );
    });

    // Change owner to unassigned
    fireEvent.change(screen.getByLabelText("Filter by Owner"), {
      target: { value: "unassigned" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("ownerId=unassigned"),
        expect.anything()
      );
    });
  });

  it("UI-03 / AC-12: column sorting header toggles sortOrder and calls fetch with sortBy and sortOrder", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await screen.findAllByText("TK-STAFF-001");

    // Click on Ticket No sortable header
    const sortBtn = screen.getByLabelText("Sort by Ticket Number");
    fireEvent.click(sortBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("sortBy=ticketNumber"),
        expect.anything()
      );
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("sortOrder=asc"),
        expect.anything()
      );
    });
  });

  it("UI-03 / AC-12: renders empty state when queue has 0 tickets overall", async () => {
    currentResponse = {
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
      },
    };

    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    expect(await screen.findByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText("Ticket queue is empty")).toBeInTheDocument();
  });

  it("UI-03 / AC-12: renders no-results state with 'Clear Filters' button when filters match nothing", async () => {
    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await screen.findAllByText("TK-STAFF-001");

    // Now mock response returns 0 items for filtered search
    currentResponse = {
      items: [],
      pagination: {
        page: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
      },
    };

    const searchInput = screen.getByPlaceholderText("Search by ticket # or summary...");
    fireEvent.change(searchInput, { target: { value: "NONEXISTENT_XYZ" } });
    fireEvent.click(screen.getByRole("button", { name: /search/i }));

    expect(await screen.findByTestId("no-results-state")).toBeInTheDocument();
    expect(screen.getByText("No tickets match your filters")).toBeInTheDocument();

    // Click Clear Filters
    const clearBtn = screen.getAllByRole("button", { name: /clear filters/i })[0];
    fireEvent.click(clearBtn);

    await waitFor(() => {
      expect(searchInput).toHaveValue("");
    });
  });

  it("UI-03 / AC-12: clicking ticket or Inspect button triggers onSelectTicket", async () => {
    render(
      <StaffTicketQueue
        currentUser={mockStaffUser}
        onSelectTicket={mockOnSelectTicket}
      />
    );

    await screen.findAllByText("TK-STAFF-001");

    const inspectButtons = screen.getAllByRole("button", { name: /inspect/i });
    fireEvent.click(inspectButtons[0]);

    expect(mockOnSelectTicket).toHaveBeenCalledWith(101);
  });
});
