# Lab 4 Test Plan and Traceability
### TokTickIT — Actions Taken, Dashboards, and Final Regression

> **Pre-Implementation Deliverable Notice:**  
> This document establishes the **pre-implementation Test-Driven Development (Test DD) blueprint** for Sprint 4. All test cases in this plan represent planned verification contracts designed prior to feature code implementation. Status indicator `Planned` signifies that the test case is specified and mapped to an intended automated test suite, with execution and passing status to be fulfilled during subsequent feature sprints (Issues #57 through #64).

---

## 1. Test Strategy & 10 Coverage Types

To satisfy the engineering requirements of Sprint 4 (Section 10 of the labsheet), the test suite encompasses **10 distinct test coverage types**:

| # | Coverage Type | Framework & Tooling | Scope & Objective |
|:---:|---|---|---|
| **1** | **Unit Tests** | Vitest | Calculation formulas (status distributions, ticket counters), date-time formatting utilities, and pure validation helpers. |
| **2** | **API / Integration Tests** | Supertest + Vitest | Express REST endpoints for Actions Taken CRUD, Requester Dashboard, and IT Staff Dashboard data structures. |
| **3** | **UI Component Tests** | Vitest + React Testing Library | Rendering, event dispatching, form state, character counters, and button disable states for Actions Taken and Dashboards. |
| **4** | **UI Style Tests** | Vitest + React Testing Library | Adherence to the Zen Green design system tokens (`#006B3C`, `#0B7A46`, `#EAF6EF`, `#FEF3C7`), badge colors, and contrast compliance. |
| **5** | **Responsive Tests** | Playwright + RTL | Layout transformation across Desktop (≥992px), Tablet (768–991px), and Mobile (<768px), verifying zero horizontal overflow (`scrollWidth <= innerWidth`). |
| **6** | **Authorization Tests** | Supertest + Vitest | Strict server-side RBAC boundaries: Requester write operation rejection (`403 Forbidden`), ticket ownership scoping (`404 Not Found`), and inactive user guards. |
| **7** | **Workflow Tests** | Supertest + Vitest | Enforcement of the 8-state transition matrix and the **Resolution Gate** (blocking `RESOLVED` when Actions Taken = 0). |
| **8** | **Migration / Regression Tests** | Prisma CLI + Supertest | Verifying zero data loss on legacy tickets/users after migration, and ensuring 100% pass rate on all pre-existing Lab 1–3 test suites. |
| **9** | **Performance-Smoke Tests** | Vitest / Supertest / Autocannon | Latency smoke tests verifying that dashboard aggregation queries and multi-action listings return in <200ms under standard operational workloads. |
| **10**| **End-to-End (E2E) Tests** | Playwright | Full cross-role browser journeys covering Action logging, Resolution Gate blocking and unlocking, and Dashboard drill-down navigation. |

---

## 2. Pre-Implementation Acceptance Criteria Traceability Matrix

Every Acceptance Criterion (`AC-01` through `AC-14`) defined in `docs/lab-04/specification.md` is mapped to planned automated tests, achieving **100% Planned Requirements Coverage**:

| AC ID | Acceptance Criterion Summary | Planned Test IDs | Coverage Type(s) | Automated Test Target File |
|:---:|---|:---:|:---:|---|
| **AC-01** | Create valid Action Taken under ticket | `ACT-01`, `ACT-02` | API, Unit | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-02** | Follow-up note mandatory when required | `ACT-03`, `UI-ACT-02` | API, UI Component | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` |
| **AC-03** | Requester forbidden from creating/editing actions | `ACT-SEC-01`, `ACT-SEC-02` | Authorization | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-04** | Requester views read-only actions on owned tickets | `ACT-REQ-01`, `UI-ACT-04` | API, UI Component | `server/tests/lab-04/actions-taken.api.test.ts`, `client/tests/lab-04/ActionsTaken.test.tsx` |
| **AC-05** | Deactivated staff performer rejection | `ACT-SEC-03` | Authorization | `server/tests/lab-04/actions-taken.api.test.ts` |
| **AC-06** | Resolution gate blocks ticket with 0 actions | `WF-01`, `WF-02` | Workflow, Authorization | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-07** | Resolution gate allows ticket with ≥1 action | `WF-03`, `E2E-02` | Workflow, E2E | `server/tests/lab-04/ticket-workflow.api.test.ts`, `e2e/lab-04/ticket-resolution.spec.ts` |
| **AC-08** | Requester resolved flag is advisory only | `WF-04` | Workflow | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-09** | Requester dashboard metrics strictly user-scoped | `DASH-REQ-01`, `DASH-REQ-02` | API, Authorization | `server/tests/lab-04/requester-dashboard.api.test.ts` |
| **AC-10** | IT Staff dashboard operational metrics accuracy | `DASH-STF-01`, `DASH-STF-02` | API, Unit | `server/tests/lab-04/staff-dashboard.api.test.ts` |
| **AC-11** | Interactive drill-down navigation from cards | `UI-DASH-01`, `E2E-03` | UI Component, E2E | `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` |
| **AC-12** | Concurrency conflict & stale update rejection | `ACT-04`, `WF-05` | API, Integration | `server/tests/lab-04/actions-taken.api.test.ts`, `server/tests/lab-04/ticket-workflow.api.test.ts` |
| **AC-13** | Zen Green responsive design & styling | `STYLE-01`, `RESP-01`, `E2E-RESP-01` | UI Style, Responsive, E2E | `client/tests/lab-04/StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts` |
| **AC-14** | Complete zero regression across Labs 1–3 | `REG-01`, `REG-02`, `REG-03` | Migration/Regression | Full Test Suites (Server, Client & E2E) |

---

## 3. Planned Tests Catalog (Pre-Implementation)

*(Note: All test cases below are planned and specified prior to code implementation. Execution and PASS status will be fulfilled during feature implementation in Issues #57–#64.)*

| Test ID | Coverage Type | AC / BR | Scenario / What It Tests | Expected Result | Automated Test Target File | Status |
|:---:|:---:|:---:|---|---|---|:---:|
| **MIG-01** | Migration | BR-12, AC-01, AC-14 | Database migration idempotency & schema verification | Migration executes cleanly; `ActionTaken` table, relations, and indexes present | `server/tests/lab-04/migration-seed.test.ts` | **PASS** |
| **MIG-02** | Migration | BR-12, AC-14 | Zero data loss on legacy tickets without actions | Pre-existing tickets and users remain intact; actions list query works | `server/tests/lab-04/migration-seed.test.ts` | **PASS** |
| **SEED-01**| Integration | BR-02, AC-01 | Seed data populates multi-action and zero-action tickets | Tickets with 0, 1, and 3+ actions by different staff exist and seed idempotency verified | `server/tests/lab-04/migration-seed.test.ts` | **PASS** |
| **ACT-01** | API | AC-01, BR-01 | Create valid Action Taken (`POST /api/tickets/:id/actions-taken`) | Action saved under ticket, performer auto-set to session user, returns 201 | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-02** | API / Unit | AC-01, BR-04 | Description & Result length validation (5-2000 chars, 2-2000 chars) | Invalid lengths rejected with 400 Bad Request | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-03** | API | AC-02, BR-07 | Follow-up required without follow-up note | Rejected with 400 Bad Request (`FOLLOW_UP_NOTE_REQUIRED`) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-04** | API | AC-12, BR-19 | Update Action Taken (`PATCH /api/actions-taken/:id`) with stale version | Conflicting update detected and rejected with 409 Conflict | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-SEC-01** | Authorization | AC-03, BR-10 | Requester attempts `POST /api/tickets/:id/actions-taken` | Rejected with 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-SEC-02** | Authorization | AC-03, BR-10 | Requester attempts `PATCH /api/actions-taken/:id` | Rejected with 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-SEC-03** | Authorization | AC-05, BR-09 | Action creation by deactivated IT Staff session | Rejected with 401 Unauthorized / 403 Forbidden | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-REQ-01** | API | AC-04, BR-10 | Requester lists actions on owned ticket (`GET /api/tickets/:id/actions-taken`) | Returns actions array with author details | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **ACT-REQ-02** | Authorization | AC-04, BR-10 | Requester lists actions on unowned ticket | Rejected with 404 Not Found (Zero leakage) | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **WF-01** | Workflow | AC-06, BR-13 | Transition ticket to `RESOLVED` with 0 Actions Taken | Rejected with 400 Bad Request (`RESOLUTION_GATE_FAILED`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-02** | Workflow | AC-06, BR-13 | Transition ticket with 0 actions directly bypassing client | Server-side enforcement catches bypass and blocks resolution | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-03** | Workflow | AC-07, BR-13 | Transition ticket to `RESOLVED` with ≥1 Action Taken | Status successfully updated to `RESOLVED`, audit timestamp recorded | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-04** | Workflow | AC-08, BR-14 | Requester marks problem appears resolved | Flag set to true; status remains unchanged (e.g. `IN_PROGRESS`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-05** | Workflow | AC-12, BR-15 | Illegal status jump (e.g. `NEW` ➔ `RESOLVED`) | Rejected with 400 Bad Request (`ILLEGAL_STATUS_TRANSITION`) | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **DASH-REQ-01** | API | AC-09, BR-16 | Requester Dashboard query (`GET /api/dashboard/requester`) | Returns totalOpen, waiting, recentlyUpdated, recentlyResolved scoped to user | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-REQ-02** | Authorization | AC-09, BR-16 | Requester Dashboard data isolation between Users A and B | User A metrics never include User B tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-STF-01** | API | AC-10, BR-17 | IT Staff Dashboard query (`GET /api/dashboard/staff`) | Returns unassignedCount, myTicketsCount, status & priority breakdowns | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-STF-02** | API | AC-10, BR-18 | Staff Dashboard personal actions count | Accurately returns count of actions performed by authenticated staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-SEC-01** | Authorization | AC-10, BR-09 | Requester calls `GET /api/dashboard/staff` | Blocked with 403 Forbidden | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **SMOKE-01**| Smoke/Perf | AC-10 | Performance-smoke: Staff and Requester dashboard query response latency | Endpoints respond in <200ms (P95) under standard seeded workload | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **SMOKE-02**| Smoke/Perf | AC-01 | Performance-smoke: Actions Taken listing latency with simulated volume | Action history on ticket with 100+ items returns in <150ms | `server/tests/lab-04/actions-taken.api.test.ts` | **PASS** |
| **UI-ACT-01** | UI Component | AC-01, AC-04 | ActionsTaken component table rendering & empty state | Displays tabular actions list on desktop or empty alert | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-02** | UI Component | AC-02, BR-07 | Create Action Taken form inline validation | Shows required error for followUpNote when checkbox ticked | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-03** | UI Component | AC-01, BR-06 | Performed by auto-populated from session | Displays logged-in staff name, field disabled/read-only | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-ACT-04** | UI Component | AC-04, BR-10 | Requester role hides create and edit action controls | Creation button and edit links are completely absent | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **STYLE-01** | UI Style | AC-13 | Zen Green theme tokens, status badge styling, and contrast | Primary `#006B3C`, secondary `#0B7A46`, pale `#EAF6EF`, amber notes | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **RESP-01** | Responsive | AC-13 | Responsive layout transformation across 3 viewports | Table to card view transformation without horizontal overflow | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-WF-01** | UI Component | AC-06, AC-07 | Status transition controls show only permitted options | Buttons dynamically match matrix; Resolve disabled with tooltip if 0 actions | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-DASH-01** | UI Component | AC-10, AC-11 | Staff Dashboard metric cards and drill-down links | Clicking Unassigned card passes filter parameters to Ticket Queue | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-DASH-02** | UI Component | AC-09, AC-11 | Requester Dashboard metric cards and links | Clicking card navigates to My Tickets with appropriate filter | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01, AC-04 | Full Actions Taken lifecycle flow | IT Staff creates action ➔ Requester views read-only action | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-06, AC-07 | Ticket resolution workflow with gate enforcement | Staff attempts resolve (blocked) ➔ adds action ➔ resolve succeeds | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-03** | E2E | AC-09, AC-10 | Role dashboards & interactive drill-down | Verifies card counts, drill-downs, and responsive layout across viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **E2E-RESP-01**| E2E / Responsive | AC-13 | Zero horizontal overflow across all 3 viewports | `scrollWidth <= innerWidth` on 1280px, 768px, and 375px viewports | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **REG-01** | Regression | AC-14 | Complete Server Regression Suite (Labs 1, 2, 3) | All prior API, Auth, RBAC, and Admin tests continue to pass 100% | `npm --prefix server test` | Planned |
| **REG-02** | Regression | AC-14 | Complete Client Regression Suite (Labs 1, 2, 3) | All prior UI components and forms continue to pass 100% | `npm --prefix client test` | Planned |
| **REG-03** | Regression | AC-14 | Playwright E2E Regression Suite | All existing E2E journeys run cleanly | `npx playwright test` | Planned |

---

## 4. Test Execution Commands & Verification Guide

```bash
# 1. Run server unit, API, security, workflow, and performance-smoke tests:
npm --prefix server test

# 2. Run client component, UI style, and accessibility tests:
npm --prefix client test

# 3. Run Playwright End-to-End and responsive viewport tests:
npx playwright test

# 4. Run Grand Total full-stack regression suite:
npm run test:all
```

---

## 5. Pre-Implementation Traceability Statement

This document (`docs/lab-04/tests.md`) was established and committed in **Issue #56** prior to the implementation of database migrations, backend APIs, and frontend components in Sprint 4. The phrase **100% Coverage** refers strictly to **100% of Acceptance Criteria mapped to planned automated tests** (Pre-Implementation Requirement Mapping Coverage). Actual execution pass rates will be recorded and updated during feature implementation sprints.
