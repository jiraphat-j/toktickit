import { useState, useEffect } from "react";
import "./styles/zen-green.css";
import {
  DevRequester,
  AuthUser,
  Category,
  checkSystem,
  fetchActiveDevRequesters,
  fetchCurrentUser,
  logoutUser,
  getStoredRequesterId,
  setStoredRequesterId,
} from "./api.js";
import { AppHeader } from "./components/AppHeader.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { RequesterTicketDetail } from "./components/RequesterTicketDetail.js";
import { Login } from "./components/Login.js";
import { ChangePassword } from "./components/ChangePassword.js";

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentRequester, setCurrentRequester] = useState<DevRequester | null>(null);
  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket" | "queue" | "users">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [revalidating, setRevalidating] = useState<boolean>(() => {
    return Boolean(
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("toktickit.hasAuthSession") === "true") ||
      getStoredRequesterId()
    );
  });

  // Lab 1 Health & Category diagnostic state (retained for backward test compatibility)
  const [sysStatus, setSysStatus] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [sysCategories, setSysCategories] = useState<Category[]>([]);
  const [sysError, setSysError] = useState<string>("");

  // Revalidate stored session / current authenticated user on mount/reload
  useEffect(() => {
    async function revalidateSession() {
      try {
        const hasAuth =
          typeof sessionStorage !== "undefined" &&
          sessionStorage.getItem("toktickit.hasAuthSession") === "true";

        if (hasAuth) {
          const auth = await fetchCurrentUser();
          if (auth) {
            setCurrentUser(auth);
            setRevalidating(false);
            return;
          } else {
            sessionStorage.removeItem("toktickit.hasAuthSession");
          }
        }

        const storedId = getStoredRequesterId();
        if (storedId) {
          const activeRequesters = await fetchActiveDevRequesters();
          const matched = activeRequesters.find((r) => r.id === storedId);
          if (matched) {
            setCurrentRequester(matched);
          } else {
            setStoredRequesterId(null);
            setCurrentRequester(null);
          }
        }
      } catch {
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.removeItem("toktickit.hasAuthSession");
        }
        setStoredRequesterId(null);
        setCurrentRequester(null);
        setCurrentUser(null);
      } finally {
        setRevalidating(false);
      }
    }

    if (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem("toktickit.hasAuthSession") === "true") ||
      getStoredRequesterId()
    ) {
      revalidateSession();
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("toktickit.hasAuthSession", "true");
    }
    setCurrentUser(user);
    if (user.role === "IT_STAFF") setActiveTab("queue");
    else if (user.role === "ADMINISTRATOR") setActiveTab("users");
    else setActiveTab("my-tickets");
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem("toktickit.hasAuthSession");
    }
    setCurrentUser(null);
    setCurrentRequester(null);
    setStoredRequesterId(null);
    setSelectedTicketId(null);
    setActiveTab("my-tickets");
  };

  const handlePasswordChanged = async () => {
    const updated = await fetchCurrentUser();
    if (updated) {
      setCurrentUser(updated);
    } else if (currentUser) {
      setCurrentUser({ ...currentUser, mustChangePassword: false });
    }
  };

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

  const handleTabChange = (tab: "my-tickets" | "create-ticket" | "queue" | "users") => {
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

  const [showLogin, setShowLogin] = useState<boolean>(() => {
    return typeof window !== "undefined" && (window.location.hash === "#login" || window.location.pathname === "/login");
  });

  // Active identity for requester views
  const effectiveRequester: DevRequester | null = currentUser
    ? {
        id: currentUser.id,
        fullName: currentUser.fullName,
        email: currentUser.email,
        isActive: currentUser.isActive,
      }
    : currentRequester;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
      {revalidating ? (
        <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--color-secondary-green)" }}>
          <div className="spinner-border text-success" role="status" />
          <p style={{ marginTop: "1rem", fontWeight: 500 }}>Loading…</p>
        </div>
      ) : currentUser && currentUser.mustChangePassword ? (
        // AC-02, BR-04: Mandatory password change screen blocks all normal navigation
        <ChangePassword
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
          onLogout={handleLogout}
        />
      ) : currentUser || currentRequester ? (
        // Authenticated or selected requester shell
        <div>
          <AppHeader
            currentUser={currentUser}
            currentRequester={currentRequester}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onChangeRequester={handleChangeRequester}
            onLogout={handleLogout}
          />

          <main className="container py-4 zen-main-container">
            {activeTab === "queue" && (
              <div className="card p-4 zen-card">
                <h3>IT Staff Ticket Queue</h3>
                <p className="text-muted">Staff ticket queue and filtering will be activated in Step 6.</p>
              </div>
            )}

            {activeTab === "users" && (
              <div className="card p-4 zen-card">
                <h3>Administrator User Management</h3>
                <p className="text-muted">Admin user management will be activated in Step 8.</p>
              </div>
            )}

            {effectiveRequester && (activeTab === "my-tickets" || activeTab === "create-ticket") && (
              activeTab === "my-tickets" ? (
                selectedTicketId !== null ? (
                  <RequesterTicketDetail
                    ticketId={selectedTicketId}
                    currentRequester={effectiveRequester}
                    onBack={() => setSelectedTicketId(null)}
                  />
                ) : (
                  <MyTickets
                    currentRequester={effectiveRequester}
                    onCreateTicketClick={() => {
                      setActiveTab("create-ticket");
                      setSelectedTicketId(null);
                    }}
                    onSelectTicket={(id) => setSelectedTicketId(id)}
                  />
                )
              ) : (
                <CreateTicket
                  currentRequester={effectiveRequester}
                  onSuccessViewTickets={() => {
                    setActiveTab("my-tickets");
                    setSelectedTicketId(null);
                  }}
                  onCancel={() => {
                    setActiveTab("my-tickets");
                    setSelectedTicketId(null);
                  }}
                />
              )
            )}
          </main>
        </div>
      ) : showLogin ? (
        // Unauthenticated view: Login Screen (Lab 3)
        <div>
          <Login onLoginSuccess={handleLoginSuccess} />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-link"
              style={{ color: "var(--color-primary-green)", fontSize: "0.85rem" }}
              onClick={() => setShowLogin(false)}
            >
              ← Back to Development Selector (Lab 2 Mode)
            </button>
          </div>
        </div>
      ) : (
        // Unauthenticated view: Dev Testing Selector (Lab 2 Mode)
        <div>
          <div style={{ maxWidth: 520, margin: "2rem auto 0", textAlign: "right", padding: "0 1rem" }}>
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => setShowLogin(true)}
              style={{ fontWeight: 600 }}
            >
              Sign In with Account (Lab 3) →
            </button>
          </div>

          <RequesterSelector onSelect={handleSelectRequester} />

          {/* Diagnostic System Check container (Lab 1) */}
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
      )}
    </div>
  );
}
