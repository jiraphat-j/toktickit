import React from "react";
import { DevRequester } from "../api.js";

interface AppHeaderProps {
  currentRequester: DevRequester;
  activeTab: "my-tickets" | "create-ticket";
  onTabChange: (tab: "my-tickets" | "create-ticket") => void;
  onChangeRequester: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRequester,
  activeTab,
  onTabChange,
  onChangeRequester,
}) => {
  const initials = currentRequester.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="zen-header">
      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <a href="#home" className="zen-brand" onClick={(e) => { e.preventDefault(); onTabChange("my-tickets"); }}>
          <span style={{ fontSize: "1.4rem" }}>🟢</span>
          <span>TokTickIT</span>
        </a>

        <nav className="zen-nav">
          <button
            type="button"
            className={`zen-nav-item ${activeTab === "my-tickets" ? "active" : ""}`}
            onClick={() => onTabChange("my-tickets")}
            style={{ background: "none", border: "none" }}
          >
            My Tickets
          </button>
          <button
            type="button"
            className={`zen-nav-item ${activeTab === "create-ticket" ? "active" : ""}`}
            onClick={() => onTabChange("create-ticket")}
            style={{ background: "none", border: "none" }}
          >
            Create Ticket
          </button>
        </nav>
      </div>

      <div className="zen-profile-area">
        <div className="zen-user-badge">
          <div className="zen-user-avatar">{initials}</div>
          <span>{currentRequester.fullName}</span>
        </div>

        <button
          type="button"
          className="zen-btn-outline-light"
          onClick={onChangeRequester}
          title="Switch to another development requester"
        >
          Change Requester
        </button>
      </div>
    </header>
  );
};
