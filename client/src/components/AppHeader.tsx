import React from "react";
import { DevRequester, AuthUser } from "../api.js";

interface AppHeaderProps {
  currentRequester?: DevRequester | null;
  currentUser?: AuthUser | null;
  activeTab: "my-tickets" | "create-ticket" | "queue" | "users";
  onTabChange: (tab: any) => void;
  onChangeRequester?: () => void;
  onLogout?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRequester,
  currentUser,
  activeTab,
  onTabChange,
  onChangeRequester,
  onLogout,
}) => {
  const displayName = currentUser?.fullName || currentRequester?.fullName || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const role = currentUser?.role;

  return (
    <header className="zen-header">
      <div className="zen-header-brand-nav">
        <a
          href="#home"
          className="zen-brand"
          onClick={(e) => {
            e.preventDefault();
            if (role === "IT_STAFF") onTabChange("queue");
            else if (role === "ADMINISTRATOR") onTabChange("users");
            else onTabChange("my-tickets");
          }}
        >
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <span>TokTickIT</span>
        </a>

        <nav className="zen-nav" aria-label="Main Navigation">
          {(!role || role === "REQUESTER") && (
            <>
              <button
                type="button"
                className={`zen-nav-item ${activeTab === "my-tickets" ? "active" : ""}`}
                onClick={() => onTabChange("my-tickets")}
              >
                My Tickets
              </button>
              <button
                type="button"
                className={`zen-nav-item ${activeTab === "create-ticket" ? "active" : ""}`}
                onClick={() => onTabChange("create-ticket")}
              >
                Create Ticket
              </button>
            </>
          )}

          {role === "IT_STAFF" && (
            <button
              type="button"
              className={`zen-nav-item ${activeTab === "queue" ? "active" : ""}`}
              onClick={() => onTabChange("queue")}
            >
              Ticket Queue
            </button>
          )}

          {role === "ADMINISTRATOR" && (
            <>
              <button
                type="button"
                className={`zen-nav-item ${activeTab === "users" ? "active" : ""}`}
                onClick={() => onTabChange("users")}
              >
                User Management
              </button>
              <button
                type="button"
                className={`zen-nav-item ${activeTab === "queue" ? "active" : ""}`}
                onClick={() => onTabChange("queue")}
              >
                Ticket Queue
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="zen-profile-area">
        <div className="zen-user-badge">
          <div className="zen-user-avatar">{initials}</div>
          <div className="d-flex flex-column align-items-start" style={{ lineHeight: 1.2 }}>
            <span style={{ fontWeight: 600 }}>{displayName}</span>
            {role && (
              <span
                className="badge"
                style={{
                  fontSize: "0.7rem",
                  padding: "0.15rem 0.4rem",
                  marginTop: "0.15rem",
                  backgroundColor:
                    role === "ADMINISTRATOR"
                      ? "#7c3aed"
                      : role === "IT_STAFF"
                      ? "#0284c7"
                      : "var(--color-primary-green)",
                  color: "#fff",
                }}
              >
                {role === "ADMINISTRATOR" ? "Admin" : role === "IT_STAFF" ? "IT Staff" : "Requester"}
              </span>
            )}
          </div>
        </div>

        {currentUser && onLogout && (
          <button
            type="button"
            className="zen-btn-outline-light"
            onClick={onLogout}
            title="Sign out of TokTickIT"
          >
            Sign Out
          </button>
        )}

        {!currentUser && onChangeRequester && (
          <button
            type="button"
            className="zen-btn-outline-light"
            onClick={onChangeRequester}
            title="Switch to another development requester"
          >
            Change Requester
          </button>
        )}
      </div>
    </header>
  );
};
