# TokTickIT — Enterprise IT Service Desk & Support Ticketing System

TokTickIT is an enterprise full-stack web application designed for IT service desk ticketing, built with a secure multi-role architecture, strict role-based access control (RBAC), operational workflow state machines, and comprehensive automated test coverage.

---

## 🚀 Key Features

* **Secure Authentication & Session Lifecycle:** Email and password authentication with bcrypt hashing, cryptographic HttpOnly signed session cookies, mandatory first-login password change with real-time complexity validation (>= 8 chars, uppercase, lowercase, digit, match), generic 401 error banners, and browser back-navigation prevention on logout.
* **Role-Based Access Control (RBAC) & Ownership Isolation:** Strict server-enforced boundaries across 3 distinct roles: `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`. Requester identity is securely derived from active sessions, cross-requester access returns `404 Not Found`, and unauthorized route/internal-note access returns `403 Forbidden`.
* **Requester Experience:** Complete ticket lifecycle with client-side validation, atomic numbering (`TKT-YYYY-XXXXXX`), idempotency caching, multi-file attachment management (up to 5 MB with soft-removal audits), search/filter dashboard, "Problem Appears Resolved" indication, and public communication threads.
* **IT Staff Operations & Queue:** Operational queue with substring search, multi-field filtering (category, status, IT priority, primary owner: unassigned/me/specific), sorting whitelist, pagination, and responsive dual layouts (desktop table >= 768px, mobile cards < 768px). Includes ticket claiming/reassignment, operational priority overrides, context-sensitive status transitions governed by a Finite State Machine, public comments, and private internal notes with Amber Warning styling.
* **Administrator User Governance:** User management directory with search and role filtering, modal user creation with duplicate email rejection (`409 Conflict`), account activation/deactivation toggle, password reset modal, and critical security guards: Admin Self-Deactivation Guard and Last Active Admin Lockout Guard.

* **Actions Taken by IT Staff (Parent-Child Work Logging):** Detailed operational work log under each ticket with automatic performer attribution from active session (`performedBy` read-only), description and result validation, conditional follow-up note enforcement when follow-up is required, attachment reference notes, and optimistic concurrency control (`409 Conflict`).
* **Ticket Resolution Workflow & Resolution Gate:** Strict server-enforced resolution gate blocking ticket transition to `RESOLVED` if zero Actions Taken have been logged (`400 Bad Request / RESOLUTION_GATE_FAILED`). Requester "Problem Appears Resolved" indicator is advisory only and does not bypass formal IT Staff verification.
* **Role-Appropriate Operational Dashboards:** Authoritative backend-computed metrics: IT Staff Dashboard (Unassigned queue count, My Assigned tickets, High Priority active, My Actions logged, status/priority distributions, and interactive drill-downs) and Requester Dashboard (Open tickets, Action Needed banner for `WAITING_FOR_REQUESTER`, recently updated, recently resolved, zero-leakage data isolation, and drill-downs to My Tickets).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Bootstrap 5, Zen Green Design System |
| **Backend** | Node.js, Express, TypeScript, Multer, bcrypt |
| **Database & ORM** | PostgreSQL, Prisma ORM |
| **Testing** | Vitest, React Testing Library, Supertest, Playwright |

---

## 📋 Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/) (v9 or higher)
* [PostgreSQL](https://www.postgresql.org/) database server running locally or via Docker

---

## ⚙️ Environment Configuration

1. **Frontend Environment (`client/.env`):**
   ```bash
   cp client/.env.example client/.env
   ```
   * `VITE_API_URL`: Base URL of the backend API (default: `http://localhost:3000`)

2. **Backend Environment (`server/.env`):**
   ```bash
   cp server/.env.example server/.env
   ```
   * `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public`)
   * `PORT`: Express server port (default: `3000`)
   * `SESSION_SECRET`: Cryptographic secret for signing session cookies

---

## 🏁 Getting Started

### 1. Install Dependencies

Install packages across root and all workspaces:

```bash
npm install
cd client && npm install
cd ../server && npm install
```

### 2. Database Migration & Seed

Run Prisma migrations and idempotent seed populating tickets with 0, 1, and 3+ Actions Taken across all roles:

```bash
# Run from repository root:
npm run db:migrate
npm run db:seed
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend API (http://localhost:3000):
npm run dev:server

# Terminal 2 — Frontend Client (http://localhost:5173):
npm run dev:client
```

---

## 🧪 Automated Testing (100% Passing — 377 / 377 Tests)

All automated test suites can be executed directly from the repository root:

* **Grand Total Regression Suite (377 tests passed, 0 failures):**
  ```bash
  npm run test:all
  ```

* **Server API, Security & Workflow Suite (223 tests passed across 20 files):**
  ```bash
  npm run test:server
  ```

* **Client Component, UI Style & Responsive Suite (116 tests passed across 19 files):**
  ```bash
  npm run test:client
  ```

* **Playwright Browser End-to-End Suite (38 tests passed across 8 files):**
  ```bash
  npm run test:e2e
  ```

* **Automated Visual QA Screenshot Suite (32 figures across viewports):**
  ```bash
  node scripts/capture-lab4-screenshots.mjs
  ```

---

## 📁 Repository Structure

```text
toktickit/
├── artifacts/
│   ├── lab-02/screenshots/     # Lab 2 visual evidence
│   ├── lab-03/screenshots/     # Lab 3 visual evidence
│   └── lab-04/screenshots/     # Lab 4 visual QA screenshots (32 figures: Staff Dashboard, Actions Taken, Requester Dashboard, Responsive)
├── client/                      # React + TypeScript frontend application
│   ├── src/
│   │   ├── components/          # ActionsTaken, StaffDashboard, RequesterDashboard, StaffTicketDetail, MyTickets, etc.
│   │   ├── styles/              # Zen Green design system tokens & responsive CSS
│   │   ├── api.ts               # API client and TypeScript contract interfaces
│   │   └── App.tsx              # Main application shell & role-based routing
│   └── tests/                   # Client component & unit test suites (116 tests passed)
│       └── lab-04/              # ActionsTaken.test.tsx, StaffDashboard.test.tsx, RequesterDashboard.test.tsx, TicketWorkflow.test.tsx, ResponsiveVisualQA.test.tsx
├── docs/
│   └── lab-04/                  # Specifications, test plan, reviewer records & AI usage logs
│       ├── specification.md     # Functional requirements, business rules & acceptance criteria
│       ├── api-spec.md          # REST API contracts & error catalog
│       ├── ui-spec.md           # Zen Green UI specification & responsive checklist
│       ├── tests.md             # Test plan & 100% traceability matrix (all PASS)
│       ├── reviewer.md          # Verbatim peer review records & verification log
│       └── ai-use.md            # AI prompts & reflections
├── e2e/
│   └── lab-04/                  # Playwright browser end-to-end test suites (10 tests passed)
│       ├── actions-taken-flow.spec.ts   # Actions Taken lifecycle, validation & RBAC boundary
│       ├── ticket-resolution.spec.ts    # Resolution Gate enforcement & advisory flag
│       └── dashboards.spec.ts           # Role dashboards, metrics, drill-down & responsive audits
├── server/                      # Express + TypeScript backend application
│   ├── prisma/                  # Database schema, non-destructive migrations & idempotent seed
│   ├── src/                     # Controllers, routes, RBAC middleware, state machine
│   └── tests/                   # Server API, security & integration test suites (223 tests passed)
│       └── lab-04/              # actions-taken.api.test.ts, ticket-workflow.api.test.ts, staff-dashboard.api.test.ts, requester-dashboard.api.test.ts, migration-seed.test.ts
├── package.json                 # Root npm scripts & workspace configuration
├── playwright.config.ts         # Playwright multi-browser/viewport configuration
├── PROJECT_STRUCTURE.md         # Comprehensive architectural file guide
└── README.md                    # Project overview & operational documentation
```
