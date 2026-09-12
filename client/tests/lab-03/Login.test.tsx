import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Login } from "../../src/components/Login.js";
import * as api from "../../src/api.js";

describe("Login UI Component (UI-01, AC-01, AC-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // UI-01: Component renders heading, inputs, and button
  it("renders TokTickIT branding, email and password inputs, and submit button", () => {
    render(<Login onLoginSuccess={vi.fn()} />);

    expect(screen.getByText("TokTickIT")).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  // UI-01: Client-side validation on empty inputs
  it("displays inline validation errors when submitting with empty fields", async () => {
    const user = userEvent.setup();
    render(<Login onLoginSuccess={vi.fn()} />);

    const submitBtn = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitBtn);

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  // UI-01: Displays error alert on invalid credentials
  it("displays safe error banner on authentication failure (401)", async () => {
    vi.spyOn(api, "loginUser").mockRejectedValueOnce(new Error("Invalid email or password"));

    const user = userEvent.setup();
    render(<Login onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/email address/i), "wrong@user.com");
    await user.type(screen.getByLabelText(/password/i), "WrongPassword123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
  });

  // UI-01: Busy state during in-flight request
  it("shows busy state and disables submit button during in-flight request", async () => {
    let resolveLogin: any;
    vi.spyOn(api, "loginUser").mockImplementationOnce(() => new Promise((res) => { resolveLogin = res; }));

    const user = userEvent.setup();
    render(<Login onLoginSuccess={vi.fn()} />);

    await user.type(screen.getByLabelText(/email address/i), "somchai.j@kmutt.ac.th");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();

    resolveLogin({
      id: 1,
      email: "somchai.j@kmutt.ac.th",
      fullName: "Somchai Jaidee",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    });
  });

  // UI-01: Success invokes onLoginSuccess
  it("calls onLoginSuccess with user profile on successful authentication", async () => {
    const mockUser: api.AuthUser = {
      id: 1,
      email: "somchai.j@kmutt.ac.th",
      fullName: "Somchai Jaidee",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    };
    vi.spyOn(api, "loginUser").mockResolvedValueOnce(mockUser);

    const onLoginSuccess = vi.fn();
    const user = userEvent.setup();
    render(<Login onLoginSuccess={onLoginSuccess} />);

    await user.type(screen.getByLabelText(/email address/i), "somchai.j@kmutt.ac.th");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith(mockUser);
    });
  });
});
