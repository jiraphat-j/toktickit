import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MyTickets } from "../../src/components/MyTickets.js";
import { DevRequester, TicketListResponse } from "../../src/api.js";

const mockRequester1: DevRequester = {
  id: 1,
  fullName: "Somchai Jaidee",
  email: "somchai.j@kmutt.ac.th",
  isActive: true,
};

const mockRequester2: DevRequester = {
  id: 2,
  fullName: "Suda Sukjai",
  email: "suda.s@kmutt.ac.th",
  isActive: true,
};

const mockCategories = [
  { id: 1, name: "Hardware", isActive: true },
  { id: 2, name: "Software", isActive: true },
];

const mockTicketsResponse: TicketListResponse = {
  items: [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      summary: "Laptop screen flickers intermittently",
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Corporate Laptop" },
      requestedPriority: "HIGH",
      itPriority: null,
      currentStatus: "NEW",
      createdAt: "2026-08-29T10:00:00.000Z",
      updatedAt: "2026-08-29T10:00:00.000Z",
      _count: { attachments: 2 },
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      summary: "VPN connection timeout from home",
      category: { id: 2, name: "Software" },
      relatedSystem: { id: 2, name: "VPN" },
      requestedPriority: "MEDIUM",
      itPriority: null,
      currentStatus: "NEW",
      createdAt: "2026-08-28T09:30:00.000Z",
      updatedAt: "2026-08-28T09:30:00.000Z",
      _count: { attachments: 0 },
    },
  ],
  pagination: {
    page: 1,
    pageSize: 8,
    total: 2,
    totalPages: 1,
  },
};

describe("My Tickets Screen (Issue 7)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function setupFetchMock(customTicketsResponse?: TicketListResponse) {
    const ticketsResp = customTicketsResponse || mockTicketsResponse;
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/categories")) {
        return {
          ok: true,
          json: async () => mockCategories,
        } as Response;
      }
      if (urlStr.includes("/api/tickets")) {
        return {
          ok: true,
          json: async () => ticketsResp,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
  }

  // ---------------------------------------------------------------------------
  // UI-06: Query Controls, Sorting, and Pagination (AC-16, AC-17, AC-18)
  // ---------------------------------------------------------------------------
  describe("UI-06: Query Controls & Sorting", () => {
    it("renders ticket table with tickets, categories, priorities, and formatted dates", async () => {
      setupFetchMock();
      const handleCreateClick = vi.fn();

      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={handleCreateClick}
        />
      );

      // Loading state shows initially
      expect(screen.getByText(/Loading your tickets.../i)).toBeInTheDocument();

      // Wait for table to render (both table and mobile card exist in DOM)
      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      expect(screen.getAllByText("Laptop screen flickers intermittently")[0]).toBeInTheDocument();
      expect(screen.getAllByText("VPN connection timeout from home")[0]).toBeInTheDocument();
      expect(screen.getAllByText("HIGH").length).toBeGreaterThan(0);
      expect(screen.getAllByText("MEDIUM").length).toBeGreaterThan(0);
      expect(screen.getAllByText("📎 2").length).toBeGreaterThan(0);
    });

    it("AC-16: submitting search input triggers API fetch with search query parameter", async () => {
      const fetchSpy = setupFetchMock();
      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search Ticket # or Summary.../i);
      fireEvent.change(searchInput, { target: { value: "Wi-Fi drop" } });
      fireEvent.submit(searchInput.closest("form")!);

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        expect(lastCall[0].toString()).toContain("search=Wi-Fi+drop");
      });
    });

    it("AC-17: changing category and priority filters triggers API fetch with filter query params", async () => {
      const fetchSpy = setupFetchMock();
      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Change category filter
      const categorySelect = screen.getByLabelText(/Filter by Category/i);
      fireEvent.change(categorySelect, { target: { value: "2" } });

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        expect(lastCall[0].toString()).toContain("categoryId=2");
      });

      // Change priority filter
      const prioritySelect = screen.getByLabelText(/Filter by Priority/i);
      fireEvent.change(prioritySelect, { target: { value: "HIGH" } });

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        expect(lastCall[0].toString()).toContain("requestedPriority=HIGH");
      });
    });

    it("AC-26: clicking table header toggles sortOrder and changes sortBy", async () => {
      const fetchSpy = setupFetchMock();
      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Click "Ticket No" header to sort by ticketNumber desc
      const ticketNumHeader = screen.getByRole("button", { name: /Sort by Ticket Number/i });
      fireEvent.click(ticketNumHeader);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenLastCalledWith(
          expect.stringContaining("sortBy=ticketNumber&sortOrder=desc"),
          expect.anything()
        );
      });

      // Click again to toggle to asc
      const updatedHeader = screen.getByRole("button", { name: /Sort by Ticket Number/i });
      fireEvent.click(updatedHeader);

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenLastCalledWith(
          expect.stringContaining("sortBy=ticketNumber&sortOrder=asc"),
          expect.anything()
        );
      });
    });

    it("AC-18: pagination controls trigger fetch with new page and page size", async () => {
      const multiPageResp: TicketListResponse = {
        ...mockTicketsResponse,
        pagination: {
          page: 1,
          pageSize: 8,
          total: 20,
          totalPages: 3,
        },
      };

      const fetchSpy = setupFetchMock(multiPageResp);
      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Click Next page button
      const nextBtn = screen.getByRole("button", { name: /Next page/i });
      fireEvent.click(nextBtn);

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        expect(lastCall[0].toString()).toContain("page=2");
      });

      // Change page size to 20
      const pageSizeSelect = screen.getByLabelText(/Page size/i);
      fireEvent.change(pageSizeSelect, { target: { value: "20" } });

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        expect(lastCall[0].toString()).toContain("pageSize=20");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // UI-07: Distinct Empty State vs No-Results State (BR-28, AC-19, AC-20)
  // ---------------------------------------------------------------------------
  describe("UI-07: Distinct Empty vs No-Results States", () => {
    it("AC-19: renders distinct Empty State when requester has 0 tickets ever", async () => {
      const emptyResp: TicketListResponse = {
        items: [],
        pagination: {
          page: 1,
          pageSize: 8,
          total: 0,
          totalPages: 0,
        },
      };

      setupFetchMock(emptyResp);
      const handleCreate = vi.fn();

      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={handleCreate}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId("empty-state")).toBeInTheDocument();
      });

      expect(screen.getByText(/You haven't created any tickets yet/i)).toBeInTheDocument();
      const ctaBtn = screen.getAllByRole("button", { name: /\+ Create Ticket/i });
      fireEvent.click(ctaBtn[ctaBtn.length - 1]);
      expect(handleCreate).toHaveBeenCalled();
    });

    it("AC-20: renders distinct No-Results State when filters match 0 tickets and allows clearing filters", async () => {
      let isSearchingNonexistent = false;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/categories")) {
          return { ok: true, json: async () => mockCategories } as Response;
        }
        if (urlStr.includes("search=nonexistent")) {
          return {
            ok: true,
            json: async () => ({
              items: [],
              pagination: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
            }),
          } as Response;
        }
        return { ok: true, json: async () => mockTicketsResponse } as Response;
      });

      render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Search for nonexistent ticket
      const searchInput = screen.getByPlaceholderText(/Search Ticket # or Summary.../i);
      fireEvent.change(searchInput, { target: { value: "nonexistent" } });
      fireEvent.submit(searchInput.closest("form")!);

      // Should show distinct No-Results State
      await waitFor(() => {
        expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
      });
      expect(screen.getByText(/No tickets match your criteria/i)).toBeInTheDocument();

      // Click "Clear Filters"
      const clearBtn = screen.getByRole("button", { name: /Clear Filters/i });
      fireEvent.click(clearBtn);

      // Restores ticket list
      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // AC-23, BR-06: Requester Switching Reactivity
  // ---------------------------------------------------------------------------
  describe("AC-23: Requester Switching", () => {
    it("re-fetches tickets immediately when currentRequester changes", async () => {
      const fetchSpy = setupFetchMock();
      const { rerender } = render(
        <MyTickets
          currentRequester={mockRequester1}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getAllByText("TKT-2026-000101")[0]).toBeInTheDocument();
      });

      // Switch to Requester 2
      rerender(
        <MyTickets
          currentRequester={mockRequester2}
          onCreateTicketClick={vi.fn()}
        />
      );

      await waitFor(() => {
        const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1];
        const headers = lastCall[1]?.headers as Record<string, string>;
        expect(headers["X-Dev-Requester-Id"]).toBe("2");
      });
    });
  });
});
