# Lab 3 Test Plan and Traceability
### TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens

---

## 1. Test Strategy

| Test Level | Framework / Tool | Scope & Purpose |
|---|---|---|
| **Unit & Utility Tests** | Vitest | Password hash helpers, session validation, status transition matrix validator, query filters |
| **API / Integration Tests** | Supertest + Vitest | Express REST endpoints, Prisma queries, auth session middleware, RBAC guards, status transitions, comments/notes, admin CRUD |
| **Security & Authorization Tests** | Supertest + Vitest | Server-side role boundary enforcement, Requester ➔ Internal Note rejection (403), Admin self-deactivation & last-admin protection |
| **UI Component & Style Tests** | Vitest + React Testing Library | Login, Change Password, Staff Ticket Queue, Staff Ticket Detail, User Management, Zen Green tokens, validation messages, busy states |
| **Regression Tests** | Supertest + Vitest | Preserving Lab 1 health/category APIs and Lab 2 Ticket Creation, Idempotency, Attachments, and My Tickets |
| **End-to-End (E2E) Tests** | Playwright | Full multi-role journeys (Authentication, Staff Workflow, Admin User Management) across Desktop, Tablet, and Mobile viewports |

---

## 2. Planned & Executed Tests Table

| Test ID | Level | AC / BR | Scenario / What It Tests | Expected Result | Automated Test File | Status |
|:---:|:---:|:---:|---|---|---|:---:|
| **AUTH-01** | API | AC-01, BR-01 | `POST /api/auth/login` with valid email and password | Returns user context and sets signed HttpOnly session cookie | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-02** | API | AC-01, BR-01 | `POST /api/auth/login` with invalid password or unregistered email | Returns generic `401 Unauthorized` without revealing account existence | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-03** | API | AC-01, BR-01 | `POST /api/auth/login` with inactive account (`isActive = false`) | Returns generic `401 Unauthorized` | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-04** | API | AC-03, BR-03 | Password complexity validation (length ≥ 8, uppercase, lowercase, number) | Rejects weak passwords with `400 Bad Request` | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-05** | API | AC-02, BR-04 | User with `mustChangePassword = true` accessing normal endpoints | Blocked with `403 Forbidden` (`PASSWORD_CHANGE_REQUIRED`) until password changed | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-06** | API | AC-02, BR-05 | `POST /api/auth/change-password` with valid new password and match | Updates password hash, sets `mustChangePassword = false`, returns `200` | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-07** | API | AC-04, BR-06 | `GET /api/auth/me` with active session vs expired session | Valid session returns profile; expired/absent session returns `401` | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **AUTH-08** | API | AC-04, BR-06 | `POST /api/auth/logout` terminates active session | Clears cookie and invalidates subsequent requests with `401` | `server/tests/lab-03/auth.api.test.ts` | **Planned** |
| **SEC-01** | Security | AC-05, BR-07 | Role-based endpoint authorization matrix | Requesters forbidden from staff/admin routes; staff forbidden from admin routes | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **SEC-02** | Security | AC-07, BR-09 | Requester ticket ownership isolation | Accessing another requester's ticket returns `404 Not Found` | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **SEC-03** | Security | AC-06, BR-24 | Client-supplied `requesterId` in request body is ignored | Requester identity is strictly derived from authenticated session | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **SEC-04** | Security | AC-11, BR-18 | Requester direct access to `GET /api/tickets/:id/internal-notes` | Returns `403 Forbidden` without leaking note content | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **SEC-05** | Security | AC-20, BR-20 | Administrator self-deactivation prevention | Admin deactivating own account returns `400 Bad Request` | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **SEC-06** | Security | AC-20, BR-21 | Last active Administrator protection | Deactivating or demoting the last active admin returns `400 Bad Request` | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **REQ-01** | API | AC-06, BR-09 | Requester creates ticket and uploads attachment under authenticated session | Successfully creates ticket bound to authenticated user | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **REQ-02** | API | AC-07, BR-09 | Requester lists own tickets (`GET /api/tickets`) | Returns only tickets where `requesterId == currentUser.id` | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **REQ-03** | API | AC-08, BR-10 | Requester marks problem as resolved (`POST /api/tickets/:id/resolve-indication`) | Sets `problemAppearsResolved = true` without modifying `currentStatus` | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **REQ-04** | API | AC-08, BR-10 | Requester attempts direct `PATCH /api/staff/tickets/:id/status` | Returns `403 Forbidden` | `server/tests/lab-03/authorization.api.test.ts` | **Planned** |
| **STF-01** | API | AC-12, BR-23 | IT Staff Ticket Queue query (`GET /api/staff/tickets`) with search | Matches ticket number or summary case-insensitively | `server/tests/lab-03/staff-queue.api.test.ts` | **Planned** |
| **STF-02** | API | AC-12, BR-23 | IT Staff Ticket Queue multi-filter (category, status, priority, owner) | Combines filters with AND logic; supports unassigned filter | `server/tests/lab-03/staff-queue.api.test.ts` | **Planned** |
| **STF-03** | API | AC-12, BR-23 | IT Staff Ticket Queue sorting and pagination | Default `createdAt DESC, id DESC`; returns valid pagination metadata | `server/tests/lab-03/staff-queue.api.test.ts` | **Planned** |
| **STF-04** | API | AC-12, BR-23 | IT Staff Ticket Queue invalid query parameters | Non-integer page or invalid sort field returns `400 Bad Request` | `server/tests/lab-03/staff-queue.api.test.ts` | **Planned** |
| **STF-05** | API | AC-13, BR-11 | Claim ticket or reassign primary owner (`PATCH /api/staff/tickets/:id/owner`) | Updates `primaryOwnerId`; rejects inactive users or requesters as owner | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Planned** |
| **STF-06** | API | AC-14, BR-13 | Update operational IT Priority (`PATCH /api/staff/tickets/:id/priority`) | Updates `itPriority` without altering original `requestedPriority` | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Planned** |
| **STF-07** | API | AC-15, BR-15 | Permitted status transitions (`NEW` ➔ `OPEN` ➔ `IN_PROGRESS` ➔ `RESOLVED`) | Successfully transitions ticket through permitted workflow states | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Planned** |
| **STF-08** | API | AC-15, BR-15 | Illegal status transitions (e.g. `NEW` ➔ `RESOLVED` directly) | Rejected with `400 Bad Request` (`ILLEGAL_STATUS_TRANSITION`) | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | **Planned** |
| **COM-01** | API | AC-09, BR-16 | Public Comments creation and retrieval (`/comments`) | Chronological order, author attribution, append-only enforcement | `server/tests/lab-03/comments-notes.api.test.ts` | **Planned** |
| **COM-02** | API | AC-10, BR-16 | Internal Notes creation and retrieval (`/internal-notes`) by Staff/Admin | Stored securely, author attribution, visible only to Staff/Admin | `server/tests/lab-03/comments-notes.api.test.ts` | **Planned** |
| **COM-03** | API | AC-09, BR-17 | Comment/Note length validation (1–2000 chars, whitespace trimming) | Empty or whitespace-only content rejected with `400 Bad Request` | `server/tests/lab-03/comments-notes.api.test.ts` | **Planned** |
| **ADM-01** | API | AC-16, BR-07 | List users with search by name/email and role filter (`GET /api/admin/users`) | Returns paginated user accounts matching criteria | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **ADM-02** | API | AC-17, BR-08 | Create user with single role and initial password (`POST /api/admin/users`) | Creates account with `mustChangePassword = true`; rejects duplicate email | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **ADM-03** | API | AC-19, BR-19 | Edit user details and toggle active status (`PATCH /api/admin/users/:id`) | Updates name, email, role, or active status (deactivation used over delete) | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **ADM-04** | API | AC-19, BR-22 | Reset initial password (`POST /api/admin/users/:id/reset-password`) | Sets new password hash and flags `mustChangePassword = true` | `server/tests/lab-03/users-admin.api.test.ts` | **Planned** |
| **UI-01** | UI | AC-01, AC-05 | Login screen rendering, field validation, and busy state | Inline error validation on empty submit; busy spinner during request | `client/tests/lab-03/Login.test.tsx` | **Planned** |
| **UI-02** | UI | AC-02, AC-03 | Mandatory Change Password screen validation and submission | Complexity feedback; blocks navigation until valid password saved | `client/tests/lab-03/ChangePassword.test.tsx` | **Planned** |
| **UI-03** | UI | AC-12, AC-22 | IT Staff Ticket Queue table/cards, search, filter, and pagination | Filter interactions, sorting toggles, badges, and empty/no-results states | `client/tests/lab-03/StaffTicketQueue.test.tsx` | **Planned** |
| **UI-04** | UI | AC-13, AC-14, AC-15 | IT Staff Ticket Detail claiming, IT priority, status actions, dual threads | Contextual actions, distinct Zen Green comments vs Amber Internal Notes | `client/tests/lab-03/StaffTicketDetail.test.tsx` | **Planned** |
| **UI-05** | UI | AC-16, AC-17, AC-20 | Admin User Management directory, modals, and guardrails | Create/Edit modals, duplicate email warning, self-deactivation disabled | `client/tests/lab-03/UserManagement.test.tsx` | **Planned** |
| **E2E-01** | E2E | AC-01..05 | Authentication, first password change, shell display, and logout | End-to-end browser authentication flow with session verification | `e2e/lab-03/authentication.spec.ts` | **Planned** |
| **E2E-02** | E2E | AC-12..15 | IT Staff Ticket flow (Queue ➔ Detail ➔ Claim ➔ Workflow ➔ Comments/Notes) | Operational staff lifecycle journey across desktop and mobile | `e2e/lab-03/staff-ticket-flow.spec.ts` | **Planned** |
| **E2E-03** | E2E | AC-16..21 | Administrator user governance flow and access denial for non-admins | User creation, edit, password reset, self-deactivation block, 403 test | `e2e/lab-03/user-administration.spec.ts` | **Planned** |
| **REG-01** | Regression | AC-18 | Full Lab 1 & Lab 2 regression suite | Verification that all prior ticket creation, attachment, and reference APIs pass | `server/tests/lab-02/` & `client/tests/lab-02/` | **Planned** |

---

## 3. Acceptance Criteria Traceability Matrix (AC-01 to AC-22)

| AC ID | Acceptance Criterion Description | Covered By Planned Automated Tests |
|:---:|---|---|
| **AC-01** | Valid login establishes session; invalid/inactive accounts return 401 | `AUTH-01`, `AUTH-02`, `AUTH-03`, `UI-01`, `E2E-01` |
| **AC-02** | User with `mustChangePassword = true` blocked from normal screens | `AUTH-05`, `AUTH-06`, `UI-02`, `E2E-01` |
| **AC-03** | Password change enforces complexity rules (≥8 chars, uppercase, lowercase, digit) | `AUTH-04`, `AUTH-06`, `UI-02` |
| **AC-04** | Logout invalidates session and prevents back-navigation | `AUTH-07`, `AUTH-08`, `E2E-01` |
| **AC-05** | Authenticated shell renders user full name, role badge, and role navigation | `SEC-01`, `UI-01`, `E2E-01` |
| **AC-06** | Requester ticket operations derive identity from session (no selector) | `SEC-03`, `REQ-01`, `REG-01` |
| **AC-07** | Requester views only owned tickets; cross-requester access returns 404 | `SEC-02`, `REQ-02`, `REG-01` |
| **AC-08** | Requester indicates problem resolved without modifying formal status | `REQ-03`, `REQ-04` |
| **AC-09** | Public Comments (1–2000 chars) render chronologically with author & time | `COM-01`, `COM-03`, `UI-04`, `E2E-02` |
| **AC-10** | Internal Notes render with distinct Amber Warning styling (private to Staff/Admin) | `COM-02`, `UI-04`, `E2E-02` |
| **AC-11** | Requesters forbidden from viewing or posting Internal Notes (403 Forbidden) | `SEC-04`, `COM-02`, `E2E-02` |
| **AC-12** | IT Staff Ticket Queue with search, multi-filter, sorting, and pagination | `STF-01`, `STF-02`, `STF-03`, `STF-04`, `UI-03`, `E2E-02` |
| **AC-13** | IT Staff can claim ticket or reassign primary owner to active staff/admin | `STF-05`, `UI-04`, `E2E-02` |
| **AC-14** | IT Staff can update operational IT Priority independently of requested priority | `STF-06`, `UI-04`, `E2E-02` |
| **AC-15** | IT Staff advances ticket status strictly through permitted workflow transitions | `STF-07`, `STF-08`, `UI-04`, `E2E-02` |
| **AC-16** | Administrator User Management lists users with search and role filter | `ADM-01`, `UI-05`, `E2E-03` |
| **AC-17** | Administrator creates user with one role and initial password | `ADM-02`, `UI-05`, `E2E-03` |
| **AC-18** | Duplicate email registrations rejected with 409 Conflict | `ADM-02`, `UI-05` |
| **AC-19** | Administrator edits user details, toggles active, and resets initial password | `ADM-03`, `ADM-04`, `UI-05`, `E2E-03` |
| **AC-20** | Administrator self-deactivation and last active admin lockout strictly prevented | `SEC-05`, `SEC-06`, `UI-05`, `E2E-03` |
| **AC-21** | Non-administrators navigating to user management receive 403 Forbidden | `SEC-01`, `E2E-03` |
| **AC-22** | Responsive layouts across Desktop, Tablet, and Mobile with zero overflow | `UI-03`, `UI-04`, `UI-05`, `E2E-01`, `E2E-02`, `E2E-03` |

---

## 4. Test Commands

```powershell
# Run Client unit and component tests
npm --prefix client test

# Run Server API and integration tests
npm --prefix server test

# Run complete Vitest suite (Client + Server)
npm test

# Run Playwright End-to-End tests
npx playwright test

# Run all test suites
npm run test:all
```
