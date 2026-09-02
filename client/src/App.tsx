import { useState, useEffect } from "react";
import "./styles/zen-green.css";
import {
  DevRequester,
  Category,
  checkSystem,
  fetchActiveDevRequesters,
  getStoredRequesterId,
  setStoredRequesterId,
} from "./api.js";
import { AppHeader } from "./components/AppHeader.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail.js";

export default function App() {
  const [currentRequester, setCurrentRequester] = useState<DevRequester | null>(null);
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [revalidating, setRevalidating] = useState<boolean>(true);

  // Lab 1 Health & Category diagnostic state (retained for backward test compatibility)
  const [sysStatus, setSysStatus] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [sysCategories, setSysCategories] = useState<Category[]>([]);
  const [sysError, setSysError] = useState<string>("");

  // BR-31, AC-35: Revalidate stored session on mount/reload
  useEffect(() => {
    async function revalidateSession() {
      const storedId = getStoredRequesterId();
      if (!storedId) {
        setRevalidating(false);
        return;
      }

      try {
        const activeRequesters = await fetchActiveDevRequesters();
        const matched = activeRequesters.find((r) => r.id === storedId);
        if (matched) {
          setCurrentRequester(matched);
        } else {
          setStoredRequesterId(null);
          setCurrentRequester(null);
        }
      } catch {
        setStoredRequesterId(null);
        setCurrentRequester(null);
      } finally {
        setRevalidating(false);
      }
    }

    revalidateSession();
  }, []);

  const handleSelectRequester = (requester: DevRequester) => {
    setStoredRequesterId(requester.id);
    setCurrentRequester(requester);
    setSelectedTicketId(null);
  };

  const handleChangeRequester = () => {
    setStoredRequesterId(null);
    setCurrentRequester(null);
    setSelectedTicketId(null);
  };

  const handleTabChange = (tab: "my-tickets" | "create-ticket") => {
    setActiveTab(tab);
    setSelectedTicketId(null);
  };

  async function handleCheckSystem() {
    setSysStatus("loading");
    setSysError("");
    try {
      const res = await checkSystem();
      setSysCategories(res.categories);
      setSysStatus("online");
    } catch (err: any) {
      setSysError(err.message || "Failed to connect to API");
      setSysStatus("offline");
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
      {revalidating ? (
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--color-secondary-green)" }}>
          <div className="spinner-border text-success" role="status" />
          <p style={{ marginTop: "1rem", fontWeight: 500 }}>Loading…</p>
        </div>
      ) : !currentRequester ? (
        <div>
          <RequesterSelector onSelect={handleSelectRequester} />
          {/* Diagnostic System Check container */}
          <div style={{ maxWidth: 520, margin: "1rem auto 3rem", textAlign: "center", padding: "0 1rem" }}>
            <button
              type="button"
              className="zen-btn-secondary"
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem" }}
              onClick={handleCheckSystem}
              disabled={sysStatus === "loading"}
            >
              {sysStatus === "loading" ? "Loading…" : "Check System"}
            </button>

            {sysStatus === "online" && (
              <div className="alert alert-success mt-2 p-2" role="alert" style={{ fontSize: "0.85rem" }}>
                <strong>System Status:</strong> Online
              </div>
            )}
            {sysStatus === "offline" && (
              <div className="alert alert-danger mt-2 p-2" role="alert" style={{ fontSize: "0.85rem" }}>
                <strong>System Status:</strong> Offline ({sysError})
              </div>
            )}
            {sysCategories.length > 0 && (
              <ul className="list-group mt-2" style={{ fontSize: "0.85rem", textAlign: "left" }}>
                {sysCategories.map((cat) => (
                  <li key={cat.id} className="list-group-item py-1">
                    {cat.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div>
          <AppHeader
            currentRequester={currentRequester}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onChangeRequester={handleChangeRequester}
          />

          <main className="container py-4" style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem" }}>
            {activeTab === "my-tickets" && (
              selectedTicketId !== null ? (
                <RequesterTicketDetail
                  ticketId={selectedTicketId}
                  currentRequester={currentRequester}
                  onBack={() => setSelectedTicketId(null)}
                />
              ) : (
                <MyTickets
                  currentRequester={currentRequester}
                  onCreateTicketClick={() => {
                    setActiveTab("create-ticket");
                    setSelectedTicketId(null);
                  }}
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                />
              )
            )}

            {activeTab === "create-ticket" && (
              <CreateTicket
                currentRequester={currentRequester}
                onSuccessViewTickets={() => {
                  setActiveTab("my-tickets");
                  setSelectedTicketId(null);
                }}
                onCancel={() => {
                  setActiveTab("my-tickets");
                  setSelectedTicketId(null);
                }}
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}
