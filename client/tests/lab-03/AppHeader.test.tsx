import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AppHeader } from "../../src/components/AppHeader";
import { AuthUser } from "../../src/api";

describe("AppHeader Cross-Feature UI Shell Tests (Issue #40, UI-01, AC-05)", () => {
  const requesterUser: AuthUser = {
    id: 1,
    fullName: "Somchai Jaidee",
    email: "somchai@example.com",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: false,
  };

  const staffUser: AuthUser = {
    id: 2,
    fullName: "Somsak Staff",
    email: "somsak@example.com",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
  };

  const adminUser: AuthUser = {
    id: 3,
    fullName: "Wichai Admin",
    email: "wichai@example.com",
    role: "ADMINISTRATOR",
    isActive: true,
    mustChangePassword: false,
  };

  it("renders Requester navigation and profile badge", () => {
    const handleTabChange = vi.fn();
    const handleLogout = vi.fn();

    render(
      <AppHeader
        currentUser={requesterUser}
        activeTab="my-tickets"
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    );

    // Should see My Tickets and Create Ticket
    expect(screen.getByRole("button", { name: "My Tickets" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create Ticket" })).toBeInTheDocument();

    // Should NOT see Ticket Queue or User Management
    expect(screen.queryByRole("button", { name: "Ticket Queue" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "User Management" })).not.toBeInTheDocument();

    // Profile badge displays name and Requester
    expect(screen.getByText("Somchai Jaidee")).toBeInTheDocument();
    expect(screen.getByText("Requester")).toBeInTheDocument();
  });

  it("renders IT Staff navigation and profile badge", () => {
    const handleTabChange = vi.fn();
    const handleLogout = vi.fn();

    render(
      <AppHeader
        currentUser={staffUser}
        activeTab="queue"
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    );

    // Should see Ticket Queue
    expect(screen.getByRole("button", { name: "Ticket Queue" })).toBeInTheDocument();

    // Should NOT see My Tickets, Create Ticket, or User Management
    expect(screen.queryByRole("button", { name: "My Tickets" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Ticket" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "User Management" })).not.toBeInTheDocument();

    // Profile badge
    expect(screen.getByText("Somsak Staff")).toBeInTheDocument();
    expect(screen.getByText("IT Staff")).toBeInTheDocument();
  });

  it("renders Administrator navigation and profile badge", () => {
    const handleTabChange = vi.fn();
    const handleLogout = vi.fn();

    render(
      <AppHeader
        currentUser={adminUser}
        activeTab="users"
        onTabChange={handleTabChange}
        onLogout={handleLogout}
      />
    );

    // Should see User Management and Ticket Queue
    expect(screen.getByRole("button", { name: "User Management" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ticket Queue" })).toBeInTheDocument();

    // Should NOT see My Tickets or Create Ticket
    expect(screen.queryByRole("button", { name: "My Tickets" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create Ticket" })).not.toBeInTheDocument();

    // Profile badge
    expect(screen.getByText("Wichai Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("triggers onTabChange when navigation tab is clicked", () => {
    const handleTabChange = vi.fn();
    render(
      <AppHeader
        currentUser={adminUser}
        activeTab="users"
        onTabChange={handleTabChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Ticket Queue" }));
    expect(handleTabChange).toHaveBeenCalledWith("queue");
  });

  it("triggers onLogout when Sign Out button is clicked", () => {
    const handleLogout = vi.fn();
    render(
      <AppHeader
        currentUser={requesterUser}
        activeTab="my-tickets"
        onTabChange={vi.fn()}
        onLogout={handleLogout}
      />
    );

    const logoutBtn = screen.getByRole("button", { name: "Sign Out" });
    fireEvent.click(logoutBtn);
    expect(handleLogout).toHaveBeenCalledTimes(1);
  });

  it("redirects brand logo click to the default landing tab based on role", () => {
    const handleTabChange = vi.fn();
    const { rerender } = render(
      <AppHeader
        currentUser={staffUser}
        activeTab="queue"
        onTabChange={handleTabChange}
      />
    );

    const brand = screen.getByText("TokTickIT");
    fireEvent.click(brand);
    expect(handleTabChange).toHaveBeenCalledWith("queue");

    rerender(
      <AppHeader
        currentUser={adminUser}
        activeTab="queue"
        onTabChange={handleTabChange}
      />
    );
    fireEvent.click(brand);
    expect(handleTabChange).toHaveBeenCalledWith("users");
  });
});
