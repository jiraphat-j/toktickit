import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App Authentication & Shell Integration (UI-01, AC-01, AC-02, AC-05)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    document.cookie = "toktickit_auth=; Max-Age=0; path=/";
  });

  it("renders Login screen by default when unauthenticated", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it("enters Authenticated App Shell immediately on login without gating on currentRequester", async () => {
    vi.spyOn(api, "loginUser").mockResolvedValueOnce({
      id: 1,
      email: "somchai.j@kmutt.ac.th",
      fullName: "Somchai Jaidee",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: false,
    });
    vi.spyOn(api, "fetchMyTickets").mockResolvedValueOnce({
      items: [],
      pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/email address/i), "somchai.j@kmutt.ac.th");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
      expect(screen.getByText("Requester")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    });
  });

  it("renders ChangePassword screen when user has mustChangePassword = true", async () => {
    vi.spyOn(api, "loginUser").mockResolvedValueOnce({
      id: 1,
      email: "somchai.j@kmutt.ac.th",
      fullName: "Somchai Jaidee",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
    });

    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/email address/i), "somchai.j@kmutt.ac.th");
    await user.type(screen.getByLabelText(/password/i), "Password123!");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Change Password Required")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /update password/i })).toBeInTheDocument();
    });
  });
});
