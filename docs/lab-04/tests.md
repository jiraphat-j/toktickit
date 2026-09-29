# Lab 4 Test Plan and Traceability
### TokTickIT — Actions Taken, Dashboards, and Final Regression

---

## 1. Test Strategy & Architectural Blueprint

TokTickIT enforces a strict **Test-Driven Development (Test DD / TDD)** engineering workflow. Automated tests are designed and committed **prior to feature implementation** to serve as executable acceptance contracts.

| Test Level | Framework & Tooling | Scope & Objective |
|---|---|---|
| **Unit & Utility Tests** | Vitest | Calculation formulas (status distributions, open ticket counts), date-time utilities, and state machine transition validators. |
| **API & Integration Tests** | Supertest + Vitest | Express REST endpoints for Actions Taken CRUD, Requester Dashboard, IT Staff Dashboard, and Status Transitions with Resolution Gate. |
| **Security & Authorization Tests** | Supertest + Vitest | Server-side RBAC boundary enforcement: verifying Requesters receive `403 Forbidden` on write operations, requester ownership isolation (404), and deactivated user checks. |
| **UI Component & Style Tests** | Vitest + React Testing Library | ActionsTaken list/modal, StaffDashboard, RequesterDashboard, transition buttons, Zen Green CSS tokens, validation feedback, and busy states. |
| **Regression Tests** | Supertest + Vitest | Complete verification that all Lab 1 (Health, Categories), Lab 2 (Create Ticket, Attachments, My Tickets), and Lab 3 (Auth, Sessions, RBAC, Admin) features pass 100%. |
| **End-to-End (E2E) Tests** | Playwright | Full cross-role journeys (Actions Taken logging, Resolution Gate enforcement, Dashboard drill-downs) across Desktop, Tablet, and Mobile viewports. |

---

## 2. Acceptance Criteria Traceability Matrix

Every Acceptance Criterion (AC-01 through AC-14) defined in `docs/lab-04/specification.md` is mapped to one or more automated test cases:

| AC ID | Acceptance Criterion Summary | Planned Test IDs | Test Level | Automated Test Target File |
|:---:|---|:---:|:---:|---|
| **AC-01** | Create valid Action Taken under ticket | `ACT-01`, `ACT-02` | API, Unit | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-02** | Follow-up note mandatory when required | `ACT-03`, `UI-ACT-02` | API, UI | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` |
| **AC-03** | Requester forbidden from creating/editing actions | `ACT-SEC-01`, `ACT-SEC-02` | API (Security) | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-04** | Requester views read-only actions on owned tickets | `ACT-REQ-01`, `UI-ACT-04` | API, UI | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` |
| **AC-05** | Deactivated staff performer rejection | `ACT-SEC-03` | API | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-06** | Resolution gate blocks ticket with 0 actions | `WF-01`, `WF-02` | API, Workflow | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-07** | Resolution gate allows ticket with ≥1 action | `WF-03`, `E2E-02` | API, E2E | `server/tests/lab-04/ticket-workflow.api.test.ts`, `e2e/lab-04/ticket-resolution.spec.ts` |
| **AC-08** | Requester resolved flag is advisory only | `WF-04` | API, Workflow | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-09** | Requester dashboard metrics strictly user-scoped | `DASH-REQ-01`, `DASH-REQ-02` | API, Dashboard | `server/tests/lab-04/requester-dashboard.api.test.ts` |
| **AC-10** | IT Staff dashboard operational metrics accuracy | `DASH-STF-01`, `DASH-STF-02` | API, Dashboard | `server/tests/lab-04/staff-dashboard.api.test.ts` |
| **AC-11** | Interactive drill-down navigation from cards | `UI-DASH-01`, `E2E-03` | UI, E2E | `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` |
| **AC-12** | Concurrency conflict & stale update rejection | `ACT-04`, `WF-05` | API, Integration | `server/tests/lab-04/actions-taken.api.test.ts`, `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-13** | Zen Green responsive design across viewports | `UI-RESP-01`, `E2E-RESP-01` | UI, E2E | `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` |
| **AC-14** | Complete zero regression across Labs 1–3 | `REG-01`, `REG-02`, `REG-03` | Regression | Full Test Suites (Server, Client & E2E) |

---

## 3. Planned & Executed Tests Catalog

| Test ID | Level | AC / BR | Scenario / What It Tests | Expected Result | Automated Test File | Status |
|:---:|:---:|:---:|---|---|---|:---:|
| **MIG-01** | Integration | BR-12 | Database migration idempotency & schema verification | Migration executes cleanly; `ActionTaken` table and indexes present | `server/tests/lab-04/migration-seed.test.ts` | Planned |
| **MIG-02** | Integration | BR-12 | Zero data loss on legacy tickets without actions | Pre-existing tickets remain readable; actions list returns empty array | `server/tests/lab-04/migration-seed.test.ts` | Planned |
| **SEED-01**| Integration | BR-02 | Seed data populates multi-action and zero-action tickets | Tickets with 0, 1, and 3+ actions exist; metrics show non-zero values | `server/tests/lab-04/migration-seed.test.ts` | Planned |
| **ACT-01** | API | AC-01, BR-01 | Create valid Action Taken (`POST /api/tickets/:id/actions-taken`) | Action saved under ticket, performer auto-set to session user, returns 201 | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-02** | API | AC-01, BR-04 | Description & Result length validation (5-2000 chars, 2-2000 chars) | Invalid lengths rejected with 400 Bad Request | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-03** | API | AC-02, BR-07 | Follow-up required without follow-up note | Rejected with 400 Bad Request (`FOLLOW_UP_NOTE_REQUIRED`) | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-04** | API | AC-12, BR-19 | Update Action Taken (`PATCH /api/actions-taken/:id`) with stale version | Conflicting update detected and rejected with 409 Conflict | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-SEC-01** | Security | AC-03, BR-10 | Requester attempts `POST /api/tickets/:id/actions-taken` | Rejected with 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-SEC-02** | Security | AC-03, BR-10 | Requester attempts `PATCH /api/actions-taken/:id` | Rejected with 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-SEC-03** | Security | AC-05, BR-09 | Action creation by deactivated IT Staff session | Rejected with 401 Unauthorized / 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-REQ-01** | API | AC-04, BR-10 | Requester lists actions on owned ticket (`GET /api/tickets/:id/actions-taken`) | Returns actions array with author details | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **ACT-REQ-02** | Security | AC-04, BR-10 | Requester lists actions on unowned ticket | Rejected with 404 Not Found (Zero leakage) | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **WF-01** | API | AC-06, BR-13 | Transition ticket to `RESOLVED` with 0 Actions Taken | Rejected with 400 Bad Request (`RESOLUTION_GATE_FAILED`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-02** | API | AC-06, BR-13 | Transition ticket with 0 actions directly bypassing client | Server-side enforcement catches bypass and blocks resolution | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-03** | API | AC-07, BR-13 | Transition ticket to `RESOLVED` with ≥1 Action Taken | Status successfully updated to `RESOLVED`, audit timestamp recorded | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-04** | API | AC-08, BR-14 | Requester marks problem appears resolved | Flag set to true; status remains unchanged (e.g. `IN_PROGRESS`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-05** | API | AC-12, BR-15 | Illegal status jump (e.g. `NEW` ➔ `RESOLVED`) | Rejected with 400 Bad Request (`ILLEGAL_STATUS_TRANSITION`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **DASH-REQ-01** | API | AC-09, BR-16 | Requester Dashboard query (`GET /api/dashboard/requester`) | Returns totalOpen, waiting, recentlyUpdated, recentlyResolved scoped to user | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-REQ-02** | Security | AC-09, BR-16 | Requester Dashboard data isolation between Users A and B | User A metrics never include User B tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-STF-01** | API | AC-10, BR-17 | IT Staff Dashboard query (`GET /api/dashboard/staff`) | Returns unassignedCount, myTicketsCount, status & priority breakdowns | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-STF-02** | API | AC-10, BR-18 | Staff Dashboard personal actions count | Accurately returns count of actions performed by authenticated staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-SEC-01** | Security | AC-10, BR-09 | Requester calls `GET /api/dashboard/staff` | Blocked with 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **UI-ACT-01** | UI | AC-01, AC-04 | ActionsTaken component table rendering & empty state | Displays tabular actions list on desktop or empty alert | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-02** | UI | AC-02, BR-07 | Create Action Taken form inline validation | Shows required error for followUpNote when checkbox ticked | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-03** | UI | AC-01, BR-06 | Performed by auto-populated from session | Displays logged-in staff name, field disabled/read-only | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-04** | UI | AC-04, BR-10 | Requester role hides create and edit action controls | Creation button and edit links are completely absent | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-WF-01** | UI | AC-06, AC-07 | Status transition controls show only permitted options | Buttons dynamically match matrix; Resolve disabled with tooltip if 0 actions | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-DASH-01** | UI | AC-10, AC-11 | Staff Dashboard metric cards and drill-down links | Clicking Unassigned card passes filter parameters to Ticket Queue | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DASH-02** | UI | AC-09, AC-11 | Requester Dashboard metric cards and links | Clicking card navigates to My Tickets with appropriate filter | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-RESP-01** | UI | AC-13 | Responsive layout verification | Table/card transformations on Desktop, Tablet, and Mobile | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-04 | Full Actions Taken lifecycle flow | IT Staff creates action ➔ Requester views read-only action | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-06, AC-07 | Ticket resolution workflow with gate enforcement | Staff attempts resolve (blocked) ➔ adds action ➔ resolve succeeds | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-03** | E2E | AC-09, AC-10 | Role dashboards & interactive drill-down | Verifies card counts, drill-downs, and responsive layout across viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **E2E-RESP-01**| E2E | AC-13 | Zero horizontal overflow across all 3 viewports | `scrollWidth <= innerWidth` on 1280px, 768px, and 375px viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **REG-01** | Regress | AC-14 | Complete Server Regression Suite (Labs 1, 2, 3) | All prior API, Auth, RBAC, and Admin tests continue to pass 100% | `npm --prefix server test` | Planned |
| **REG-02** | Regress | AC-14 | Complete Client Regression Suite (Labs 1, 2, 3) | All prior UI components and forms continue to pass 100% | `npm --prefix client test` | Planned |
| **REG-03** | Regress | AC-14 | Playwright E2E Regression Suite | All existing E2E journeys run cleanly | `npx playwright test` | Planned |

---

## 4. Test Execution Commands

```bash
# 1. Run all server unit, API, security, and workflow tests:
npm --prefix server test

# 2. Run all client component, UI style, and accessibility tests:
npm --prefix client test

# 3. Run Playwright End-to-End test suites across viewports:
npx playwright test

# 4. Run Grand Total full-stack test suite:
npm run test:all
```

---

## 5. Pre-Implementation Traceability Statement

This document (`docs/lab-04/tests.md`) was established and committed in **Issue #56** prior to the implementation of database migrations, backend APIs, and frontend components in Sprint 4. Every Acceptance Criterion is mapped to an automated test, establishing strict bidirectional traceability.
