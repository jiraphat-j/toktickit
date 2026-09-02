import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { AttachmentSection } from "../../src/components/AttachmentSection.js";
import * as api from "../../src/api.js";

const mockRequester: api.DevRequester = {
  id: 1,
  fullName: "Somchai Jaidee",
  email: "somchai.j@kmutt.ac.th",
  isActive: true,
};

const mockActiveAttachment: api.AttachmentMeta = {
  id: 10,
  ticketId: 101,
  originalFileName: "error_screen.png",
  storedFileName: "uuid-10.png",
  mimeType: "image/png",
  sizeBytes: 245000,
  uploadedAt: "2026-08-29T10:00:00.000Z",
  isRemoved: false,
  removedAt: null,
  removedReason: null,
};

const mockRemovedAttachment: api.AttachmentMeta = {
  id: 11,
  ticketId: 101,
  originalFileName: "deprecated_trace.pdf",
  storedFileName: "uuid-11.pdf",
  mimeType: "application/pdf",
  sizeBytes: 512000,
  uploadedAt: "2026-08-29T09:30:00.000Z",
  isRemoved: true,
  removedAt: "2026-08-29T11:00:00.000Z",
  removedReason: "Replaced by newer diagnostic capture due to incorrect timestamp.",
};

describe("AttachmentSection Component (Issue 8 / UI-09)", () => {
  const mockOnAttachmentChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("UI-09 (AC-12, AC-14, AC-32): renders active and soft-removed attachments properly", () => {
    render(
      <AttachmentSection
        ticketId={101}
        currentRequester={mockRequester}
        attachments={[mockActiveAttachment, mockRemovedAttachment]}
        onAttachmentChange={mockOnAttachmentChange}
      />
    );

    // Active attachment card scoping
    const activeCard = screen.getByTestId("attachment-item-10");
    expect(within(activeCard).getByText(/error_screen\.png/i)).toBeInTheDocument();

    const downloadLink = within(activeCard).getByRole("link", { name: /download error_screen\.png/i });
    expect(downloadLink).toBeInTheDocument();
    expect(downloadLink).toHaveAttribute("href", expect.stringContaining("/api/attachments/10/download"));

    const removeBtn = within(activeCard).getByRole("button", { name: /remove error_screen\.png/i });
    expect(removeBtn).toBeInTheDocument();

    // Removed attachment card scoping (AC-32)
    const removedCard = screen.getByTestId("removed-attachment-item-11");
    expect(within(removedCard).getByText(/deprecated_trace\.pdf/i)).toBeInTheDocument();
    expect(within(removedCard).getByText(/Replaced by newer diagnostic capture/i)).toBeInTheDocument();
    expect(within(removedCard).getByText("Removed")).toBeInTheDocument();
    expect(within(removedCard).queryByRole("link")).not.toBeInTheDocument();
  });

  it("UI-09 (AC-13, BR-21): soft removal modal enforces non-empty reason with minimum 3 characters", async () => {
    render(
      <AttachmentSection
        ticketId={101}
        currentRequester={mockRequester}
        attachments={[mockActiveAttachment]}
        onAttachmentChange={mockOnAttachmentChange}
      />
    );

    // Click Remove button to open modal
    const removeBtn = screen.getByRole("button", { name: /remove error_screen\.png/i });
    fireEvent.click(removeBtn);

    // Modal is opened
    expect(screen.getByTestId("removal-modal")).toBeInTheDocument();
    expect(screen.getByText(/Confirm Soft Removal/i)).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("confirm-removal-button");
    const reasonInput = screen.getByLabelText(/removal reason/i);

    // Initially disabled (empty reason)
    expect(confirmBtn).toBeDisabled();

    // 2 characters: still disabled
    fireEvent.change(reasonInput, { target: { value: "ab" } });
    expect(confirmBtn).toBeDisabled();

    // Whitespace only: still disabled
    fireEvent.change(reasonInput, { target: { value: "   " } });
    expect(confirmBtn).toBeDisabled();

    // 3 characters: now enabled!
    fireEvent.change(reasonInput, { target: { value: "abc" } });
    expect(confirmBtn).not.toBeDisabled();
  });

  it("UI-09 (AC-13, AC-15): confirming removal calls API and notifies parent", async () => {
    vi.spyOn(api, "removeTicketAttachment").mockResolvedValueOnce({
      ...mockActiveAttachment,
      isRemoved: true,
      removedReason: "Duplicate file",
    });

    render(
      <AttachmentSection
        ticketId={101}
        currentRequester={mockRequester}
        attachments={[mockActiveAttachment]}
        onAttachmentChange={mockOnAttachmentChange}
      />
    );

    // Open removal modal
    fireEvent.click(screen.getByRole("button", { name: /remove error_screen\.png/i }));

    // Type valid reason
    const reasonInput = screen.getByLabelText(/removal reason/i);
    fireEvent.change(reasonInput, { target: { value: "Duplicate file uploaded" } });

    // Confirm removal
    const confirmBtn = screen.getByTestId("confirm-removal-button");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.removeTicketAttachment).toHaveBeenCalledWith(
        1,
        10,
        "Duplicate file uploaded"
      );
      expect(mockOnAttachmentChange).toHaveBeenCalledTimes(1);
    });

    // Modal closes
    expect(screen.queryByTestId("removal-modal")).not.toBeInTheDocument();
  });

  it("UI-09 (AC-11, BR-19): displays cap warning and disables upload when active count is 5", () => {
    const fiveActiveAttachments: api.AttachmentMeta[] = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      ticketId: 101,
      originalFileName: `file_${i + 1}.png`,
      storedFileName: `uuid-${i + 1}.png`,
      mimeType: "image/png",
      sizeBytes: 100000,
      uploadedAt: "2026-08-29T10:00:00.000Z",
      isRemoved: false,
    }));

    render(
      <AttachmentSection
        ticketId={101}
        currentRequester={mockRequester}
        attachments={fiveActiveAttachments}
        onAttachmentChange={mockOnAttachmentChange}
      />
    );

    // Cap warning is displayed
    expect(screen.getByTestId("cap-reached-alert")).toBeInTheDocument();
    expect(screen.getByText(/Active attachment limit reached/i)).toBeInTheDocument();

    // File input is disabled
    const fileInput = screen.getByLabelText(/choose file to attach/i);
    expect(fileInput).toBeDisabled();

    // Submit button is disabled
    const submitBtn = screen.getByRole("button", { name: /upload file/i });
    expect(submitBtn).toBeDisabled();
  });
});
