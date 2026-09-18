# TokTickIT — Enterprise IT Service Desk & Support Ticketing System

TokTickIT is an enterprise full-stack web application designed for IT service desk ticketing, built with a secure multi-role architecture, strict role-based access control (RBAC), operational workflow state machines, and comprehensive automated test coverage.

---

## 🚀 Key Features

* **Secure Authentication & Session Lifecycle:** Email and password authentication with bcrypt hashing, cryptographic HttpOnly signed session cookies, mandatory first-login password change with real-time complexity validation (>= 8 chars, uppercase, lowercase, digit, match), generic 401 error banners, and browser back-navigation prevention on logout.
* **Role-Based Access Control (RBAC) & Ownership Isolation:** Strict server-enforced boundaries across 3 distinct roles: `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`. Requester identity is securely derived from active sessions, cross-requester access returns `404 Not Found`, and unauthorized route/internal-note access returns `403 Forbidden`.
* **Requester Experience:** Complete ticket lifecycle with client-side validation, atomic numbering (`TKT-YYYY-XXXXXX`), idempotency caching, multi-file attachment management (up to 5 MB with soft-removal audits), search/filter dashboard, "Problem Appears Resolved" indication, and public communication threads.
* **IT Staff Operations & Queue:** Operational queue with substring search, multi-field filtering (category, status, IT priority, primary owner: unassigned/me/specific), sorting whitelist, pagination, and responsive dual layouts (desktop table >= 768px, mobile cards < 768px). Includes ticket claiming/reassignment, operational priority overrides, context-sensitive status transitions governed by a Finite State Machine, public comments, and private internal notes with Amber Warning styling.
* **Administrator User Governance:** User management directory with search and role filtering, modal user creation with duplicate email rejection (`409 Conflict`), account activation/deactivation toggle, password reset modal, and critical security guards: Admin Self-Deactivation Guard and Last Active Admin Lockout Guard.

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

Run Prisma migrations and seed reference data and initial users across all roles:

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

## 🧪 Automated Testing (100% Passing — 284/284 Tests)

All automated test suites can be executed directly from the repository root:

* **Full Regression Test Suite (284 tests passed):**
  ```bash
  npm run test:all
  ```

* **Server API, Security & Integration Suite (173 tests passed):**
  ```bash
  npm run test:server
  ```

* **Client Component & Unit Suite (83 tests passed):**
  ```bash
  npm run test:client
  ```

* **Playwright Browser End-to-End Suite (28 tests passed):**
  ```bash
  npm run test:e2e
  ```

* **Automated Visual QA Screenshot Suite (24 figures across viewports):**
  ```bash
  npx playwright test e2e/lab-03/visual-qa-screenshots.spec.ts
  ```

---

## 📁 Repository Structure

```text
toktickit/
├── artifacts/
│   └── lab-03/screenshots/     # Automated responsive visual QA screenshots (24 figures)
├── client/                      # React + TypeScript frontend application
│   ├── src/
│   │   ├── components/          # UI components (Login, StaffTicketQueue, StaffTicketDetail, UserManagement, etc.)
│   │   ├── styles/              # Zen Green design system tokens & responsive CSS
│   │   ├── api.ts               # API client and TypeScript contract interfaces
│   │   └── App.tsx              # Main application shell & role-based routing
│   └── tests/                   # Client component & unit test suites (83 tests passed)
├── docs/
│   └── lab-03/                  # Specifications, test plan, reviewer records & AI usage logs
│       ├── specification.md     # Functional requirements, business rules & acceptance criteria
│       ├── api-spec.md          # REST API contracts & error catalog
│       ├── ui-spec.md           # Zen Green UI specification & responsive checklist
│       ├── tests.md             # Test plan & 100% traceability matrix
│       ├── reviewer.md          # Peer review records & verification log
│       └── ai-use.md            # AI prompts & reflections
├── e2e/
│   └── lab-03/                  # Playwright browser end-to-end test suites (28 tests passed)
│       ├── authentication.spec.ts         # Authentication, session lifecycle & back-nav guard
│       ├── staff-ticket-flow.spec.ts      # Queue, claim, priority, status workflow & notes
│       ├── user-administration.spec.ts    # Admin CRUD, duplicate email & security safeguards
│       └── visual-qa-screenshots.spec.ts  # Multi-viewport responsive screenshot capture
├── server/                      # Express + TypeScript backend application
│   ├── prisma/                  # Database schema, migrations & seed scripts
│   ├── src/                     # Controllers, routes, RBAC middleware, state machine
│   └── tests/                   # Server API, security & integration test suites (173 tests passed)
├── package.json                 # Root npm scripts & workspace configuration
├── playwright.config.ts         # Playwright multi-browser/viewport configuration
├── PROJECT_STRUCTURE.md         # Comprehensive architectural file guide
└── README.md                    # Project overview & operational documentation
```
