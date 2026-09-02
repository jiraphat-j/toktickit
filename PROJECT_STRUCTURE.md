# TokTickIT — Project Structure & File Guide

เอกสารสรุปโครงสร้างโปรเจกต์ **TokTickIT** (ครอบคลุมทั้ง Lab 1 Starter Scaffold และ Lab 2 Requester Experience)

---

## 📁 Overview Structure

```text
toktickit/
├── .gitignore                   # Git exclusion rules
├── package.json                 # Root npm scripts & Playwright configuration
├── playwright.config.ts         # Playwright multi-server browser configuration
├── README.md                    # Setup, database, dev, and test execution guide
├── PROJECT_STRUCTURE.md         # File responsibility and architectural layout
├── artifacts/
│   └── lab-02/
│       └── screenshots/         # Automated visual QA responsive screenshot evidence
│           ├── create-ticket/   # Form states (initial, validation, submitting, success, failure)
│           ├── my-tickets/      # Desktop table, mobile cards, empty, no-results
│           └── ticket-detail/   # Read-only detail and attachment lifecycle
├── docs/
│   ├── lab-01/                  # Lab 1 submission documentation
│   └── lab-02/                  # Lab 2 specification, audit & verification docs
│       ├── ai-use.md            # LLM prompts, reflections, and governance record
│       ├── api-spec.md          # REST API contracts & error schemas
│       ├── reviewer.md          # Peer review logs, comments, approvals, and merge proofs
│       ├── specification.md     # Business rules (BR-01..34) & Acceptance Criteria (AC-01..36)
│       ├── tests.md             # Traceability matrix and test execution summary
│       └── ui-spec.md           # Zen Green design guidelines & visual checklist
├── e2e/
│   └── lab-02/                  # Playwright browser end-to-end test suites
│       ├── requester-ticket-flow.spec.ts  # E2E-01: complete user journey
│       ├── responsive-a11y.spec.ts        # E2E-02: desktop/tablet/mobile zero-overflow & a11y
│       └── visual-qa-screenshots.spec.ts  # Automated visual QA screenshot capture
├── scripts/
│   └── capture-screenshots.mjs  # Standalone Playwright screenshot capture script
├── client/                      # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/          # Reusable Zen Green UI components
│   │   │   ├── AppHeader.tsx              # Zen Green navigation header & requester badge
│   │   │   ├── AttachmentSection.tsx      # Active/removed attachments & soft-removal modal
│   │   │   ├── CreateTicket.tsx           # Form with client validation & attachment upload
│   │   │   ├── MyTickets.tsx              # Search, filter, sort, pagination, table/cards
│   │   │   ├── RequesterSelector.tsx      # Testing selector & sessionStorage persistence
│   │   │   └── RequesterTicketDetail.tsx  # Read-only ticket detail screen (no staff controls)
│   │   ├── styles/
│   │   │   └── zen-green.css    # Unified Zen Green design system tokens & media queries
│   │   ├── api.ts               # Frontend API client & contract types
│   │   └── App.tsx              # Main application container & view router
│   └── tests/                   # Component & unit test suites (Vitest + Testing Library)
│       ├── lab-01/
│       │   └── App.test.tsx
│       └── lab-02/
│           ├── AttachmentSection.test.tsx
│           ├── CreateTicket.test.tsx
│           ├── MyTickets.test.tsx
│           ├── RequesterSelector.test.tsx
│           └── RequesterTicketDetail.test.tsx
└── server/                      # Express + Prisma + TypeScript Backend
    ├── prisma/
    │   ├── migrations/          # Version-controlled database schema migrations
    │   ├── schema.prisma        # Data models (DevRequester, Category, RelatedSystem, Ticket, Attachment)
    │   └── seed.ts              # Idempotent reference data seeding script
    ├── src/
    │   ├── app.ts               # Express application, routes, middleware & validation logic
    │   ├── index.ts             # HTTP server entry point
    │   └── prisma.ts            # Prisma client singleton
    └── tests/                   # Integration & API test suites (Vitest + Supertest)
        ├── lab-01/
        │   ├── categories.test.ts
        │   └── health.test.ts
        └── lab-02/
            ├── attachments.api.test.ts
            ├── create-ticket.api.test.ts
            ├── dev-requesters.api.test.ts
            ├── my-tickets.api.test.ts
            ├── reference-data.api.test.ts
            └── ticket-detail.api.test.ts
```

---

## 📄 File Details & Responsibilities

### 1. Root Configuration & Tooling
* [`.gitignore`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/.gitignore) — กำหนดไฟล์ที่ไม่ติดตามใน Git (เช่น `node_modules/`, `.env`, `server/prisma/*.db`, `uploads/`)
* [`package.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/package.json) — รวมคำสั่งรันระบบและทดสอบระดับ Root (`npm test`, `npm run test:e2e`, `npm run test:all`, `npm run db:migrate`, `npm run db:seed`)
* [`playwright.config.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/playwright.config.ts) — กำหนดค่ารัน Playwright โดยเปิด Backend (port 3000) และ Client (port 5173) อัตโนมัติ
* [`README.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/README.md) — คู่มือการติดตั้ง, รันโปรเจกต์, และการรันชุดการทดสอบทั้งหมด
* [`PROJECT_STRUCTURE.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/PROJECT_STRUCTURE.md) — เอกสารอธิบายโครงสร้างและหน้าที่ของแต่ละไฟล์

### 2. End-to-End Automation & Visual QA (`e2e/lab-02/`, `artifacts/`)
* [`e2e/lab-02/requester-ticket-flow.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-02/requester-ticket-flow.spec.ts) — การทดสอบ `E2E-01` ครอบคลุม User Journey ทั้งหมด (เลือก Requester ➔ สร้างตั๋วพร้อมไฟล์แนบ ➔ ตรวจสอบใน My Tickets ➔ เปิดดู Ticket Detail ➔ ตรวจสอบโควตาและดาวน์โหลด ➔ Soft-remove พร้อมบันทึกเหตุผล)
* [`e2e/lab-02/responsive-a11y.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-02/responsive-a11y.spec.ts) — การทดสอบ `E2E-02` ตรวจสอบความถูกต้องของ Responsive Layout (Desktop 1280px, Tablet 768px, Mobile 375px) ให้ไม่มี Horizontal Overflow (`scrollWidth <= window.innerWidth`) และทดสอบการนำทางด้วยคีย์บอร์ด (`:focus-visible`)
* [`e2e/lab-02/visual-qa-screenshots.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-02/visual-qa-screenshots.spec.ts) — การบันทึกภาพหน้าจอ Visual QA 11 ภาพลงในโฟลเดอร์ `artifacts/lab-02/screenshots/` อัตโนมัติ

### 3. Lab 2 Documentation (`docs/lab-02/`)
* [`docs/lab-02/specification.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/specification.md) — ข้อกำหนดความต้องการ (Functional Requirements), Business Rules (BR-01..34), และ Acceptance Criteria (AC-01..36)
* [`docs/lab-02/api-spec.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/api-spec.md) — สัญญาระบบ REST API, Request/Response payload, และ Error Catalog
* [`docs/lab-02/ui-spec.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/ui-spec.md) — ข้อกำหนดการออกแบบ Zen Green Design System, Mobile Breakpoints, Accessibility, และ Visual Checklist
* [`docs/lab-02/tests.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/tests.md) — Test Plan, Traceability Matrix (AC-01..36) และบันทึกผลการทดสอบจริง (86/86 passed)
* [`docs/lab-02/reviewer.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/reviewer.md) — บันทึก Peer Review ทั้งหมด (PR ของเราและของเพื่อนร่วมงาน)
* [`docs/lab-02/ai-use.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-02/ai-use.md) — บันทึกประวัติ Prompts, การควบคุมคุณภาพ, และบทสะท้อนความคิดเชิงวิศวกรรม
