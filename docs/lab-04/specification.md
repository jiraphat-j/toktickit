# Lab 4 Sprint Engineering Specification
### TokTickIT — Actions Taken, Dashboards, and Final Regression

---

## 1. Sprint Goal

Deliver the operational completion of the TokTickIT service desk by establishing a structured **Actions Taken** work-logging engine under Tickets, enforcing the definitive **Ticket Status Lifecycle & Resolution Gate**, introducing dedicated, role-scoped **Dashboards for Requesters and IT Staff** with accessible drill-down capabilities, and hardening the entire full-stack application across Labs 1–3 to ensure **zero regression**, robust error handling, responsive Zen Green design consistency, and complete traceability.

---

## 2. Stakeholder Request Interpretation

The stakeholder requires the service desk to evolve from simple communication into a true operational workflow and analytics system:
1. **Actions Taken (Parent-Child Work Tracking):** IT Staff need a reliable, structured way to document real work done on a Ticket. Every action must capture the date/time, action description, outcome/result, performer (auto-attributed to the authenticated staff member), whether follow-up is required (with mandatory follow-up notes when true), and attachment reference notes.
2. **Ticket Ownership vs. Action Execution:** The primary Ticket Owner remains responsible for coordinating the ticket as a whole, but any authorized IT Staff member may perform and record individual Actions Taken.
3. **Resolution Gate Enforcement:** Requesters may signal that their issue "appears resolved", but this is strictly advisory. Formal resolution is a privileged IT Staff / Administrator operation that requires verified work: the backend must enforce that a ticket cannot transition to `RESOLVED` unless at least one Action Taken has been recorded.
4. **Role-Appropriate Dashboards:**
   - **Requester Dashboard:** Provides a clear summary of open work, items waiting on the requester, recently updated tickets, and resolved tickets, without duplicating the dense My Tickets list.
   - **IT Staff Dashboard:** Provides operational metrics (unassigned work, tickets owned by current user, distribution by status and priority, recent tickets, and actions taken by current user) with immediate drill-down links to filtered queues.
5. **Full Application Hardening & Regression:** All features from Lab 1 (health, categories), Lab 2 (requester creation, attachments, soft-delete, my tickets), and Lab 3 (authentication, sessions, RBAC, staff queue, dual comments/internal notes, admin user management) must continue to operate flawlessly under the Zen Green design language with zero horizontal page scrolling across Desktop, Tablet, and Mobile viewports.

---

## 3. Scope

### Included
- **Actions Taken Data Model & Relationships:**
  - One-to-many relationship (`Ticket 1 ➔ Many ActionTaken`).
  - Fields: `id`, `ticketId`, `actionDateTime`, `description`, `result`, `performedById`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `createdAt`, `updatedAt`.
  - Relation to `User` as `performedBy` (auto-bound to authenticated user).
- **Actions Taken Backend & APIs:**
  - `POST /api/tickets/:ticketId/actions-taken` — Create action.
  - `GET /api/tickets/:ticketId/actions-taken` — List actions for ticket.
  - `GET /api/actions-taken/:id` — Get single action.
  - `PATCH /api/actions-taken/:id` — Edit action.
  - Server-side RBAC: Requester read-only on owned tickets; IT Staff/Admin create & edit.
  - Active performer validation: Performer must be an active IT Staff or Administrator account.
- **Actions Taken UI on Ticket Detail:**
  - Responsive table (Desktop) and stacked cards (Mobile) under Ticket Detail.
  - Create Action Taken modal/form with validation.
  - Edit Action Taken modal/form with validation.
  - Role-adaptive visibility: Requester views read-only records; Staff/Admin have creation and editing controls.
- **Ticket Workflow & Resolution Gate:**
  - Definitive Status Transition State Machine: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
  - Server-enforced Resolution Gate: Transition to `RESOLVED` rejected with `400 Bad Request` if ticket has zero Actions Taken.
  - Requester "Problem Appears Resolved" flag remains advisory only and does not alter `currentStatus`.
- **Role Dashboards:**
  - `GET /api/dashboard/requester` — Scoped strictly to authenticated requester session.
  - `GET /api/dashboard/staff` — Operational metrics, status/priority breakdown, current user workload.
  - `RequesterDashboard` and `StaffDashboard` React views with metric cards and interactive drill-down navigation.
  - Header Navigation tab highlighting active dashboard.
- **Application Hardening & Regression:**
  - Concurrency & stale update protection.
  - Zero regression across all Lab 1, 2, and 3 test suites.
  - Accessibility (:focus-visible, semantic HTML) and responsive viewports (Desktop 1280px, Tablet 768px, Mobile 375px) with `scrollWidth <= innerWidth`.

### Explicitly Excluded
- Automatic SLA countdown clocks, breach notifications, and automated escalation timers.
- Outbound external notification integrations (Email, SMS, LINE, Push notifications).
- Inventory consumption, spare parts tracking, purchasing, or service cost accounting.
- Timesheet billing, hourly rates, payroll, or labor-cost calculations.
- Multi-level hierarchical approval workflows or electronic signature capture.
- Advanced business intelligence (BI) report builders, chart exporters, or data warehouses.
- Multi-tenant organizational isolation or cloud deployment infrastructure changes.
- Unapproved product features outside the Sprint 4 engineering contract.

---

## 4. Functional Requirements

| ID | Requirement Statement |
|---|---|
| **FR-01** | The system shall allow authorized IT Staff and Administrators to record Actions Taken under an accessible Ticket. |
| **FR-02** | The system shall automatically bind the `performedBy` field of an Action Taken to the currently authenticated user session. |
| **FR-03** | The system shall require a non-empty `followUpNote` whenever `followUpRequired` is set to `true`. |
| **FR-04** | The system shall allow IT Staff and Administrators to edit existing Actions Taken on accessible tickets. |
| **FR-05** | The system shall allow Requesters to view all Actions Taken on tickets they own, but strictly forbid Requesters from creating or modifying Actions Taken. |
| **FR-06** | The system shall enforce the Ticket Status Transition Matrix on the backend, rejecting any disallowed transition with `400 Bad Request`. |
| **FR-07** | The system shall enforce a Resolution Gate preventing a Ticket from moving to `RESOLVED` unless at least one valid Action Taken exists on the ticket. |
| **FR-08** | The system shall treat Requester "Problem Appears Resolved" indication strictly as an advisory flag that does not modify the ticket status. |
| **FR-09** | The system shall provide an IT Staff Dashboard displaying operational metrics: unassigned tickets, tickets owned by the current user, breakdown by status and IT priority, recent tickets, and actions taken by the current user. |
| **FR-10** | The system shall provide a Requester Dashboard displaying user-scoped metrics: total open tickets, tickets waiting for requester, recently updated tickets, and recently resolved tickets. |
| **FR-11** | The system shall provide interactive drill-down actions from dashboard metric cards to the appropriate filtered queue or ticket view. |
| **FR-12** | The system shall maintain complete regression compatibility: all Lab 1, Lab 2, and Lab 3 APIs and UI components must continue to pass 100%. |
| **FR-13** | The system shall maintain Zen Green design consistency and responsive layouts without horizontal page overflow across desktop, tablet, and mobile viewports. |

---

## 5. Business Rules

| ID | Business Rule Statement |
|---|---|
| **BR-01** | An Action Taken record belongs to exactly one Ticket (`ticketId` is mandatory and immutable). |
| **BR-02** | The primary Ticket Owner coordinates the Ticket, but an Action Taken may be created and recorded by any active IT Staff or Administrator member. |
| **BR-03** | `actionDateTime` defaults to the current UTC timestamp if omitted, but may be supplied as a valid past or present ISO-8601 date-time string. Future dates beyond 5 minutes are rejected. |
| **BR-04** | `description` is mandatory and must contain between 5 and 2,000 characters after whitespace trimming. |
| **BR-05** | `result` is mandatory and must contain between 2 and 2,000 characters after whitespace trimming. |
| **BR-06** | `performedById` is automatically populated from the authenticated session user ID. The client cannot forge or substitute `performedById`. |
| **BR-07** | When `followUpRequired` is `true`, `followUpNote` is mandatory and must contain between 3 and 1,000 characters after trimming. When `followUpRequired` is `false`, `followUpNote` is cleared to `null`. |
| **BR-08** | `attachmentNotes` is optional (nullable), containing up to 500 characters of descriptive text identifying associated files or physical records. |
| **BR-09** | Action Taken creation and modification are restricted to users with role `IT_STAFF` or `ADMINISTRATOR` whose accounts are active (`isActive = true`). Deactivated users cannot record actions. |
| **BR-10** | Requesters can only view Actions Taken on tickets where `requesterId == currentUser.id`. Any direct attempt by a Requester to call write endpoints returns `403 Forbidden`. |
| **BR-11** | Permitted Ticket statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, and `CANCELLED`. |
| **BR-12** | Permitted status transitions are strictly governed by the Status Transition Matrix. Client bypass attempts are rejected by the server with `400 Bad Request`. |
| **BR-13** | **Resolution Gate:** Transitioning a ticket to `RESOLVED` requires that `actionsTaken.count >= 1`. Attempting to resolve a ticket with 0 actions returns `400 Bad Request` with code `RESOLUTION_GATE_FAILED`. |
| **BR-14** | Requester "Problem Appears Resolved" toggle remains an advisory signal and does NOT trigger an automatic status transition to `RESOLVED`. |
| **BR-15** | Dashboard metrics must be calculated authoritatively by the database/backend, never by client-side aggregation of full datasets. |
| **BR-16** | Requester dashboard queries must be strictly scoped to `requesterId = currentUser.id` using session identity. |
| **BR-17** | IT Staff dashboard unassigned metric counts tickets with `primaryOwnerId IS NULL` and `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`. |
| **BR-18** | IT Staff dashboard "My Tickets" metric counts tickets with `primaryOwnerId = currentUser.id` and `currentStatus NOT IN ('CLOSED', 'CANCELLED')`. |
| **BR-19** | Concurrent / stale updates on Actions Taken or Ticket Status detect conflicts using the record's `updatedAt` timestamp. |

---

## 6. Role-Based Access Control Matrix

| Feature / Endpoint | Requester | IT Staff | Administrator |
|---|:---:|:---:|:---:|
| `POST /api/tickets/:id/actions-taken` | ❌ 403 Forbidden | ✅ Allowed | ✅ Allowed |
| `GET /api/tickets/:id/actions-taken` | ✅ Owned Tickets only | ✅ Accessible | ✅ Accessible |
| `PATCH /api/actions-taken/:id` | ❌ 403 Forbidden | ✅ Allowed | ✅ Allowed |
| `GET /api/dashboard/requester` | ✅ Own metrics only | ❌ 403 / Redirect | ❌ 403 / Redirect |
| `GET /api/dashboard/staff` | ❌ 403 Forbidden | ✅ Allowed | ✅ Allowed |
| `PATCH /api/staff/tickets/:id/status` (Resolve) | ❌ 403 Forbidden | ✅ (Requires ≥1 Action) | ✅ (Requires ≥1 Action) |
| Ticket Detail Actions Taken UI Controls | 👁️ Read-only list | ✏️ Create & Edit | ✏️ Create & Edit |
| Requester "Problem Appears Resolved" | ✅ Own Tickets | ❌ (Staff uses Status) | ❌ (Admin uses Status) |

---

## 7. Ticket Status Transition Matrix

```
       ┌──────────────────────┐
       │         NEW          │
       └──────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│     OPEN     │    │  CANCELLED   │◄─── (From any active state)
└───────┬──────┘    └──────────────┘
        │
        ├───────────────────┐
        ▼                   ▼
┌──────────────┐    ┌────────────────────────┐
│ IN_PROGRESS  │◄──►│ WAITING_FOR_REQUESTER  │
└───────┬──────┘    └───────────┬────────────┘
        │                       │
        └─────────┬─────────────┘
                  │ (Requires Actions Taken >= 1)
                  ▼
       ┌──────────────────────┐
       │       RESOLVED       │
       └──────────┬───────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│    CLOSED    │    │   REOPENED   │
└──────────────┘    └──────┬───────┘
                           │
                           ▼
                  (To IN_PROGRESS)
```

| Current Status | Permitted Next Statuses | Roles Authorized | Prerequisite / Rule |
|---|---|---|---|
| `NEW` | `OPEN`, `CANCELLED` | IT Staff, Admin | Initial triage |
| `OPEN` | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `CANCELLED` | IT Staff, Admin | Assignment / Start work |
| `IN_PROGRESS` | `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Admin | **`RESOLVED` requires Actions Taken ≥ 1** |
| `WAITING_FOR_REQUESTER` | `IN_PROGRESS`, `RESOLVED`, `CANCELLED` | IT Staff, Admin | **`RESOLVED` requires Actions Taken ≥ 1** |
| `RESOLVED` | `CLOSED`, `REOPENED` | IT Staff, Admin | Verification period |
| `REOPENED` | `IN_PROGRESS`, `CANCELLED` | IT Staff, Admin | Rework needed |
| `CLOSED` | None (Terminal) | — | Ticket completed |
| `CANCELLED` | None (Terminal) | — | Ticket aborted |

---

## 8. Data Model & Migration Decisions

### 8.1 Schema Increment (Prisma)

```prisma
model ActionTaken {
  id                Int      @id @default(autautoincrement())
  ticketId          Int
  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  actionDateTime    DateTime @default(now())
  description       String
  result            String
  performedById     Int
  performedBy       User     @relation("ActionsPerformed", fields: [performedById], references: [id])
  followUpRequired  Boolean  @default(false)
  followUpNote      String?
  attachmentNotes   String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([ticketId])
  @@index([performedById])
  @@index([actionDateTime])
}
```

### 8.2 Database Design Decisions Justification (Minimum 2 required)
1. **Decision 1: Direct Foreign Key to `User` with Cascade on Ticket Deletion:**  
   *Rationale:* Actions Taken are sub-records tightly coupled to their parent Ticket. If a Ticket were purged, its actions have no independent meaning. However, linking `performedById` to `User` uses `RESTRICT` (default) to ensure that staff audit trails cannot be accidentally deleted if an IT staff account is deactivated.
2. **Decision 2: Indexed `ticketId`, `performedById`, and `actionDateTime`:**  
   *Rationale:* High-frequency queries in Lab 4 include listing actions for a ticket (`WHERE ticketId = ? ORDER BY actionDateTime DESC`) and calculating the IT Staff dashboard's personal work count (`WHERE performedById = ?`). Adding targeted composite/single-field indexes prevents sequential scans as work logs scale.
3. **Decision 3: Zero Data Loss & Legacy Ticket Compatibility:**  
   *Rationale:* Pre-existing tickets from Labs 1–3 contain zero actions. The migration introduces `ActionTaken` as a new table with zero changes to existing `Ticket` columns except for the virtual relation. Existing tickets remain valid and queryable; only transitioning to `RESOLVED` will enforce the new gate.

---

## 9. Dashboard Calculations & Boundaries

### 9.1 Requester Dashboard (`GET /api/dashboard/requester`)
- **`totalOpenTickets`**: Count of tickets where `requesterId = currentUser.id` AND `currentStatus IN ('NEW', 'OPEN', 'IN_PROGRESS', 'WAITING_FOR_REQUESTER')`.
- **`waitingForRequesterCount`**: Count of tickets where `requesterId = currentUser.id` AND `currentStatus = 'WAITING_FOR_REQUESTER'`.
- **`recentlyUpdatedTickets`**: Top 5 tickets owned by requester ordered by `updatedAt DESC`.
- **`recentlyResolvedTickets`**: Top 5 tickets owned by requester with `currentStatus IN ('RESOLVED', 'CLOSED')` ordered by `updatedAt DESC`.

### 9.2 IT Staff Dashboard (`GET /api/dashboard/staff`)
- **`unassignedCount`**: Count of tickets where `primaryOwnerId IS NULL` AND `currentStatus NOT IN ('RESOLVED', 'CLOSED', 'CANCELLED')`.
- **`myTicketsCount`**: Count of tickets where `primaryOwnerId = currentUser.id` AND `currentStatus NOT IN ('CLOSED', 'CANCELLED')`.
- **`statusBreakdown`**: Object mapping each of the 8 statuses to its count across all active service desk tickets.
- **`priorityBreakdown`**: Object mapping `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` to open ticket counts.
- **`myActionsCount`**: Count of `ActionTaken` records where `performedById = currentUser.id`.
- **`recentTickets`**: Top 5 most recently updated tickets across the system.

---

## 10. Acceptance Criteria (Given-When-Then)

- **AC-01 (Create Valid Action Taken):** Given an authenticated IT Staff user, when submitting valid `actionDateTime`, `description`, `result`, and `followUpRequired=false` to `POST /api/tickets/:id/actions-taken`, then the record is saved with `performedById = currentUser.id` and HTTP `201 Created` is returned.
- **AC-02 (Follow-up Note Enforcement):** Given an IT Staff user, when submitting `followUpRequired=true` without a `followUpNote`, then the server rejects the request with HTTP `400 Bad Request`.
- **AC-03 (Requester Action Taken Restriction):** Given an authenticated Requester, when attempting `POST /api/tickets/:id/actions-taken` or `PATCH /api/actions-taken/:id`, then the server rejects with HTTP `403 Forbidden`.
- **AC-04 (Requester Action Taken View):** Given an authenticated Requester, when viewing Ticket Detail for an owned ticket, then all recorded Actions Taken are visible in read-only format without creation or editing controls.
- **AC-05 (Inactive Assignee Rejection):** Given an IT Staff user attempting to record an action attributed to a deactivated user, the operation is rejected with HTTP `400 Bad Request`.
- **AC-06 (Resolution Gate Enforced):** Given a ticket with status `IN_PROGRESS` and 0 Actions Taken, when IT Staff attempts to patch status to `RESOLVED`, then the server rejects the request with HTTP `400 Bad Request` and message indicating actions are required.
- **AC-07 (Resolution Gate Passed):** Given a ticket with status `IN_PROGRESS` and ≥1 recorded Action Taken, when IT Staff patches status to `RESOLVED`, then the ticket status updates to `RESOLVED` and HTTP `200 OK` is returned.
- **AC-08 (Requester Resolved Indication Advisory Only):** Given a Requester toggles "Problem Appears Resolved", the flag is set on the ticket but `currentStatus` remains unchanged.
- **AC-09 (Requester Dashboard Scoping):** Given an authenticated Requester, when calling `GET /api/dashboard/requester`, then the returned metrics and ticket lists contain only data owned by that Requester.
- **AC-10 (Staff Dashboard Metrics Accuracy):** Given an authenticated IT Staff member, when calling `GET /api/dashboard/staff`, then the counts for unassigned, personal tickets, and status breakdown accurately reflect the database state.
- **AC-11 (Dashboard Drill-Down Navigation):** Given a user on either dashboard, when clicking an operational metric card, then the app navigates to the corresponding filtered ticket list.
- **AC-12 (Concurrency Conflict Handling):** Given two clients attempting to edit an Action Taken or update ticket status concurrently, stale submissions are safely detected and rejected without data corruption.
- **AC-13 (Zen Green Responsive Consistency):** Given any Lab 4 screen viewed on Desktop (1280px), Tablet (768px), and Mobile (375px), all content is readable with zero horizontal page scroll (`scrollWidth <= innerWidth`).
- **AC-14 (Full Suite Zero Regression):** Given the entire test suite across Labs 1, 2, 3, and 4, executing `npm test` runs with 100% pass rate.

---

## 11. Definition of Done (Product Completion)

- [ ] All Functional Requirements (FR-01 to FR-13) and Business Rules (BR-01 to BR-19) are verified by automated tests.
- [ ] Database migration runs idempotently with zero data loss on pre-existing records.
- [ ] Backend enforces all role restrictions, resolution gates, and validations (Zero Trust UI).
- [ ] React UI implements Zen Green design language with distinct read-only and editable fields.
- [ ] Responsive layouts verified across Desktop (1280px), Tablet (768px), and Mobile (375px) with zero horizontal overflow.
- [ ] 100% automated test pass rate across Server API tests, Client Component tests, and Playwright E2E suites.
- [ ] Complete traceability between Acceptance Criteria (AC-01..14) and automated test files.
- [ ] All PRs peer-reviewed and merged into `lab4-staging` before Release PR to `main`.
