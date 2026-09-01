import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateTicket } from "../../src/components/CreateTicket.js";
import { DevRequester } from "../../src/api.js";

const mockRequester: DevRequester = {
  id: 1,
  fullName: "Somchai Jaidee",
  email: "somchai.j@kmutt.ac.th",
  isActive: true,
};

const mockCategories = [
  { id: 1, name: "Hardware", isActive: true },
  { id: 2, name: "Software", isActive: true },
];

const mockRelatedSystems = [
  { id: 1, name: "Email", isActive: true },
  { id: 2, name: "VPN", isActive: true },
];

describe("Create Ticket UI & Validation (Issue 6)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // Setup mock for initial reference data loading (categories & related-systems)
  function setupReferenceDataMock() {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/categories")) {
        return {
          ok: true,
          json: async () => mockCategories,
        } as Response;
      }
      if (urlStr.includes("/api/related-systems")) {
        return {
          ok: true,
          json: async () => mockRelatedSystems,
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });
  }

  // ---------------------------------------------------------------------------
  // UI-03: Client-Side Validation Tests (AC-02, AC-03, AC-09, AC-10)
  // ---------------------------------------------------------------------------
  describe("UI-03: Client-Side Validation (AC-02, AC-03)", () => {
    it("renders active reference data and read-only requester identity (AC-31, BR-10)", async () => {
      setupReferenceDataMock();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      // Read-only requester
      const requesterInput = screen.getByLabelText(/requester/i);
      expect(requesterInput).toBeDisabled();
      expect(requesterInput).toHaveValue("Somchai Jaidee (somchai.j@kmutt.ac.th)");

      // Active Categories and Related Systems loaded
      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Software" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Email" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "VPN" })).toBeInTheDocument();
      });

      // Default requested priority is MEDIUM
      const mediumRadio = screen.getByRole("radio", { name: /medium/i });
      expect(mediumRadio).toBeChecked();
    });

    it("UI-03 (AC-02): displays inline error for empty summary and blocks submission", async () => {
      const fetchSpy = setupReferenceDataMock();
      const user = userEvent.setup();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      // Select category and system, fill description, leave summary empty
      await user.selectOptions(screen.getByLabelText(/category/i), "1");
      await user.selectOptions(screen.getByLabelText(/related system/i), "1");
      await user.type(screen.getByLabelText(/description/i), "Valid description with over 10 chars");

      const submitBtn = screen.getByRole("button", { name: /submit ticket/i });
      await user.click(submitBtn);

      // Inline error appears under Summary
      expect(screen.getByText(/summary is required/i)).toBeInTheDocument();

      // No POST /api/tickets call was made
      const postCalls = fetchSpy.mock.calls.filter((call) => {
        const [, init] = call;
        return init && init.method === "POST";
      });
      expect(postCalls.length).toBe(0);
    });

    it("UI-03 (AC-02): displays inline error when summary is less than 5 characters", async () => {
      setupReferenceDataMock();
      const user = userEvent.setup();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/summary/i), "Help"); // only 4 chars
      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      expect(
        screen.getByText(/summary must be between 5 and 150 characters/i)
      ).toBeInTheDocument();
    });

    it("UI-03 (AC-03): displays inline error when description is less than 10 characters", async () => {
      setupReferenceDataMock();
      const user = userEvent.setup();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/summary/i), "Valid Ticket Summary");
      await user.type(screen.getByLabelText(/description/i), "Short"); // < 10 chars
      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      expect(
        screen.getByText(/description must be between 10 and 2000 characters/i)
      ).toBeInTheDocument();
    });

    it("UI-03: displays inline errors when category or related system is not selected", async () => {
      setupReferenceDataMock();
      const user = userEvent.setup();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/summary/i), "Valid Ticket Summary");
      await user.type(screen.getByLabelText(/description/i), "Valid description with over 10 chars");
      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      expect(screen.getByText(/please select a category/i)).toBeInTheDocument();
      expect(screen.getByText(/please select a related system/i)).toBeInTheDocument();
    });

    it("UI-03 (AC-09, AC-10): rejects unsupported file types and oversized files", async () => {
      setupReferenceDataMock();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      const fileInput = screen.getByLabelText(/supporting attachment/i) as HTMLInputElement;

      // Unsupported extension .exe (AC-09)
      const badFile = new File(["binary content"], "malware.exe", { type: "application/x-msdownload" });
      fireEvent.change(fileInput, { target: { files: [badFile] } });
      expect(
        screen.getByText(/only jpg, jpeg, png, webp, and pdf files are allowed/i)
      ).toBeInTheDocument();

      // Oversized file > 5 MB (AC-10)
      const oversizedFile = new File([new ArrayBuffer(6 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
      expect(
        screen.getByText(/attachment size cannot exceed 5 mb/i)
      ).toBeInTheDocument();

      // Valid PDF file < 5 MB accepts cleanly
      const validFile = new File(["pdf content"], "report.pdf", { type: "application/pdf" });
      fireEvent.change(fileInput, { target: { files: [validFile] } });
      expect(screen.getByText(/report\.pdf/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // UI-04: Busy State and Failure Handling (AC-04, AC-06)
  // ---------------------------------------------------------------------------
  describe("UI-04: Busy Submission and Failure Handling (AC-04, AC-06)", () => {
    it("UI-04 (AC-04): disables submit button and shows busy indicator during submission", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/categories")) {
          return { ok: true, json: async () => mockCategories } as Response;
        }
        if (urlStr.includes("/api/related-systems")) {
          return { ok: true, json: async () => mockRelatedSystems } as Response;
        }
        if (urlStr.includes("/api/tickets") && init?.method === "POST") {
          // Never resolves immediately
          return new Promise(() => {});
        }
        return { ok: false, status: 404 } as Response;
      });

      const user = userEvent.setup();
      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/category/i), "1");
      await user.selectOptions(screen.getByLabelText(/related system/i), "1");
      await user.type(screen.getByLabelText(/summary/i), "Cannot connect to office Wi-Fi");
      await user.type(screen.getByLabelText(/description/i), "The connection drops every 5 minutes.");

      const submitBtn = screen.getByRole("button", { name: /submit ticket/i });
      await user.click(submitBtn);

      // Busy state
      expect(screen.getByText(/submitting…/i)).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();
    });

    it("UI-04 (AC-06): preserves entered field values and displays error when backend fails", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/categories")) {
          return { ok: true, json: async () => mockCategories } as Response;
        }
        if (urlStr.includes("/api/related-systems")) {
          return { ok: true, json: async () => mockRelatedSystems } as Response;
        }
        if (urlStr.includes("/api/tickets") && init?.method === "POST") {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: "Internal Database Error" }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const user = userEvent.setup();
      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/category/i), "1");
      await user.selectOptions(screen.getByLabelText(/related system/i), "2");
      await user.type(screen.getByLabelText(/summary/i), "VPN connection timeout");
      await user.type(screen.getByLabelText(/description/i), "Error 800 received when connecting to VPN.");

      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      // Server error banner displayed
      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
        expect(screen.getByText(/internal database error/i)).toBeInTheDocument();
      });

      // Form values are PRESERVED (AC-06, BR-15)
      expect(screen.getByLabelText(/summary/i)).toHaveValue("VPN connection timeout");
      expect(screen.getByLabelText(/description/i)).toHaveValue("Error 800 received when connecting to VPN.");
      expect(screen.getByLabelText(/category/i)).toHaveValue("1");
      expect(screen.getByLabelText(/related system/i)).toHaveValue("2");
    });
  });

  // ---------------------------------------------------------------------------
  // UI-05: Success View and Action Handling (AC-01, AC-07)
  // ---------------------------------------------------------------------------
  describe("UI-05: Success View (AC-01, AC-07)", () => {
    it("UI-05 (AC-01): submits ticket and renders success card with official Ticket Number", async () => {
      const mockCreatedTicket = {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Broken keyboard keys",
        description: "The spacebar and enter keys do not respond.",
        requestedPriority: "HIGH",
        currentStatus: "NEW",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/categories")) {
          return { ok: true, json: async () => mockCategories } as Response;
        }
        if (urlStr.includes("/api/related-systems")) {
          return { ok: true, json: async () => mockRelatedSystems } as Response;
        }
        if (urlStr.includes("/api/tickets") && init?.method === "POST") {
          return {
            ok: true,
            status: 201,
            json: async () => mockCreatedTicket,
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const user = userEvent.setup();
      const onViewTicketsMock = vi.fn();

      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={onViewTicketsMock}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/category/i), "1");
      await user.selectOptions(screen.getByLabelText(/related system/i), "1");
      await user.click(screen.getByRole("radio", { name: /high/i }));
      await user.type(screen.getByLabelText(/summary/i), "Broken keyboard keys");
      await user.type(screen.getByLabelText(/description/i), "The spacebar and enter keys do not respond.");

      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      // Success view renders official Ticket Number
      await waitFor(() => {
        expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
      });
      expect(screen.getByText(/ticket created successfully!/i)).toBeInTheDocument();

      // Click "View in My Tickets"
      const viewTicketsBtn = screen.getByRole("button", { name: /view in my tickets/i });
      await user.click(viewTicketsBtn);
      expect(onViewTicketsMock).toHaveBeenCalledTimes(1);
    });

    it("UI-05 (AC-07): handles partial success when ticket creates but attachment fails", async () => {
      const mockCreatedTicket = {
        id: 102,
        ticketNumber: "TKT-2026-000102",
        requesterId: 1,
        categoryId: 2,
        relatedSystemId: 1,
        summary: "Email attachment synchronization error",
        description: "Outlook throws error code 0x8004010F when sending files.",
        requestedPriority: "MEDIUM",
        currentStatus: "NEW",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        const urlStr = url.toString();
        if (urlStr.includes("/api/categories")) {
          return { ok: true, json: async () => mockCategories } as Response;
        }
        if (urlStr.includes("/api/related-systems")) {
          return { ok: true, json: async () => mockRelatedSystems } as Response;
        }
        // POST /api/tickets succeeds
        if (urlStr.includes("/api/tickets") && !urlStr.includes("/attachments") && init?.method === "POST") {
          return {
            ok: true,
            status: 201,
            json: async () => mockCreatedTicket,
          } as Response;
        }
        // POST /api/tickets/:id/attachments fails
        if (urlStr.includes("/attachments") && init?.method === "POST") {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: "Disk storage full" }),
          } as Response;
        }
        return { ok: false, status: 404 } as Response;
      });

      const user = userEvent.setup();
      render(
        <CreateTicket
          currentRequester={mockRequester}
          onSuccessViewTickets={vi.fn()}
          onCancel={vi.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole("option", { name: "Hardware" })).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/category/i), "2");
      await user.selectOptions(screen.getByLabelText(/related system/i), "1");
      await user.type(screen.getByLabelText(/summary/i), "Email attachment synchronization error");
      await user.type(screen.getByLabelText(/description/i), "Outlook throws error code 0x8004010F when sending files.");

      // Attach valid image
      const fileInput = screen.getByLabelText(/supporting attachment/i);
      const testFile = new File(["sample image"], "screenshot.png", { type: "image/png" });
      await user.upload(fileInput, testFile);

      await user.click(screen.getByRole("button", { name: /submit ticket/i }));

      // Ticket is STILL created (AC-07, BR-16) and Ticket Number is shown
      await waitFor(() => {
        expect(screen.getByText("TKT-2026-000102")).toBeInTheDocument();
      });

      // Warning alert shows attachment notice
      expect(screen.getByText(/attachment notice:/i)).toBeInTheDocument();
      expect(screen.getByText(/disk storage full/i)).toBeInTheDocument();
    });
  });
});
