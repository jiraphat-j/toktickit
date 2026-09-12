# Lab 3 Sprint Engineering Specification
### TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens

---

## 1. Sprint Goal

Evolve TokTickIT from the Lab 2 requester-only MVP into a multi-role enterprise service desk application. Replace the temporary Development Requester testing selector with real email/password authentication and mandatory first-login password change. Enforce server-side role-based access control (RBAC) across three distinct roles (**Requester**, **IT Staff**, **Administrator**). Preserve all existing Lab 2 Requester data and workflows while delivering an operational IT Staff Ticket Queue with claiming and permitted status transitions, distinct Public Comments and Internal Notes, and a minimal, protected Administrator User Management module — all built with responsive Zen Green UI consistency.

---

## 2. Stakeholder Request Interpretation

The stakeholder requires a complete transition from development simulation to production-grade access control and operational ticketing:
1. **Authentication & Identity:** Replace the testing selector with secure email/password credentials. Any account issued an initial password must be forced to choose a new password upon first login before accessing application features.
2. **Requester Regression & Empowerment:** Requesters must retain full access to their existing tickets and attachments under their authenticated identity. They can post Public Comments on their tickets and signal that their problem "appears resolved", but they cannot formally alter ticket status to `Resolved` or `Closed`.
3. **IT Staff Operations:** IT Staff need a centralized Ticket Queue to find unassigned or assigned work, filter/sort/search tickets, open Ticket Detail, claim or reassign primary ownership, set operational IT Priority, execute permitted ticket status transitions, communicate with requesters via Public Comments, and record private Internal Notes hidden from requesters.
4. **Administrator Governance:** Administrators require a streamlined User Management interface to list, search, filter, create, and update user accounts, assign exactly one role per user, activate/deactivate accounts, and issue new initial passwords. The system must guard against administrator self-deactivation and deactivating the last active administrator.
5. **Security & Design Integrity:** Authorization must be enforced strictly on the backend (hiding a button is not security). All UI enhancements must adhere to the Zen Green design system established in Lab 2.

---

## 3. Scope

### Included
- **User Authentication:** Email + password login, session establishment via secure HttpOnly cookie, logout with session invalidation, current authenticated user endpoint (`/api/auth/me`).
- **Mandatory Password Change:** Forced password change on first login for accounts with initial passwords before entering main screens.
- **Role-Based Access Control (RBAC):** Server-side enforcement for `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`.
- **Requester Continuity:** Seamless migration of Lab 2 ticket and attachment ownership to real User records; removal of `X-Dev-Requester-Id` header in favor of server-verified session context.
- **Requester Problem Resolution Indication:** Requester can toggle/mark that a ticket appears resolved without formal status mutation permissions.
- **Communication Channels:**
  - **Public Comments:** Append-only, visible to owning Requester, IT Staff, and Administrator.
  - **Internal Notes:** Append-only, visible strictly to IT Staff and Administrator; completely hidden and forbidden to Requesters.
- **IT Staff Ticket Queue:** Multi-column view with search, filters (category, status, priority, assignment), sorting, pagination, and empty/no-results states.
- **IT Staff Ticket Detail:** Primary owner claim/assignment, IT Priority assignment, permitted status transitions, attachment continuity.
- **Administrator User Management:** Searchable/filterable user directory, user creation, account updating (name, email, role, status), initial password reset, admin self-deactivation protection, last-active-admin safeguard.
- **Zen Green UI & Responsive Layouts:** Uniform look across desktop (≥992px), tablet (768–991px), and mobile (<768px).

### Explicitly Excluded
- Self-registration / public sign-up
- Email delivery, automated email invitations, password-reset emails
- Multi-factor authentication (MFA)
- Single Sign-On (SSO) / OAuth / Social login
- Multi-role assignments (each user has exactly one role)
- Hard physical deletion of User records (deactivation is used instead)
- Bulk user operations, import/export (CSV/Excel)
- Departments, teams, organizations, profile avatars
- "Actions Taken" structured checklists
- SLA management, timers, automated escalation engines, notifications (email/push/SMS)
- Production/cloud deployment changes
- Advanced KPI analytics or reporting dashboards

---

## 4. Functional Requirements

| ID | Requirement |
|---|---|
| **FR-01** | The system shall allow users to authenticate using a valid email and password. |
| **FR-02** | The system shall force users with `mustChangePassword = true` to change their password immediately after login before accessing any other screen. |
| **FR-03** | The system shall provide a current user endpoint returning the authenticated user's profile and assigned role. |
| **FR-04** | The system shall allow authenticated users to log out, terminating their active session. |
| **FR-05** | The system shall replace the client-selected Development Requester with authenticated server identity across all ticketing operations. |
| **FR-06** | The system shall allow a Requester to view, search, and filter only tickets they own. |
| **FR-07** | The system shall allow a Requester to indicate that a reported issue appears resolved on their owned ticket. |
| **FR-08** | The system shall allow Requesters, IT Staff, and Administrators to post and view Public Comments on a ticket. |
| **FR-09** | The system shall allow IT Staff and Administrators to post and view Internal Notes on a ticket, while strictly prohibiting Requester access. |
| **FR-10** | The system shall provide IT Staff and Administrators with a searchable, filterable, sortable, and paginated Ticket Queue. |
| **FR-11** | The system shall allow IT Staff and Administrators to claim or reassign primary ownership of a ticket. |
| **FR-12** | The system shall allow IT Staff and Administrators to update the operational IT Priority of a ticket. |
| **FR-13** | The system shall allow IT Staff and Administrators to advance a ticket through permitted workflow status transitions. |
| **FR-14** | The system shall allow Administrators to view, search, and filter the user directory. |
| **FR-15** | The system shall allow Administrators to create new user accounts with an initial password and assigned role. |
| **FR-16** | The system shall allow Administrators to update user details, toggle account activation, and reset initial passwords. |
| **FR-17** | The system shall prevent an Administrator from deactivating their own account or the last active Administrator account. |
| **FR-18** | The system shall maintain complete regression compatibility for Lab 2 ticket creation, attachment upload, download, and soft-removal. |

---

## 5. Business Rules

| ID | Rule |
|---|---|
| **BR-01** | Only active accounts (`isActive = true`) with matching credentials can authenticate. Inactive accounts receive generic 401 Unauthorized. |
| **BR-02** | Password storage must use salted hashing (bcrypt, salt rounds ≥ 10). Plaintext passwords must never be stored or logged. |
| **BR-03** | Passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit. |
| **BR-04** | An account with `mustChangePassword = true` cannot access any protected API or view except `/api/auth/change-password`, `/api/auth/me`, and `/api/auth/logout`. |
| **BR-05** | Successful password change clears `mustChangePassword` to `false` and immediately admits the user to normal application features. |
| **BR-06** | Session identity is managed server-side via signed, HttpOnly, SameSite cookies. The client cannot forge or dictate user ID or role. |
| **BR-07** | Each user has exactly one assigned role: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`. |
| **BR-08** | Email addresses are case-insensitive and stored normalized in lowercase. Duplicate email addresses are rejected with `409 Conflict`. |
| **BR-09** | Requesters can only view, manage, and attach files to tickets where `requesterId == currentUser.id`. Accessing another user's ticket returns `404 Not Found`. |
| **BR-10** | Requesters can mark `problemAppearsResolved = true` on their own tickets, but cannot alter `currentStatus` directly. |
| **BR-11** | Ticket Primary Owner (`primaryOwnerId`) can be `null` (unassigned) or assigned only to an active user with role `IT_STAFF` or `ADMINISTRATOR`. |
| **BR-12** | `requestedPriority` is submitted by the Requester at ticket creation and is immutable thereafter. |
| **BR-13** | `itPriority` is initially cloned from `requestedPriority` at creation, and may subsequently be modified only by IT Staff or Administrator. |
| **BR-14** | Permitted ticket statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`. |
| **BR-15** | Status transitions must conform strictly to the defined Status Transition Matrix. Invalid transitions are rejected with `400 Bad Request`. |
| **BR-16** | Public Comments and Internal Notes are strictly append-only. No user can edit or delete an existing comment or note. |
| **BR-17** | Comment and note content must be 1–2000 characters after trimming whitespace. Empty or whitespace-only submissions are rejected with `400 Bad Request`. |
| **BR-18** | Internal Notes are strictly confidential to IT Staff and Administrators. Requesters attempting to view or submit internal notes receive `403 Forbidden` (or `404 Not Found`). |
| **BR-19** | User deletion is prohibited; user accounts can only be deactivated (`isActive = false`). |
| **BR-20** | An Administrator cannot deactivate their own active account (`self-deactivation prevention`). |
| **BR-21** | An Administrator cannot deactivate or reassign the role of the system's last active Administrator (`last-active-admin protection`). |
| **BR-22** | Setting a new initial password for a user automatically sets `mustChangePassword = true` for that user. |
| **BR-23** | Ticket Queue pagination defaults to 10 items/page (options: 10, 25, 50). Sorting defaults to `createdAt DESC, id DESC`. |
| **BR-24** | The Development Requester selector UI and `X-Dev-Requester-Id` header are permanently retired and replaced by authenticated sessions. |

---

## 6. Role-Based Authorization Matrix

| Action / Capability | Requester | IT Staff | Administrator |
|---|:---:|:---:|:---:|
| Login / Logout / Change Own Password | ✅ | ✅ | ✅ |
| View Own Tickets & Details | ✅ | ✅ (Own created) | ✅ (Own created) |
| Create Ticket & Upload Attachment | ✅ | ✅ | ✅ |
| Soft-remove Own Attachment | ✅ | ❌ | ❌ |
| Indicate Problem Appears Resolved | ✅ (Own ticket) | ❌ | ❌ |
| View / Post Public Comments | ✅ (Own ticket) | ✅ (All tickets) | ✅ (All tickets) |
| View / Post Internal Notes | ❌ (Forbidden) | ✅ | ✅ |
| View IT Staff Ticket Queue | ❌ | ✅ | ✅ |
| Claim / Reassign Ticket Owner | ❌ | ✅ | ✅ |
| Update IT Priority | ❌ | ✅ | ✅ |
| Change Ticket Status | ❌ | ✅ | ✅ |
| Formally Resolve / Close Ticket | ❌ | ✅ | ✅ |
| View / Search User Management List | ❌ | ❌ | ✅ |
| Create New User Account | ❌ | ❌ | ✅ |
| Edit User Account & Toggle Active | ❌ | ❌ | ✅ |
| Reset User Initial Password | ❌ | ❌ | ✅ |

---

## 7. Ticket Workflow & Status Transition Matrix

```
          [ NEW ]
             │
             ├───────────────┬────────────────┐
             ▼               ▼                ▼
          [ OPEN ] ───► [ IN_PROGRESS ] ──► [ CANCELLED ]
             │               ▲   │
             │               │   ▼
             │       [ WAITING_FOR_REQUESTER ]
             │               │
             ▼               ▼
         [ RESOLVED ] ◄──────┘
             │   ▲
             ▼   │
          [ CLOSED ]
             │
             ▼
         [ REOPENED ] ──► [ IN_PROGRESS ] / [ OPEN ]
```

### Detailed Transition Rules

| Current Status | Allowed Target Statuses | Authorized Roles |
|---|---|:---:|
| `NEW` | `OPEN`, `IN_PROGRESS`, `CANCELLED` | IT Staff, Admin |
| `OPEN` | `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Admin |
| `IN_PROGRESS` | `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED` | IT Staff, Admin |
| `WAITING_FOR_REQUESTER` | `IN_PROGRESS`, `RESOLVED`, `CANCELLED` | IT Staff, Admin |
| `RESOLVED` | `CLOSED`, `REOPENED` | IT Staff, Admin |
| `CLOSED` | `REOPENED` | IT Staff, Admin |
| `REOPENED` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED` | IT Staff, Admin |
| `CANCELLED` | `REOPENED` | IT Staff, Admin |

*Note:* Requesters cannot execute any status transitions above. They may only set the `problemAppearsResolved` flag.

---

## 8. Data Model Evolution (Prisma Schema)

Existing tables `Category`, `RelatedSystem`, `Ticket`, `Attachment`, and `TicketCreationRequest` are preserved. `DevRequester` is evolved into `User`.

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum TicketStatus {
  NEW
  OPEN
  IN_PROGRESS
  WAITING_FOR_REQUESTER
  RESOLVED
  CLOSED
  REOPENED
  CANCELLED
}

model User {
  id                 Int              @id @default(autoincrement())
  email              String           @unique
  passwordHash       String
  fullName           String
  role               Role             @default(REQUESTER)
  isActive           Boolean          @default(true)
  mustChangePassword Boolean          @default(true)
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  // Relationships
  requestedTickets   Ticket[]         @relation("TicketRequester")
  ownedTickets       Ticket[]         @relation("TicketOwner")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]

  @@index([email])
  @@index([role])
  @@index([isActive])
}

// Updated Ticket Model
model Ticket {
  id                     Int              @id @default(autoincrement())
  ticketNumber           String           @unique
  requesterId            Int
  requester              User             @relation("TicketRequester", fields: [requesterId], references: [id])
  primaryOwnerId         Int?
  primaryOwner           User?            @relation("TicketOwner", fields: [primaryOwnerId], references: [id])
  categoryId             Int
  category               Category         @relation(fields: [categoryId], references: [id])
  relatedSystemId        Int
  relatedSystem          RelatedSystem    @relation(fields: [relatedSystemId], references: [id])
  summary                String
  description            String
  requestedPriority      Priority         @default(MEDIUM)
  itPriority             Priority         @default(MEDIUM)
  currentStatus          TicketStatus     @default(NEW)
  problemAppearsResolved Boolean          @default(false)
  createdAt              DateTime         @default(now())
  updatedAt              DateTime         @updatedAt

  attachments            Attachment[]
  publicComments         PublicComment[]
  internalNotes          InternalNote[]

  @@index([requesterId])
  @@index([primaryOwnerId])
  @@index([currentStatus])
  @@index([itPriority])
  @@index([createdAt])
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId])
}
```

---

## 9. API Contract Summary

Full specifications are in `docs/lab-03/api-spec.md`. Key routes include:
- `POST /api/auth/login`: Authenticate with email/password; returns user context and sets session.
- `POST /api/auth/logout`: Clears session cookie.
- `GET /api/auth/me`: Retrieves current session profile.
- `POST /api/auth/change-password`: Updates password and clears `mustChangePassword`.
- `GET /api/tickets`: Requester ticket list (scoped to authenticated requester).
- `GET /api/staff/tickets`: IT Staff ticket queue with search, multi-filters, sorting, pagination.
- `GET /api/tickets/:id`: Ticket detail with RBAC checking.
- `PATCH /api/staff/tickets/:id/owner`: Claim or assign primary ticket owner.
- `PATCH /api/staff/tickets/:id/priority`: Update operational IT priority.
- `PATCH /api/staff/tickets/:id/status`: Mutate ticket status with workflow validation.
- `POST /api/tickets/:id/resolve-indication`: Requester toggles problem resolved indicator.
- `GET /api/tickets/:id/comments` & `POST /api/tickets/:id/comments`: Public comments thread.
- `GET /api/tickets/:id/internal-notes` & `POST /api/tickets/:id/internal-notes`: Internal notes thread (Staff/Admin only).
- `GET /api/admin/users`: User management directory with search/role filters.
- `POST /api/admin/users`: Create user account with initial password.
- `PATCH /api/admin/users/:id`: Edit user details / toggle active status.
- `POST /api/admin/users/:id/reset-password`: Set new initial password.

---

## 10. Numbered Acceptance Criteria

| ID | Acceptance Criterion |
|---|---|
| **AC-01** | User can authenticate with valid email and password; inactive accounts receive 401 Unauthorized. |
| **AC-02** | User with `mustChangePassword = true` is blocked from application screens until a valid new password is confirmed and saved. |
| **AC-03** | Changing password requires meeting minimum complexity rules (≥8 chars, uppercase, lowercase, number) and identical confirmation. |
| **AC-04** | User can log out at any time, immediately clearing session state and preventing back-navigation to protected views. |
| **AC-05** | Authenticated shell renders the user's full name, role badge, and role-appropriate navigation bar. |
| **AC-06** | Requesters can create tickets and manage attachments with identity automatically derived from the session (no selector). |
| **AC-07** | Requesters can view only their owned tickets; attempting to access another user's ticket returns 404 Not Found. |
| **AC-08** | Requester can mark "Problem Appears Resolved" on their ticket without altering formal status dropdowns. |
| **AC-09** | Requesters, IT Staff, and Admins can post Public Comments (1–2000 chars) that render in chronological order with author name and timestamp. |
| **AC-10** | IT Staff and Admins can post and view private Internal Notes with distinct visual styling (amber caution border). |
| **AC-11** | Requesters attempting to view or post Internal Notes receive 403 Forbidden or 404 Not Found; no note content is leaked. |
| **AC-12** | IT Staff can view the Ticket Queue with search, category/status/priority/owner filters, column sorting, and pagination. |
| **AC-13** | IT Staff can claim an unassigned ticket or reassign primary ownership to another active IT Staff or Administrator. |
| **AC-14** | IT Staff can update IT Priority independently of the Requester's original Requested Priority. |
| **AC-15** | IT Staff can advance ticket status only through permitted transitions defined in the workflow matrix. |
| **AC-16** | Administrator can access User Management to browse all users, search by name/email, and filter by role. |
| **AC-17** | Administrator can create a new user account with one assigned role and an initial password (`mustChangePassword = true`). |
| **AC-18** | Duplicate email registrations are rejected with a clear 409 Conflict validation error. |
| **AC-19** | Administrator can edit user details, toggle active/inactive status, and set a new initial password. |
| **AC-20** | System strictly blocks an Administrator from deactivating their own account or deactivating the last active Administrator. |
| **AC-21** | Non-administrator users navigating to `/admin/users` receive 403 Forbidden and cannot perform administrative mutations. |
| **AC-22** | All new and modified screens display responsive layouts across Desktop, Tablet, and Mobile without horizontal overflow. |

---

## 11. Product Definition of Done

1. **Specification & Contracts:** Spec DD, API Spec, UI Spec, and Test DD are merged before major implementation.
2. **Data Model Integrity:** Database migration smoothly transitions existing tickets/attachments to real users without data loss.
3. **Automated Verification:** All server API tests, client component tests, Lab 2 regression tests, and Playwright E2E suites pass with 100% success rate.
4. **Security & RBAC:** Direct endpoint authorization verifies that hidden UI controls cannot be bypassed.
5. **Zen Green Design:** Design tokens, badges, accessible focus indicators, and responsive views adhere to the visual specification.
6. **Peer Review Evidence:** Every feature branch is reviewed and approved through PRs on `lab3-staging` before final integration to `main`.

---

## 12. Assumptions and Decisions

1. **Authentication Architecture:** Signed session cookie using `express-session` or signed HttpOnly cookies containing user claims, avoiding localStorage token vulnerabilities.
2. **Password Security:** `bcryptjs` with 10 salt rounds for hashing.
3. **Requester Migration:** Lab 2 `DevRequester` records are migrated directly into `User` with role `REQUESTER` and an initial password, preserving all foreign key references.
4. **Idempotent Seed:** Seeds at least 4 active Requesters, 1 inactive Requester, 3 active IT Staff, 1 inactive IT Staff, and 1 active Administrator.
