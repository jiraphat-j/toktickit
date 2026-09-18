# TokTickIT — IT Service Desk & Support Ticketing System

TokTickIT is an enterprise full-stack web application designed for IT service desk ticketing, built for **CPE 334 (Software Engineering)** Labs 1, 2, and 3.

---

## 🚀 Key Features (Lab 3 Enterprise Identity & Governance)

* **Secure Authentication & Password Lifecycle:** Real user authentication with email and password, HttpOnly signed session cookies, mandatory first-login password change with real-time complexity validation (≥8 chars, uppercase, lowercase, digit, match), generic 401 error banners, and secure logout with browser back-navigation prevention (AC-01..05, UI-01, UI-02).
* **Role-Based Access Control (RBAC) & Ownership Isolation:** Server-enforced role boundaries across 3 distinct roles: `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`. Requester identity is strictly derived from the session (retiring client-supplied IDs), cross-requester ticket access returns `404 Not Found`, and unauthorized routes/notes return `403 Forbidden` (SEC-01..04, AC-05, AC-07, AC-11, AC-21).
* **IT Staff Ticket Queue:** Operational queue with substring search (ticket number, summary), multi-field filtering (category, status, IT priority, primary owner: unassigned/me/specific), sorting whitelist, pagination, and responsive layouts (desktop table $\ge 768\text{px}$, mobile touch cards $< 768\text{px}$) (AC-12, AC-22, UI-03).
* **IT Staff Ticket Operations & Communication Workflow:** Ticket detail view featuring an operational bar to claim or reassign primary ownership, update operational IT Priority independently of requested priority, context-sensitive status transitions governed by a strict Finite State Machine, chronological Public Comments (Zen Green), and private Internal Notes with distinct Amber Warning styling (AC-09, AC-10, AC-13..15, UI-04).
* **Administrator User Management & Security Safeguards:** Dedicated administration directory with user search and role filtering, modal account creation with initial passwords and duplicate email rejection (409 Conflict), account editing and activation/deactivation toggle, password reset modal, and critical safeguards: Admin Self-Deactivation Guard (SEC-05) and Last Active Admin Lockout Guard (SEC-06) (AC-16..20, UI-05).
* **Requester Continuity & Problem Appears Resolved:** Requester portal preserves all Lab 2 capabilities (Ticket Creation, Attachments, Idempotency), while allowing requesters to indicate that their problem appears resolved without modifying formal ticket status, and participate in Public Comments (AC-06..09).

---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Bootstrap 5, Custom Zen Green CSS System
* **Backend:** Node.js, Express, TypeScript, Multer, bcrypt
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:**
  * **Unit & Component Tests:** Vitest, React Testing Library (`@testing-library/react`)
  * **API & Integration Tests:** Supertest, Vitest
  * **End-to-End Tests:** Playwright (`@playwright/test`) with Chromium across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports

---

## 📋 Prerequisites

Before running the application, ensure you have the following installed:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [npm](https://www.npmjs.com/) (included with Node.js)
* [PostgreSQL](https://www.postgresql.org/) database server running locally or via Docker

---

## ⚙️ Environment Configuration

1. **Frontend Environment:**
   Copy `client/.env.example` to `client/.env`:
   ```bash
   cp client/.env.example client/.env
   ```
   * `VITE_API_URL`: Base URL of the backend API (default: `http://localhost:3000`)

2. **Backend Environment:**
   Copy `server/.env.example` to `server/.env`:
   ```bash
   cp server/.env.example server/.env
   ```
   * `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public`)
   * `PORT`: Express server port (default: `3000`)
   * `SESSION_SECRET`: Cryptographic secret for signing session cookies

---

## 🏁 Getting Started

### 1. Install Dependencies

Install packages across the root, client, and server workspaces:

```bash
# Root and Playwright dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd ../server && npm install
```

### 2. Database Migration & Seed

Run Prisma migrations and seed initial reference data and Lab 3 users across all 3 roles:

```bash
# From repository root:
npm run db:migrate
npm run db:seed
```

### 3. Run Development Servers

Run backend and frontend servers:

* **Backend Dev Server:**
  ```bash
  npm run dev:server
  ```
  *(Starts server at `http://localhost:3000` with `tsx watch`)*

* **Frontend Dev Server:**
  ```bash
  npm run dev:client
  ```
  *(Starts Vite dev server at `http://localhost:5173`)*

---

## 🧪 Running Automated Tests

All test suites can be executed directly from the repository root:

* **Run All Tests (Unit, Component, API, and E2E — 284 tests passed):**
  ```bash
  npm run test:all
  ```

* **Server API, Security & Integration Tests (173 tests passing):**
  ```bash
  npm run test:server
  ```

* **Client Component & Unit Tests (83 tests passing):**
  ```bash
  npm run test:client
  ```

* **Playwright End-to-End Tests (28 tests passing):**
  ```bash
  npm run test:e2e
  ```

* **Capture Visual QA Screenshots (24 figures across viewports):**
  ```bash
  npx playwright test e2e/lab-03/visual-qa-screenshots.spec.ts
  ```

---

## 📁 Repository Structure

```text
toktickit/
├── artifacts/
│   ├── lab-02/screenshots/     # Lab 2 visual QA screenshots
│   └── lab-03/screenshots/     # Lab 3 visual QA screenshots (01-auth, 02-requester, 03-staff, 04-admin, 05-responsive)
├── client/                      # React + Vite + TypeScript frontend
│   ├── src/components/          # Login, ChangePassword, StaffTicketQueue, StaffTicketDetail, UserManagement, AppHeader
│   ├── src/styles/              # Unified Zen Green design system (`zen-green.css`)
│   └── tests/                   # Component & unit test suites (83 tests passed)
├── docs/
│   ├── lab-01/                  # Lab 1 submission documentation
│   ├── lab-02/                  # Lab 2 specification & audit documentation
│   └── lab-03/                  # Lab 3 engineering contract & verification documentation
│       ├── specification.md     # FR-01..10, BR-01..26, AC-01..22, Definition of Done
│       ├── api-spec.md          # REST API contracts, auth & error catalog
│       ├── ui-spec.md           # Zen Green design guidelines & responsive checklist
│       ├── tests.md             # Test plan & 100% traceability matrix
│       ├── reviewer.md          # Verbatim GitHub PR peer review records
│       └── ai-use.md            # Prompts (1-11) and reflections (1-12)
├── e2e/
│   ├── lab-02/                  # Lab 2 regression E2E suite
│   └── lab-03/                  # Lab 3 E2E test suites (authentication, staff-ticket-flow, user-administration)
├── server/                      # Express + Prisma + TypeScript backend
│   ├── prisma/                  # Migrations (User model, schema) & idempotent seed script
│   ├── src/                     # Auth middleware, session store, bcrypt helpers, status state machine
│   └── tests/                   # Integration and API test suites (173 tests passed)
├── package.json                 # Root project configuration & test runner scripts
├── playwright.config.ts         # Playwright multi-server configuration
├── PROJECT_STRUCTURE.md         # Detailed file guide & responsibilities
└── README.md                    # Project overview & documentation
```