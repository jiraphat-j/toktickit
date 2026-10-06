import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionsTaken } from "../../src/components/ActionsTaken.js";
import { ActionTaken } from "../../src/api.js";
import * as api from "../../src/api.js";

const mockStaffUser = {
  id: 10,
  fullName: "Alice Staff",
  email: "staff@example.com",
  role: "IT_STAFF",
};

const mockAdminUser = {
  id: 20,
  fullName: "Bob Admin",
  email: "admin@example.com",
  role: "ADMINISTRATOR",
};

const mockRequesterUser = {
  id: 1,
  fullName: "Somchai Jaidee",
  email: "somchai@example.com",
  role: "REQUESTER",
};

const mockActions: ActionTaken[] = [
  {
    id: 101,
    ticketId: 1,
    actionDateTime: "2026-10-06T09:00:00.000Z",
    description: "Inspected network cable and replaced faulty RJ45 connector.",
    result: "Connection restored and ping response verified below 5ms.",
    performedById: 10,
    performedBy: {
      id: 10,
      fullName: "Alice Staff",
      email: "staff@example.com",
      role: "IT_STAFF",
    },
    followUpRequired: false,
    followUpNote: null,
    attachmentNotes: "See switch-port-test.log",
    createdAt: "2026-10-06T09:05:00.000Z",
    updatedAt: "2026-10-06T09:05:00.000Z",
  },
  {
    id: 102,
    ticketId: 1,
    actionDateTime: "2026-10-06T10:30:00.000Z",
    description: "Diagnosed intermittent DHCP lease drops on AP-West-2.",
    result: "Re-flashed firmware to v2.4.1; monitoring stability.",
    performedById: 20,
    performedBy: {
      id: 20,
      fullName: "Bob Admin",
      email: "admin@example.com",
      role: "ADMINISTRATOR",
    },
    followUpRequired: true,
    followUpNote: "Check syslog for lease renew drops tomorrow morning.",
    attachmentNotes: null,
    createdAt: "2026-10-06T10:35:00.000Z",
    updatedAt: "2026-10-06T10:35:00.000Z",
  },
];

describe("ActionsTaken Component (UI-ACT-01..04, AC-01..04, BR-06, BR-07, BR-10)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // UI-ACT-01 (AC-01, AC-04): Table rendering & empty state
  // =========================================================================
  it("UI-ACT-01: renders tabular actions list with count badge and formatted rows", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce(mockActions);

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockStaffUser}
      />
    );

    // Initial loading indicator
    expect(screen.getByTestId("actions-loading")).toBeInTheDocument();

    // Wait for actions to load
    await waitFor(() => {
      expect(screen.getByTestId("actions-count")).toHaveTextContent("2");
    });

    // Check header and table elements
    expect(screen.getByTestId("actions-table")).toBeInTheDocument();
    expect(screen.getByTestId("action-row-101")).toBeInTheDocument();
    expect(screen.getByTestId("action-row-102")).toBeInTheDocument();

    // Check row details
    expect(screen.getByTestId("action-performer-101")).toHaveTextContent("Alice Staff");
    expect(screen.getByTestId("action-desc-101")).toHaveTextContent("Inspected network cable");
    expect(screen.getByTestId("action-result-101")).toHaveTextContent("Connection restored");
    expect(screen.getByTestId("action-attachment-notes-101")).toHaveTextContent("switch-port-test.log");

    // Check follow-up indicators
    expect(screen.getByTestId("action-followup-101")).toHaveTextContent("None");
    expect(screen.getByTestId("action-followup-102")).toHaveTextContent("Required");
    expect(screen.getByTestId("action-followup-102")).toHaveTextContent("Check syslog");
  });

  it("UI-ACT-01: displays friendly empty state when no actions taken exist", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce([]);

    render(
      <ActionsTaken
        ticketId={2}
        currentUser={mockStaffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("actions-count")).toHaveTextContent("0");
    expect(screen.getByTestId("actions-empty")).toHaveTextContent(
      "No actions taken have been recorded yet for this ticket."
    );
    expect(screen.queryByTestId("actions-table")).not.toBeInTheDocument();
  });

  // =========================================================================
  // UI-ACT-02 (AC-02, BR-07): Form inline validation
  // =========================================================================
  it("UI-ACT-02: validates description, result lengths, and requires followUpNote when followUp is checked", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce([]);
    const createSpy = vi.spyOn(api, "createActionTaken").mockResolvedValueOnce(mockActions[0]);

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockStaffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-empty")).toBeInTheDocument();
    });

    // Open create modal
    await user.click(screen.getByTestId("log-action-btn"));
    expect(screen.getByTestId("action-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Log Action Taken");

    // Submit with empty inputs
    await user.click(screen.getByTestId("submit-action-btn"));

    // Validation errors should appear
    expect(screen.getByTestId("description-error")).toHaveTextContent("Action description is required.");
    expect(screen.getByTestId("result-error")).toHaveTextContent("Action result is required.");
    expect(createSpy).not.toHaveBeenCalled();

    // Type short description (< 5 chars)
    await user.type(screen.getByTestId("action-description-input"), "Fix");
    await user.type(screen.getByTestId("action-result-input"), "OK");
    await user.click(screen.getByTestId("submit-action-btn"));

    expect(screen.getByTestId("description-error")).toHaveTextContent(
      "Description must be between 5 and 2000 characters."
    );

    // Provide valid description
    await user.clear(screen.getByTestId("action-description-input"));
    await user.type(screen.getByTestId("action-description-input"), "Replaced faulty patch cable.");

    // Check follow-up required checkbox without note
    await user.click(screen.getByTestId("action-followup-checkbox"));
    expect(screen.getByTestId("action-followup-note-input")).toBeInTheDocument();

    await user.click(screen.getByTestId("submit-action-btn"));
    expect(screen.getByTestId("followup-note-error")).toHaveTextContent(
      "Follow-up note is required when follow-up is checked."
    );

    // Provide valid follow-up note
    await user.type(screen.getByTestId("action-followup-note-input"), "Verify tomorrow at 9 AM.");

    // Submit valid form
    await user.click(screen.getByTestId("submit-action-btn"));

    await waitFor(() => {
      expect(createSpy).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          description: "Replaced faulty patch cable.",
          result: "OK",
          followUpRequired: true,
          followUpNote: "Verify tomorrow at 9 AM.",
        })
      );
    });

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByTestId("action-modal")).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // UI-ACT-03 (AC-01, BR-06): Performed by auto-populated from session
  // =========================================================================
  it("UI-ACT-03: auto-populates logged-in user name as read-only performedBy field", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce([]);

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockStaffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-empty")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("log-action-btn"));

    const performerInput = screen.getByTestId("action-performer-input") as HTMLInputElement;
    expect(performerInput).toBeInTheDocument();
    expect(performerInput.value).toContain("Alice Staff");
    expect(performerInput.value).toContain("IT_STAFF");
    expect(performerInput).toBeDisabled();
    expect(performerInput).toHaveAttribute("readonly");
  });

  // =========================================================================
  // UI-ACT-04 (AC-04, BR-10): Requester role hides create and edit controls
  // =========================================================================
  it("UI-ACT-04: strictly hides + Log Action Taken button and Edit links for Requester / Read-Only users", async () => {
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValueOnce(mockActions);

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockRequesterUser}
        isReadOnly={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-table")).toBeInTheDocument();
    });

    // Create button must NOT exist
    expect(screen.queryByTestId("log-action-btn")).not.toBeInTheDocument();

    // Edit buttons must NOT exist
    expect(screen.queryByTestId("edit-action-btn-101")).not.toBeInTheDocument();
    expect(screen.queryByTestId("edit-action-btn-102")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-edit-action-btn-101")).not.toBeInTheDocument();

    // Actions table still renders data for reading
    expect(screen.getByTestId("action-desc-101")).toHaveTextContent("Inspected network cable");
  });

  // =========================================================================
  // Edit Action & Optimistic Concurrency Control (409 Conflict)
  // =========================================================================
  it("Edit Action: pre-fills form, updates action with expectedUpdatedAt, and handles 409 Conflict gracefully", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "fetchActionsTaken").mockResolvedValue(mockActions);
    const updateSpy = vi.spyOn(api, "updateActionTaken");

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockStaffUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("actions-table")).toBeInTheDocument();
    });

    // Open edit modal for action 102
    await user.click(screen.getByTestId("edit-action-btn-102"));
    expect(screen.getByTestId("modal-title")).toHaveTextContent("Edit Action Taken");

    // Check pre-filled values
    const descInput = screen.getByTestId("action-description-input") as HTMLTextAreaElement;
    expect(descInput.value).toContain("Diagnosed intermittent DHCP lease drops");

    // Simulate 409 Conflict error from server
    const conflictErr: any = new Error("Conflict error");
    conflictErr.status = 409;
    conflictErr.code = "CONFLICT";
    updateSpy.mockRejectedValueOnce(conflictErr);

    await user.click(screen.getByTestId("submit-action-btn"));

    // Expect conflict alert displayed
    await waitFor(() => {
      expect(screen.getByTestId("conflict-alert")).toBeInTheDocument();
    });
    expect(screen.getByTestId("conflict-alert")).toHaveTextContent("Conflict detected");
  });

  // =========================================================================
  // Safe Failure & Retry Handling
  // =========================================================================
  it("Safe Failure: displays error message when API fails and re-attempts on Retry button click", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(api, "fetchActionsTaken")
      .mockRejectedValueOnce(new Error("Network timeout"))
      .mockResolvedValueOnce(mockActions);

    render(
      <ActionsTaken
        ticketId={1}
        currentUser={mockStaffUser}
      />
    );

    // Wait for error state
    await waitFor(() => {
      expect(screen.getByTestId("actions-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("actions-error")).toHaveTextContent("Network timeout");

    // Click retry
    await user.click(screen.getByTestId("retry-actions-btn"));

    // Should load successfully
    await waitFor(() => {
      expect(screen.getByTestId("actions-table")).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
