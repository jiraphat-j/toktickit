import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { UserManagement } from "../../src/components/UserManagement";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  fetchAdminUsers: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  resetUserPassword: vi.fn(),
}));

describe("UI-05: User Management Component (Issue #39)", () => {
  const currentAdmin = {
    id: 1,
    fullName: "System Admin",
    email: "admin@toktickit.local",
    role: "ADMINISTRATOR" as const,
    isActive: true,
    mustChangePassword: false,
  };

  const mockUsers = [
    {
      id: 1,
      fullName: "System Admin",
      email: "admin@toktickit.local",
      role: "ADMINISTRATOR" as const,
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      id: 2,
      fullName: "Staff Member",
      email: "staff@toktickit.local",
      role: "IT_STAFF" as const,
      isActive: true,
      mustChangePassword: false,
      createdAt: "2026-03-02T00:00:00.000Z",
      updatedAt: "2026-03-02T00:00:00.000Z",
    },
    {
      id: 3,
      fullName: "Requester One",
      email: "req1@toktickit.local",
      role: "REQUESTER" as const,
      isActive: false,
      mustChangePassword: true,
      createdAt: "2026-03-03T00:00:00.000Z",
      updatedAt: "2026-03-03T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.fetchAdminUsers).mockResolvedValue({
      items: mockUsers,
      pagination: { page: 1, limit: 10, totalItems: 3, totalPages: 1 },
    });
  });

  it("renders user table, filter controls, and pagination", async () => {
    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId("user-management")).toBeInTheDocument();
    });

    expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
    expect(screen.getByTestId("user-role-filter")).toBeInTheDocument();
    expect(screen.getByTestId("user-status-filter")).toBeInTheDocument();
    expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();

    expect(screen.getByTestId("user-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("user-row-2")).toBeInTheDocument();
    expect(screen.getByTestId("user-row-3")).toBeInTheDocument();
  });

  it("disables active toggle button for the logged-in admin (SEC-05 Self-deactivation lock)", async () => {
    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId("toggle-active-btn-1")).toBeInTheDocument();
    });

    const selfToggle = screen.getByTestId("toggle-active-btn-1") as HTMLButtonElement;
    expect(selfToggle).toBeDisabled();
    expect(selfToggle.title).toContain("Cannot deactivate own account");

    const otherToggle = screen.getByTestId("toggle-active-btn-2") as HTMLButtonElement;
    expect(otherToggle).not.toBeDisabled();
  });

  it("triggers search and filter reload when submitting filter form", async () => {
    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(api.fetchAdminUsers).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId("user-search-input"), { target: { value: "Staff" } });
    fireEvent.click(screen.getByTestId("search-users-btn"));

    await waitFor(() => {
      expect(api.fetchAdminUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: "Staff" })
      );
    });
  });

  it("opens create user modal, validates input, and submits successfully", async () => {
    vi.mocked(api.createAdminUser).mockResolvedValue({
      id: 4,
      fullName: "New Person",
      email: "newperson@toktickit.local",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-03-04T00:00:00.000Z",
      updatedAt: "2026-03-04T00:00:00.000Z",
    });

    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("create-user-btn"));

    expect(screen.getByTestId("create-fullname-input")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("create-fullname-input"), { target: { value: "New Person" } });
    fireEvent.change(screen.getByTestId("create-email-input"), { target: { value: "newperson@toktickit.local" } });
    fireEvent.change(screen.getByTestId("create-role-select"), { target: { value: "IT_STAFF" } });
    fireEvent.change(screen.getByTestId("create-password-input"), { target: { value: "StrongPass123!" } });

    fireEvent.click(screen.getByTestId("submit-create-user-btn"));

    await waitFor(() => {
      expect(api.createAdminUser).toHaveBeenCalledWith({
        fullName: "New Person",
        email: "newperson@toktickit.local",
        role: "IT_STAFF",
        initialPassword: "StrongPass123!",
      });
    });
  });

  it("opens edit modal and enforces self-deactivation lock on active status checkbox", async () => {
    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-btn-1")).toBeInTheDocument();
    });

    // Edit self
    fireEvent.click(screen.getByTestId("edit-user-btn-1"));

    const activeCheckbox = screen.getByTestId("edit-active-checkbox") as HTMLInputElement;
    expect(activeCheckbox).toBeDisabled();
  });

  it("opens reset password modal and submits new password", async () => {
    vi.mocked(api.resetUserPassword).mockResolvedValue({
      success: true,
      message: "Password reset",
      mustChangePassword: true,
    });

    render(<UserManagement currentUser={currentAdmin} />);

    await waitFor(() => {
      expect(screen.getByTestId("reset-pwd-btn-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-pwd-btn-2"));

    expect(screen.getByTestId("reset-password-input")).toBeInTheDocument();
    fireEvent.change(screen.getByTestId("reset-password-input"), { target: { value: "BrandNewPass123!" } });

    fireEvent.click(screen.getByTestId("submit-reset-password-btn"));

    await waitFor(() => {
      expect(api.resetUserPassword).toHaveBeenCalledWith(2, "BrandNewPass123!");
    });
  });
});
