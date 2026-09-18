# TokTickIT — Project Structure & File Guide

เอกสารสรุปโครงสร้างโปรเจกต์ **TokTickIT** (ครอบคลุมทั้ง Lab 1 Starter Scaffold, Lab 2 Requester Experience, และ Lab 3 Enterprise Identity, RBAC, IT Staff Ticketing, และ Administrator User Management)

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
│   ├── lab-02/
│   │   └── screenshots/         # Lab 2 visual QA screenshot evidence
│   └── lab-03/
│       └── screenshots/         # Lab 3 visual QA responsive screenshot evidence (24 figures)
│           ├── 01-auth/         # Login, invalid credentials, mandatory password change, logout
│           ├── 02-requester/    # Requester portal, ownership isolation, problem resolved indication
│           ├── 03-staff/        # IT Staff queue, search/filters, claiming, priority, status workflow
│           ├── 04-admin/        # User directory, create/edit, deactivation lock, password reset
│           └── 05-responsive/   # Desktop (1280px), Tablet (768px), Mobile (375px) zero-overflow
├── docs/
│   ├── lab-01/                  # Lab 1 submission documentation
│   ├── lab-02/                  # Lab 2 specification, audit & verification docs
│   └── lab-03/                  # Lab 3 engineering contract & verification docs
│       ├── ai-use.md            # LLM prompts (1-11), reflections (1-12), and governance record
│       ├── api-spec.md          # REST API contracts, authentication, schemas & error catalog
│       ├── reviewer.md          # Peer review logs, verbatim GitHub PR review comments, and merge hashes
│       ├── specification.md     # Business rules (BR-01..26) & Acceptance Criteria (AC-01..22)
│       ├── tests.md             # Test DD plan, traceability matrix, and execution summary (284 tests)
│       └── ui-spec.md           # Zen Green design guidelines, responsive rules & visual checklist
├── e2e/
│   ├── lab-02/                  # Lab 2 Playwright E2E regression tests
│   │   ├── requester-ticket-flow.spec.ts  # Legacy requester flow (runs under #dev scoped mode)
│   │   ├── responsive-a11y.spec.ts        # Zero-overflow & keyboard navigation
│   │   └── visual-qa-screenshots.spec.ts  # Lab 2 screenshot capture
│   └── lab-03/                  # Lab 3 Playwright browser end-to-end test suites
│       ├── authentication.spec.ts         # E2E-01 / E2E-01b: 3 roles login, password change, back-nav block
│       ├── staff-ticket-flow.spec.ts      # E2E-02: queue, search/filters, claim, IT priority, status, notes
│       ├── user-administration.spec.ts    # E2E-03: admin CRUD, duplicate email, self-deactivation guard, RBAC
│       └── visual-qa-screenshots.spec.ts  # Automated visual QA capture for 24 submission figures
├── scripts/
│   └── capture-lab3-screenshots.mjs       # Standalone Playwright script for capturing all 24 screenshots
├── client/                      # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/          # Reusable Zen Green UI components
│   │   │   ├── AppHeader.tsx              # Role navigation (Requester/Staff/Admin), user badge, logout
│   │   │   ├── AttachmentSection.tsx      # Active/removed attachments & soft-removal modal
│   │   │   ├── ChangePassword.tsx         # Mandatory first-login password change with real-time checklist
│   │   │   ├── CreateTicket.tsx           # Ticket creation form with client-side validation
│   │   │   ├── Login.tsx                  # Email/password authentication, busy state & safe error banner
│   │   │   ├── MyTickets.tsx              # Requester tickets list, search, filter, sort, pagination
│   │   │   ├── RequesterSelector.tsx      # Legacy dev selector (scoped for Lab 2 test compatibility)
│   │   │   ├── RequesterTicketDetail.tsx  # Requester ticket detail, resolved indication & public comments
│   │   │   ├── StaffTicketDetail.tsx      # Operational bar, claim, IT priority, status matrix, dual threads
│   │   │   ├── StaffTicketQueue.tsx       # IT Staff queue table/mobile cards, multi-filters, sorting whitelist
│   │   │   └── UserManagement.tsx         # Administrator user directory, modals, password reset, guards
│   │   ├── styles/
│   │   │   └── zen-green.css    # Unified Zen Green design system tokens & media queries
│   │   ├── api.ts               # Frontend API client, contract types & credentials: "include"
│   │   └── App.tsx              # Main application container, view router, session revalidation & popstate guard
│   └── tests/                   # Component & unit test suites (Vitest + Testing Library)
│       ├── lab-01/
│       │   └── App.test.tsx
│       ├── lab-02/
│       │   ├── AttachmentSection.test.tsx
│       │   ├── CreateTicket.test.tsx
│       │   ├── MyTickets.test.tsx
│       │   ├── RequesterSelector.test.tsx
│       │   └── RequesterTicketDetail.test.tsx
│       └── lab-03/
│           ├── App.auth.test.tsx
│           ├── AppHeader.test.tsx
│           ├── ChangePassword.test.tsx
│           ├── Login.test.tsx
│           ├── RequesterTicketDetail.resolved.test.tsx
│           ├── StaffTicketDetail.test.tsx
│           ├── StaffTicketQueue.test.tsx
│           └── UserManagement.test.tsx
└── server/                      # Express + Prisma + TypeScript Backend
    ├── prisma/
    │   ├── migrations/          # Version-controlled database schema migrations
    │   │   ├── 20260905080000_init/                    # Lab 1 initial migration
    │   │   ├── 20260909034237_add_lab2_models/         # Lab 2 ticketing models
    │   │   └── 20260912082904_add_user_model_and_lab3_schema/ # Lab 3 User model, Role enum, comments/notes
    │   ├── schema.prisma        # Data models (User, DevRequester, Category, RelatedSystem, Ticket, Attachment, Comment, InternalNote)
    │   └── seed.ts              # Idempotent seed script (4 requesters, 3 staff, 1 admin, tickets, comments)
    ├── src/
    │   ├── app.ts               # Express application, routes, middleware & validation logic
    │   ├── auth.ts              # Centralized RBAC middleware (`requireAuth`, `requireRole`, `authenticateSessionOrDev`)
    │   ├── index.ts             # HTTP server entry point
    │   ├── password.ts          # Password hashing (bcrypt) and complexity validation
    │   ├── prisma.ts            # Prisma client singleton
    │   ├── session.ts           # Session store, HttpOnly cookie signing & token expiration
    │   └── status-transition.ts # Ticket status transition state machine matrix validator
    └── tests/                   # Integration & API test suites (Vitest + Supertest)
        ├── lab-01/
        │   ├── categories.test.ts
        │   └── health.test.ts
        ├── lab-02/
        │   ├── attachments.api.test.ts
        │   ├── create-ticket.api.test.ts
        │   ├── dev-requesters.api.test.ts
        │   ├── my-tickets.api.test.ts
        │   ├── reference-data.api.test.ts
        │   └── ticket-detail.api.test.ts
        └── lab-03/
            ├── auth.api.test.ts
            ├── authorization.api.test.ts
            ├── comments-notes.api.test.ts
            ├── migration-seed.test.ts
            ├── staff-queue.api.test.ts
            ├── staff-ticket-detail.api.test.ts
            └── users-admin.api.test.ts
```

---

## 📄 File Details & Responsibilities

### 1. Root Configuration & Tooling
* [`.gitignore`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/.gitignore) — กำหนดไฟล์ที่ไม่ติดตามใน Git (เช่น `node_modules/`, `.env`, `server/prisma/*.db`, `uploads/`)
* [`package.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/package.json) — รวมคำสั่งรันระบบและทดสอบระดับ Root (`npm test`, `npm run test:e2e`, `npm run test:all`, `npm run db:migrate`, `npm run db:seed`)
* [`playwright.config.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/playwright.config.ts) — กำหนดค่ารัน Playwright โดยเปิด Backend (port 3000) และ Client (port 5173) อัตโนมัติ
* [`README.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/README.md) — คู่มือการติดตั้ง, รันโปรเจกต์, และการรันชุดการทดสอบทั้งหมดของ Lab 1, 2, 3
* [`PROJECT_STRUCTURE.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/PROJECT_STRUCTURE.md) — เอกสารอธิบายโครงสร้างและหน้าที่ของแต่ละไฟล์ในโปรเจกต์

### 2. Lab 3 Documentation (`docs/lab-03/`)
* [`docs/lab-03/specification.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/specification.md) — สัญญาข้อกำหนดความต้องการทางวิศวกรรม (Engineering Contract): Functional Requirements (FR-01..10), Business Rules (BR-01..26), Acceptance Criteria (AC-01..22), Role Permissions Matrix, และ Product Definition of Done
* [`docs/lab-03/api-spec.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/api-spec.md) — สัญญาระบบ REST API ครบทุก endpoints: Authentication (`/api/auth/*`), Requester, IT Staff (`/api/staff/*`), Communication (`/comments`, `/internal-notes`), Administrator (`/api/admin/users/*`), Request/Response schemas, และ Error Catalog
* [`docs/lab-03/ui-spec.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/ui-spec.md) — ข้อกำหนดการออกแบบ Zen Green Design System, สีและการจัดวางสำหรับแต่ละ Role, Amber Warning styling สำหรับ Internal Notes, Breakpoints (Desktop/Tablet/Mobile), และ Visual Checklist
* [`docs/lab-03/tests.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/tests.md) — Test-Driven Development Plan, Acceptance Criteria Traceability Matrix (AC-01..22), และผลการรันชุดการทดสอบจริง (284/284 tests passed 100%)
* [`docs/lab-03/reviewer.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/reviewer.md) — บันทึก Peer Review ทั้งหมด ดึงข้อความจริงแบบ Verbatim 100% จาก GitHub PRs ทั้งฝั่งเรา (PR #43 ถึง #53) และฝั่งคู่ตรวจ (@thanapornboont-star PR #50 ถึง #58)
* [`docs/lab-03/ai-use.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-03/ai-use.md) — บันทึกประวัติ Prompts (1-11), การกำกับดูแล AI, และบทสะท้อนความคิดเชิงวิศวกรรม (Reflections 1-12)

### 3. End-to-End Automation & Visual QA (`e2e/lab-03/`, `artifacts/lab-03/`)
* [`e2e/lab-03/authentication.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-03/authentication.spec.ts) — การทดสอบ `E2E-01` และ `E2E-01b` ครอบคลุมการเข้าสู่ระบบของทั้ง 3 บทบาท, การปฏิเสธบัญชีผิด/ถูกปิด, การบังคับเปลี่ยนรหัสผ่านครั้งแรก, การนำทาง shell ตามบทบาท, การออกจากระบบ และการดักจับ Browser Back Navigation
* [`e2e/lab-03/staff-ticket-flow.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-03/staff-ticket-flow.spec.ts) — การทดสอบ `E2E-02` ครอบคลุม IT Staff Queue, ค้นหา/กรอง/เรียงลำดับ, Claim/Reassign, ปรับ IT Priority, Status Transitions State Machine, Public Comments, Internal Notes สี Amber, และการบล็อก Requester ด้วย 403
* [`e2e/lab-03/user-administration.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-03/user-administration.spec.ts) — การทดสอบ `E2E-03` ครอบคลุม Administrator User Management, ค้นหา/กรองผู้ใช้, สร้างผู้ใช้ใหม่, ป้องกัน Duplicate Email (409), แก้ไขข้อมูล, สลับ Active/Inactive, Reset Password, Self-Deactivation Guard (SEC-05), Last Active Admin Lockout Guard (SEC-06), และ 403 Forbidden สำหรับ non-admins
* [`e2e/lab-03/visual-qa-screenshots.spec.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/e2e/lab-03/visual-qa-screenshots.spec.ts) — การบันทึกภาพหน้าจอหลักฐาน Visual QA 24 ภาพลงในโฟลเดอร์ `artifacts/lab-03/screenshots/` (แยกตาม `01-auth/`, `02-requester/`, `03-staff/`, `04-admin/`, `05-responsive/`)
* [`scripts/capture-lab3-screenshots.mjs`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/scripts/capture-lab3-screenshots.mjs) — สคริปต์ standalone สำหรับรันและจับภาพหลักฐาน Lab 3 ครบถ้วน

### 4. Client Components (`client/src/components/`)
* [`Login.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/Login.tsx) — หน้าจอ Authentication หลัก รองรับ Email/Password, Busy State และข้อความแจ้งเตือนความปลอดภัย Generic 401 (UI-01, AC-01, AC-05)
* [`ChangePassword.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/ChangePassword.tsx) — หน้าจอบังคับเปลี่ยนรหัสผ่านครั้งแรก พร้อม Interactive Requirements Checklist ตรวจสอบกฎความซับซ้อนแบบเรียลไทม์ (UI-02, AC-02, AC-03)
* [`StaffTicketQueue.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/StaffTicketQueue.tsx) — หน้าจอคิวงานของ IT Staff รองรับ Search, Multi-filtering (Category, Status, IT Priority, Owner), Sortable Columns, Pagination, และ Responsive Table/Mobile Cards (UI-03, AC-12, AC-22)
* [`StaffTicketDetail.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/StaffTicketDetail.tsx) — หน้าจอรายละเอียดตั๋วสำหรับเจ้าหน้าที่ IT พร้อม Operational Bar (Claim, Assign, IT Priority, Status Action Buttons), สายธารสนทนา Public Comments (Zen Green), และ Internal Notes สี Amber Warning (UI-04, AC-10, AC-13..15)
* [`UserManagement.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/UserManagement.tsx) — หน้าจอ Administrator User Directory พร้อมตารางผู้ใช้, Modals สร้าง/แก้ไข, Reset Password Dialog, และปุ่ม Deactivate ปิดการทำงานตนเองที่ถูกปิดกั้นพร้อม Tooltip เตือน (UI-05, AC-16..21)
* [`AppHeader.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/AppHeader.tsx) — Navigation Shell แสดงผลเมนูและ Badge ตาม Role ของผู้ใช้ที่ล็อกอิน พร้อมปุ่ม Logout และการนำทางกลับหน้าหลัก
* [`RequesterTicketDetail.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/components/RequesterTicketDetail.tsx) — หน้าจอแสดงรายละเอียดตั๋วฝั่ง Requester ปรับปรุงเพิ่มปุ่มและสถานะ "Problem Appears Resolved" และ Public Comments Thread (AC-08, AC-09)

### 5. Backend Architecture & Security (`server/src/`)
* [`auth.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/auth.ts) — ระบบ RBAC Authorization Middleware: `requireAuth`, `requireRole`, และ `authenticateSessionOrDev` สำหรับตรวจสอบสิทธิ์ในระดับ Server-Side
* [`session.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/session.ts) — ระบบจัดการ Authenticated Session ด้วย Signed HttpOnly Cookies (`toktickit_session`) และ Cryptographic Session Store
* [`password.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/password.ts) — ระบบแฮชรหัสผ่านด้วย `bcrypt` (10 salt rounds) และฟังก์ชันตรวจสอบความซับซ้อนของรหัสผ่าน
* [`status-transition.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/status-transition.ts) — Finite State Machine Matrix กำหนดสถานะตั๋วที่อนุญาตให้เปลี่ยนผ่านได้อย่างเข้มงวด ป้องกันการกระโดดข้ามสถานะที่ผิดกฎ
