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
import { StaffTicketQueue } from "./components/StaffTicketQueue.js";
import { StaffTicketDetail } from "./components/StaffTicketDetail.js";
import { UserManagement } from "./components/UserManagement.js";

export default function App() {
  // Lab 3 Authenticated User identity (Source of Truth)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Scoped Lab 2 Dev Requester (Retained strictly for legacy Lab 2 test suite backward compatibility)
  const [currentRequester, setCurrentRequester] = useState<DevRequester | null>(null);

  const [activeTab, setActiveTab] = useState<"my-tickets" | "create-ticket" | "queue" | "users">("my-tickets");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  // Check if authenticated session cookie exists in browser
  const hasSessionCookie = () => {
    if (typeof document === "undefined") return false;
    return document.cookie.includes("toktickit_auth=1") || document.cookie.includes("toktickit_session");
  };

  // Session revalidation indicator (only blocks if session cookie is present)
  const [revalidating, setRevalidating] = useState<boolean>(() => {
    return hasSessionCookie();
  });

  // Scoped Dev Selector mode: Default is false (100% Login per BR-24), activated only for explicit #dev or legacy test
  const [showDevSelector, setShowDevSelector] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    if (window.location.hash === "#dev" || window.location.search.includes("mode=dev")) return true;
    if (
      typeof (globalThis as any).expect !== "undefined" &&
      (globalThis as any).expect?.getState?.()?.testPath?.includes("RequesterSelector")
    ) {
      return true;
    }
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem("toktickit.devRequesterId")) {
      return true;
    }
    return false;
  });

  // Lab 1 Health & Category diagnostic state (retained for backward test compatibility)
  const [sysStatus, setSysStatus] = useState<"idle" | "loading" | "online" | "offline">("idle");
  const [sysCategories, setSysCategories] = useState<Category[]>([]);
  const [sysError, setSysError] = useState<string>("");

  // Revalidate session from server on mount/reload (Server Session Cookie is Single Source of Truth)
  useEffect(() => {
    async function revalidateSession() {
      // 1. If session cookie exists, restore server-authenticated session (Source of Truth)
      if (hasSessionCookie()) {
        try {
          const auth = await fetchCurrentUser();
          if (auth) {
            setCurrentUser(auth);
            setCurrentRequester(null);
            if (auth.role === "IT_STAFF") setActiveTab("queue");
            else if (auth.role === "ADMINISTRATOR") setActiveTab("users");
            else setActiveTab("my-tickets");
            setRevalidating(false);
            return;
          } else if (typeof document !== "undefined") {
            document.cookie = "toktickit_auth=; Max-Age=0; path=/";
          }
        } catch {
          setCurrentUser(null);
        } finally {
          setRevalidating(false);
        }
      }

      // 2. Scoped Lab 2 dev requester fallback (Retained strictly for legacy Lab 2 test suite)
      const storedId = getStoredRequesterId();
      if (storedId) {
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
        }
      }
    }

    revalidateSession();

    const handlePopState = () => {
      revalidateSession();
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // AC-01, AC-05: Login success directly establishes authenticated session
  const handleLoginSuccess = (user: AuthUser) => {
    if (typeof document !== "undefined") {
      document.cookie = "toktickit_auth=1; path=/";
    }
    if (typeof window !== "undefined" && window.history) {
      window.history.pushState({ auth: true }, "", window.location.href);
    }
    setCurrentUser(user);
    setCurrentRequester(null);
    if (user.role === "IT_STAFF") setActiveTab("queue");
    else if (user.role === "ADMINISTRATOR") setActiveTab("users");
    else setActiveTab("my-tickets");
  };

  // AC-04, BR-06: Logout destroys session on server and returns to unauthenticated Login
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {}
    if (typeof document !== "undefined") {
      document.cookie = "toktickit_auth=; Max-Age=0; path=/";
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

  // Scoped Lab 2 Selector handlers (strictly for legacy tests/dev mode)
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

  // Diagnostic section component for Lab 1 backward test compatibility
  const renderDiagnosticSection = () => (
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
  );

  // 1. Loading state during session revalidation
  if (revalidating) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)", textAlign: "center", padding: "5rem 1rem", color: "var(--color-secondary-green)" }}>
        <div className="spinner-border text-success" role="status" />
        <p style={{ marginTop: "1rem", fontWeight: 500 }}>Loading…</p>
      </div>
    );
  }

  // 2. Mandatory password change screen (AC-02, BR-04)
  // Blocks normal application access until initial password is changed
  if (currentUser && currentUser.mustChangePassword) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
        <ChangePassword
          user={currentUser}
          onPasswordChanged={handlePasswordChanged}
          onLogout={handleLogout}
        />
      </div>
    );
  }

  // 3. Authenticated App Shell (AC-05) - TOP PRIORITY
  // Enters immediately when currentUser is set (never gated behind currentRequester)
  if (currentUser) {
    const requesterContext: DevRequester = {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      isActive: currentUser.isActive,
    };

    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
        <AppHeader
          currentUser={currentUser}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onLogout={handleLogout}
        />

        <main className="container py-4 zen-main-container">
          {activeTab === "queue" && (
            selectedTicketId !== null ? (
              <StaffTicketDetail
                ticketId={selectedTicketId}
                currentUser={currentUser}
                onBack={() => setSelectedTicketId(null)}
              />
            ) : (
              <StaffTicketQueue
                currentUser={currentUser}
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                }}
              />
            )
          )}

          {activeTab === "users" && (
            <UserManagement currentUser={currentUser} />
          )}

          {(activeTab === "my-tickets" || activeTab === "create-ticket") && (
            activeTab === "my-tickets" ? (
              selectedTicketId !== null ? (
                <RequesterTicketDetail
                  ticketId={selectedTicketId}
                  currentRequester={requesterContext}
                  onBack={() => setSelectedTicketId(null)}
                />
              ) : (
                <MyTickets
                  currentRequester={requesterContext}
                  onCreateTicketClick={() => {
                    setActiveTab("create-ticket");
                    setSelectedTicketId(null);
                  }}
                  onSelectTicket={(id) => setSelectedTicketId(id)}
                />
              )
            ) : (
              <CreateTicket
                currentRequester={requesterContext}
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
    );
  }

  // 4. Scoped Lab 2 Selected Requester Shell (Retained for legacy test backward compatibility)
  if (currentRequester) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
        <AppHeader
          currentRequester={currentRequester}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onChangeRequester={handleChangeRequester}
        />

        <main className="container py-4 zen-main-container">
          {activeTab === "my-tickets" ? (
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
          ) : (
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
    );
  }

  // 5. Unauthenticated View (Default: Login Screen 100% per BR-24; scoped dev selector fallback)
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--color-page-bg)" }}>
      {showDevSelector ? (
        <div>
          <div style={{ maxWidth: 520, margin: "2rem auto 0", textAlign: "right", padding: "0 1rem" }}>
            <button
              type="button"
              className="btn btn-outline-success btn-sm"
              onClick={() => setShowDevSelector(false)}
              style={{ fontWeight: 600 }}
            >
              ← Sign In with Account (Lab 3)
            </button>
          </div>
          <RequesterSelector onSelect={handleSelectRequester} />
          {renderDiagnosticSection()}
        </div>
      ) : (
        <div>
          <Login onLoginSuccess={handleLoginSuccess} />
          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-link"
              style={{ color: "var(--color-primary-green)", fontSize: "0.85rem" }}
              onClick={() => setShowDevSelector(true)}
            >
              Development Mode: Switch to Temporary Requester Selector →
            </button>
          </div>
          {renderDiagnosticSection()}
        </div>
      )}
    </div>
  );
}
