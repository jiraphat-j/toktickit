# TokTickIT — IT Service Desk & Support Ticketing System

TokTickIT is a full-stack web application designed for enterprise IT service desk ticketing, built for **CPE 334 (Software Engineering)** Lab 1 and Lab 2.

---

## 🚀 Key Features (Lab 2 Requester Experience)

* **Development Requester Testing Context:** Context switching across active requesters with persistent `sessionStorage` session and Zen Green app shell (AC-24, AC-31, AC-35).
* **Create Ticket Experience:** Comprehensive client-side form validation, atomic ticket numbering (`TKT-YYYY-XXXXXX`), idempotency caching, partial failure tolerance, and active attachment uploading up to 5 MB (AC-01..11, AC-34).
* **My Tickets Dashboard:** Real-time search, multi-field AND filtering, sortable column headers (`ticketNumber`, `createdAt`, `updatedAt`), stable pagination, and responsive dual layouts (table on desktop, interactive cards on mobile) (AC-16..20, AC-26, AC-28, AC-29).
* **Ticket Detail & Attachment Lifecycle:** Strict read-only detail view isolating IT staff controls, attachment downloads, and soft-removal confirmation modal requiring audit reasons (AC-12..15, AC-21, AC-22, AC-27, AC-32).

---

## 🛠️ Tech Stack

* **Frontend:** React 18, TypeScript, Vite, Bootstrap 5, Custom Zen Green CSS System
* **Backend:** Node.js, Express, TypeScript, Multer
* **Database & ORM:** PostgreSQL, Prisma ORM
* **Testing:**
  * **Unit & Component Tests:** Vitest, React Testing Library (`@testing-library/react`)
  * **API & Integration Tests:** Supertest, Vitest
  * **End-to-End Tests:** Playwright (`@playwright/test`) with Chromium across Desktop, Tablet, and Mobile viewports

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

Run Prisma migrations and seed initial reference data (Development Requesters, Categories, and Related Systems):

```bash
# From repository root:
npm run db:migrate
npm run db:seed
```

### 3. Run Development Servers

Run backend and frontend servers in separate terminals (or concurrently):

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

* **Run All Tests (Unit, Component, API, and E2E):**
  ```bash
  npm run test:all
  ```

* **Server API & Integration Tests (43 tests passing):**
  ```bash
  npm run test:server
  ```

* **Client Component & Unit Tests (37 tests passing):**
  ```bash
  npm run test:client
  ```

* **Playwright End-to-End Tests (6 tests passing):**
  ```bash
  npm run test:e2e
  ```

* **Capture Visual QA Screenshots:**
  ```bash
  npx playwright test e2e/lab-02/visual-qa-screenshots.spec.ts
  ```

---

## 📁 Repository Structure

```text
toktickit/
├── artifacts/
│   └── lab-02/
│       └── screenshots/         # Automated responsive visual QA screenshots
│           ├── create-ticket/   # Form states (initial, validation, submitting, success, failure)
│           ├── my-tickets/      # Desktop table, mobile cards, empty, no-results
│           └── ticket-detail/   # Read-only detail and attachment lifecycle
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── components/          # Reusable Zen Green components
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AttachmentSection.tsx
│   │   │   ├── CreateTicket.tsx
│   │   │   ├── MyTickets.tsx
│   │   │   ├── RequesterSelector.tsx
│   │   │   └── RequesterTicketDetail.tsx
│   │   ├── styles/
│   │   │   └── zen-green.css    # Unified Zen Green design system tokens & media queries
│   │   ├── api.ts               # Frontend API client & contract types
│   │   └── App.tsx              # Main application container & view router
│   └── tests/                   # Component & unit test suites
├── docs/
│   └── lab-02/                  # Lab 2 specification & audit documentation
│       ├── ai-use.md            # LLM prompts, reflections, and governance record
│       ├── api-spec.md          # REST API contracts & error schemas
│       ├── reviewer.md          # Peer review logs, comments, approvals, and merge proofs
│       ├── specification.md     # Business rules (BR-01..34) & Acceptance Criteria (AC-01..36)
│       ├── tests.md             # Traceability matrix and test execution summary
│       └── ui-spec.md           # Zen Green design guidelines & visual checklist
├── e2e/
│   └── lab-02/                  # Playwright E2E test suites
│       ├── requester-ticket-flow.spec.ts  # E2E-01: complete user journey
│       ├── responsive-a11y.spec.ts        # E2E-02: desktop/tablet/mobile zero-overflow & a11y
│       └── visual-qa-screenshots.spec.ts  # Automated visual QA screenshot generator
├── server/                      # Express + TypeScript backend
│   ├── prisma/                  # Prisma schema, migrations & idempotent seed script
│   ├── src/
│   │   ├── app.ts               # Express application, routes & validation logic
│   │   ├── index.ts             # HTTP server entry point
│   │   └── prisma.ts            # Prisma client singleton
│   └── tests/                   # Integration and API test suites
├── package.json                 # Root project configuration & test runner scripts
├── playwright.config.ts         # Playwright multi-server configuration
├── PROJECT_STRUCTURE.md         # Detailed file guide & responsibilities
└── README.md                    # Project overview & documentation
```