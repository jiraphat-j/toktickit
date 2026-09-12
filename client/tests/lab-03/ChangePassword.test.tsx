import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangePassword } from "../../src/components/ChangePassword.js";
import * as api from "../../src/api.js";

const mockUser: api.AuthUser = {
  id: 1,
  email: "somchai.j@kmutt.ac.th",
  fullName: "Somchai Jaidee",
  role: "REQUESTER",
  isActive: true,
  mustChangePassword: true,
};

describe("ChangePassword UI Component (UI-02, AC-02, AC-03)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // UI-02: Renders heading, userName, inputs, checklist, and disabled button initially
  it("renders Change Password Required heading, requirements checklist, and disabled submit button", () => {
    render(<ChangePassword user={mockUser} onPasswordChanged={vi.fn()} onLogout={vi.fn()} />);

    expect(screen.getByText(/change password required/i)).toBeInTheDocument();
    expect(screen.getByText(/Somchai Jaidee/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();

    // Requirements list
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/at least one number/i)).toBeInTheDocument();
    expect(screen.getByText(/passwords must match/i)).toBeInTheDocument();

    // Button disabled when inputs are empty
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
  });

  // UI-02: Interactive complexity feedback enables button only when all criteria are met
  it("enables submit button only when all complexity requirements and match are satisfied", async () => {
    const user = userEvent.setup();
    render(<ChangePassword user={mockUser} onPasswordChanged={vi.fn()} onLogout={vi.fn()} />);

    const newPassInput = screen.getByLabelText(/^new password/i);
    const confirmPassInput = screen.getByLabelText(/confirm new password/i);
    const submitBtn = screen.getByRole("button", { name: /update password/i });

    // Type weak password (< 8 chars)
    await user.type(newPassInput, "Ab1!");
    await user.type(confirmPassInput, "Ab1!");
    expect(submitBtn).toBeDisabled();

    // Clear and type valid password
    await user.clear(newPassInput);
    await user.clear(confirmPassInput);
    await user.type(newPassInput, "NewSecurePassword123!");
    await user.type(confirmPassInput, "NewSecurePassword123!");

    expect(submitBtn).toBeEnabled();
  });

  // UI-02: Calls API and onPasswordChanged upon success
  it("calls changeUserPassword and onPasswordChanged when submitted with valid inputs", async () => {
    vi.spyOn(api, "changeUserPassword").mockResolvedValueOnce();

    const onPasswordChanged = vi.fn();
    const user = userEvent.setup();
    render(<ChangePassword user={mockUser} onPasswordChanged={onPasswordChanged} />);

    await user.type(screen.getByLabelText(/^new password/i), "NewSecurePassword123!");
    await user.type(screen.getByLabelText(/confirm new password/i), "NewSecurePassword123!");
    await user.click(screen.getByRole("button", { name: /update password/i }));

    expect(api.changeUserPassword).toHaveBeenCalledWith(
      "NewSecurePassword123!",
      "NewSecurePassword123!"
    );

    await waitFor(() => {
      expect(onPasswordChanged).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  // UI-02: Allows user to click Sign Out
  it("calls onLogout when Sign Out button is clicked", async () => {
    vi.spyOn(api, "logoutUser").mockResolvedValueOnce();

    const onLogout = vi.fn();
    const user = userEvent.setup();
    render(<ChangePassword user={mockUser} onPasswordChanged={vi.fn()} onLogout={onLogout} />);

    const signOutBtn = screen.getByRole("button", { name: /sign out/i });
    await user.click(signOutBtn);

    expect(api.logoutUser).toHaveBeenCalled();
    expect(onLogout).toHaveBeenCalled();
  });
});
