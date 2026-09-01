import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../../src/App.js";

const mockRequesters = [
  { id: 1, fullName: "Somchai Jaidee", email: "somchai.j@kmutt.ac.th", isActive: true },
  { id: 2, fullName: "Suda Sukjai", email: "suda.s@kmutt.ac.th", isActive: true },
];

describe("Development Requester Selector UI & Shell (Issue 5)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  // UI-01: Loading state
  it("UI-01 (AC-24): shows loading indicator while active requesters are being fetched", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {}) // never resolves
    );

    render(<App />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  // UI-01: Normal selection and dropdown rendering
  it("UI-01 (AC-24, AC-31): renders active requesters dropdown and testing disclaimer", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequesters,
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    });

    // Disclaimer notice (BR-03)
    expect(
      screen.getByText(/testing only and is not a login screen/i)
    ).toBeInTheDocument();

    // Check options
    const dropdown = screen.getByRole("combobox");
    expect(dropdown).toBeInTheDocument();
    expect(screen.getByText("Somchai Jaidee (somchai.j@kmutt.ac.th)")).toBeInTheDocument();
    expect(screen.getByText("Suda Sukjai (suda.s@kmutt.ac.th)")).toBeInTheDocument();
  });

  // UI-01: Validation on submit without selection
  it("UI-01: blocks submission and shows validation error if no requester is chosen", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequesters,
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    expect(screen.getByText(/please select a development requester/i)).toBeInTheDocument();
  });

  // UI-01: Empty state (AC-25)
  it("UI-01 (AC-25): displays empty state message when zero active requesters exist", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/no active development requesters found/i)).toBeInTheDocument();
    });
  });

  // UI-01: Failure and retry state (AC-26)
  it("UI-01 (AC-26): displays safe error state with retry button when API fails", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new Error("Network connection error"))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequesters,
      } as Response);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load development requesters/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /retry/i });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Somchai Jaidee (somchai.j@kmutt.ac.th)")).toBeInTheDocument();
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  // UI-01 (AC-30): Keyboard navigation and focus accessibility
  it("UI-01 (AC-30): supports keyboard navigation, visible focus, and submission via keyboard", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequesters,
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const dropdown = screen.getByRole("combobox");
    const continueBtn = screen.getByRole("button", { name: /continue/i });

    // Focus combobox and select via keyboard
    dropdown.focus();
    expect(dropdown).toHaveFocus();

    await user.selectOptions(dropdown, "2");

    // Tab to continue button
    await user.tab();
    expect(continueBtn).toHaveFocus();

    // Submit using Enter key on form / button
    await user.keyboard("{Enter}");

    // Should transition to shell
    await waitFor(() => {
      expect(screen.getByText("Suda Sukjai")).toBeInTheDocument();
    });
  });

  // UI-02: Selection flow, persistence, and shell display
  it("UI-02 (AC-31, AC-35): persists selected requester in sessionStorage and displays app shell", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequesters,
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    const dropdown = screen.getByRole("combobox");
    await user.selectOptions(dropdown, "1");

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    await user.click(continueBtn);

    // Context saved to sessionStorage (BR-31)
    expect(sessionStorage.getItem("toktickit.devRequesterId")).toBe("1");

    // Shell displays Requester info and navigation
    await waitFor(() => {
      expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    });
    expect(screen.getAllByText("My Tickets")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Create Ticket")[0]).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change requester/i })).toBeInTheDocument();
  });

  // UI-02: Change Requester action (BR-06)
  it("UI-02 (BR-06): Change Requester action clears context and returns to selector screen", async () => {
    // Pre-populate sessionStorage with valid requester ID 1
    sessionStorage.setItem("toktickit.devRequesterId", "1");

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockRequesters,
    } as Response);

    const user = userEvent.setup();
    render(<App />);

    // App shell loads directly after revalidation
    await waitFor(() => {
      expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    });

    // Click Change Requester
    const changeBtn = screen.getByRole("button", { name: /change requester/i });
    await user.click(changeBtn);

    // sessionStorage cleared and back to selector
    expect(sessionStorage.getItem("toktickit.devRequesterId")).toBeNull();
    await waitFor(() => {
      expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    });
  });
});
