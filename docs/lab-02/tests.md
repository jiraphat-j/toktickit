# Lab 2 Test Plan and Traceability
### TokTickIT — Requester Ticketing MVP with UI Foundation

---

## 1. Test Strategy

| Test Level | Framework / Tool | Scope & Purpose |
|---|---|---|
| **Unit Tests** | Vitest | Validation helpers, Ticket Number format generator, date/time formatting utilities, idempotency hasher |
| **API / Integration Tests** | Supertest + Vitest | Express REST endpoints, Prisma queries, context middleware, multipart upload, ownership isolation, error codes |
| **UI Component & Style Tests** | Vitest + React Testing Library | React screens, field validation messages, busy states, theme tokens, empty/loading states, keyboard navigation |
| **E2E & Responsive Tests** | Playwright | Full end-to-end user workflows (Requester Select ➔ Create Ticket ➔ My Tickets ➔ Detail & Attachments) across Desktop, Tablet, and Mobile viewports |

---

## 2. Planned & Executed Tests Table

| Test ID | Level | AC / BR | Scenario / What It Tests | Expected Result | Automated Test File | Status |
|:---:|:---:|:---:|---|---|---|:---:|
| **API-01** | API | AC-24, AC-31 | `GET /api/dev-requesters` | Returns only active requesters in `id asc` order | `server/tests/lab-02/dev-requesters.api.test.ts` | **Pass** |
| **API-02** | API | AC-27 | Request with inactive or missing `X-Dev-Requester-Id` | Returns `400 Bad Request` | `server/tests/lab-02/dev-requesters.api.test.ts` | **Pass** |
| **API-03** | API | AC-31 | `GET /api/categories` and `GET /api/related-systems` | Returns active reference records only | `server/tests/lab-02/reference-data.api.test.ts` | **Pass** |
| **API-04** | API | AC-01, BR-01 | `POST /api/tickets` with valid payload | Creates ticket, generates `TKT-YYYY-XXXXXX`, status `NEW`, returns `201` | `server/tests/lab-02/create-ticket.api.test.ts` | **Pass** |
| **API-05** | API | AC-02, AC-03 | `POST /api/tickets` with missing summary or description > 2000 chars | Returns `400 Bad Request` with field error details | `server/tests/lab-02/create-ticket.api.test.ts` | **Pass** |
| **API-06** | API | AC-05, BR-14 | `POST /api/tickets` with duplicate `Idempotency-Key` | Repeated identical payload returns existing ticket; different payload returns `409` | `server/tests/lab-02/create-ticket.api.test.ts` | **Pass** |
| **API-07** | API | AC-16, AC-17, AC-26 | `GET /api/tickets` search, filter, and sort | Returns filtered/sorted paginated items matching criteria | `server/tests/lab-02/my-tickets.api.test.ts` | **Pass** |
| **API-08** | API | AC-22, AC-23 | `GET /api/tickets` cross-requester ownership | Requester B cannot see Requester A's tickets | `server/tests/lab-02/my-tickets.api.test.ts` | **Pass** |
| **API-09** | API | AC-33 | `GET /api/tickets` with invalid query parameters | Returns `400 Bad Request` | `server/tests/lab-02/my-tickets.api.test.ts` | **Pass** |
| **API-10** | API | AC-21, AC-22 | `GET /api/tickets/:id` owned vs unowned | Owned ticket returns `200`; unowned ticket returns `404 Not Found` | `server/tests/lab-02/ticket-detail.api.test.ts` | **Pass** |
| **API-11** | API | AC-08, AC-11 | `POST /api/tickets/:id/attachments` valid upload & 5-item limit | Valid upload returns `201`; 6th active upload returns `400` | `server/tests/lab-02/attachments.api.test.ts` | **Pass** |
| **API-12** | API | AC-09, AC-10 | `POST /api/tickets/:id/attachments` invalid file type or > 5MB | Invalid type returns `415`; oversized returns `413` | `server/tests/lab-02/attachments.api.test.ts` | **Pass** |
| **API-13** | API | AC-12, AC-32 | `GET /api/attachments/:id/download` | Active file downloads `200`; removed file returns `404` | `server/tests/lab-02/attachments.api.test.ts` | **Pass** |
| **API-14** | API | AC-13, AC-14, AC-15 | `PATCH /api/attachments/:id/remove` | Soft-removes with reason, frees active slot, metadata retained | `server/tests/lab-02/attachments.api.test.ts` | **Pass** |
| **API-15** | API | AC-34 | `POST`/`GET`/`PATCH` attachments for ticket owned by another requester | Returns `404 Not Found` | `server/tests/lab-02/attachments.api.test.ts` | **Pass** |
| **UI-01** | UI | AC-24, AC-25, AC-26, AC-30 | Requester Selector loading, rendering active list, empty, safe error, keyboard focus | Renders appropriate state based on API response; supports keyboard navigation | `client/tests/lab-02/RequesterSelector.test.tsx` | **Pass** |
| **UI-02** | UI | AC-31, AC-35 | Requester context persistence & reload | Selected ID saved to `sessionStorage` and restored on reload; Change Requester clears view | `client/tests/lab-02/RequesterSelector.test.tsx` | **Pass** |
| **UI-03** | UI | AC-02, AC-03 | Create Ticket form client validation | Inline error messages displayed below invalid inputs; file validation | `client/tests/lab-02/CreateTicket.test.tsx` | **Pass** |
| **UI-04** | UI | AC-04, AC-06 | Create Ticket busy submission and failure handling | Submit disabled while loading; server error preserves form inputs | `client/tests/lab-02/CreateTicket.test.tsx` | **Pass** |
| **UI-05** | UI | AC-01, AC-07 | Create Ticket success view | Displays generated Ticket Number & action buttons; partial attachment retry | `client/tests/lab-02/CreateTicket.test.tsx` | **Pass** |
| **UI-06** | UI | AC-16, AC-17, AC-18 | My Tickets query controls & pagination | Updates query params, triggers refetch, displays pagination | `client/tests/lab-02/MyTickets.test.tsx` | **Pass** |
| **UI-07** | UI | AC-19, AC-20 | My Tickets distinct Empty vs No-Results states | Shows correct empty message or clear filters button | `client/tests/lab-02/MyTickets.test.tsx` | **Pass** |
| **UI-08** | UI | AC-21 | Ticket Detail read-only display | All ticket header fields render read-only; no comment/workflow | `client/tests/lab-02/RequesterTicketDetail.test.tsx` | **Pass** |
| **UI-09** | UI | AC-13, AC-14 | Attachment section soft-remove modal | Modal prompts for reason (min 3 chars) before disabling download | `client/tests/lab-02/AttachmentSection.test.tsx` | **Pass** |
| **E2E-01**| E2E| AC-01, AC-16, AC-21, AC-12, AC-14 | Complete Requester Ticketing Flow | Full browser journey: Select ➔ Create ➔ My Tickets ➔ Detail ➔ Remove | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **E2E-02**| E2E| AC-28, AC-29, AC-30 | Responsive & Keyboard Accessibility | Desktop, tablet, mobile layouts render with zero horizontal scroll | `e2e/lab-02/responsive-a11y.spec.ts` | Planned |

---

## 3. Acceptance Criteria Traceability Matrix (AC-01 to AC-36)

| AC ID | Description | Covered By Planned & Executed Tests |
|:---:|---|---|
| **AC-01** | Valid ticket creation returns official Ticket Number | `API-04`, `UI-05`, `E2E-01` |
| **AC-02** | Empty summary triggers inline error and blocks API | `API-05`, `UI-03` |
| **AC-03** | Description > 2000 chars triggers inline error and blocks API | `API-05`, `UI-03` |
| **AC-04** | Submit button shows busy state and is disabled during submission | `UI-04` |
| **AC-05** | Duplicate idempotency key returns existing ticket (no duplicate) | `API-06` |
| **AC-06** | Unreachable backend preserves form input values with error banner | `UI-04` |
| **AC-07** | Ticket created but attachment fails leaves ticket intact with retry | `UI-05` |
| **AC-08** | JPG/PNG/WEBP/PDF < 5MB uploads successfully | `API-11`, `UI-03`, `E2E-01` |
| **AC-09** | Unsupported file type is rejected | `API-12`, `UI-03` |
| **AC-10** | Attachment > 5MB is rejected | `API-12`, `UI-03` |
| **AC-11** | 6th active attachment is blocked with limit message | `API-11` |
| **AC-12** | Active attachment can be downloaded | `API-13`, `E2E-01` |
| **AC-13** | Soft removal requires non-empty reason (min 3 chars) | `API-14`, `UI-09` |
| **AC-14** | Soft removal marks removed, retains metadata, blocks download | `API-14`, `UI-09`, `E2E-01` |
| **AC-15** | Soft removal frees active attachment slot | `API-14` |
| **AC-16** | Search by ticket number or summary matches case-insensitively | `API-07`, `UI-06`, `E2E-01` |
| **AC-17** | Multiple filters combine with AND logic | `API-07`, `UI-06` |
| **AC-18** | Pagination across pages loads correct item slice | `API-07`, `UI-06` |
| **AC-19** | 0 tickets ever shows distinct "no tickets yet" empty state | `UI-07` |
| **AC-20** | 0 filter matches shows distinct "no results" state with Clear Filters | `UI-07` |
| **AC-21** | Owned ticket detail renders read-only fields | `API-10`, `UI-08`, `E2E-01` |
| **AC-22** | Non-owner ticket access returns 404 | `API-08`, `API-10` |
| **AC-23** | Switching requester switches visible ticket list immediately | `API-08`, `E2E-01` |
| **AC-24** | Missing requester context redirects to Selection screen | `API-01`, `UI-01` |
| **AC-25** | Zero active requesters shows empty state | `UI-01` |
| **AC-26** | Requester API failure shows safe retry UI | `UI-01` |
| **AC-27** | Inactive requester rejected with 400 | `API-02` |
| **AC-28** | Mobile viewport (<768px) stacks vertically without horizontal scroll | `UI-01`, `UI-03`, `E2E-02` |
| **AC-29** | Tablet viewport (768–991px) uses two-column layout | `UI-03`, `E2E-02` |
| **AC-30** | Keyboard tab order and focus indicators are visible | `UI-01`, `UI-03`, `E2E-02` |
| **AC-31** | Only active reference data and active requesters are shown | `API-01`, `API-03`, `UI-01`, `UI-02`, `UI-03` |
| **AC-32** | Removed attachment download returns 404 | `API-13`, `API-14` |
| **AC-33** | Invalid query parameters return 400 | `API-09` |
| **AC-34** | Unowned attachment operations return 404 | `API-15` |
| **AC-35** | Reload revalidates stored context in sessionStorage | `UI-02` |
| **AC-36** | Concurrent ticket creation generates unique ticket numbers | `API-04`, `API-06` |

---

## 4. Test Commands

```powershell
# Run Client unit and component tests
npm --prefix client test

# Run Server API and integration tests
npm --prefix server test

# Run Playwright E2E test suite
npm run test:e2e
```

---

## 5. Execution Results Summary (Issue 7 Progress)

- **Client Tests (`npm --prefix client test`):**
  - `tests/lab-01/App.test.tsx`: 3 tests passing (100%)
  - `tests/lab-02/RequesterSelector.test.tsx` (UI-01, UI-02): 8 tests passing (100%)
  - `tests/lab-02/CreateTicket.test.tsx` (UI-03, UI-04, UI-05): 10 tests passing (100%)
  - `tests/lab-02/MyTickets.test.tsx` (UI-06, UI-07): 8 tests passing (100%)
    - UI-06: renders ticket table with tickets, categories, priorities, and formatted dates (PASS)
    - UI-06 (AC-16): submitting search input triggers API fetch with search query parameter (PASS)
    - UI-06 (AC-17): changing category, priority, and status filters triggers API fetch with filter query params (PASS)
    - UI-06 (AC-26): clicking table headers toggles sortOrder and changes sortBy across ticketNumber and updatedAt (PASS)
    - UI-06 (AC-18): pagination controls trigger fetch with new page and page size (PASS)
    - UI-07 (AC-19): renders distinct Empty State when requester has 0 tickets ever (PASS)
    - UI-07 (AC-20): renders distinct No-Results State when filters match 0 tickets and allows clearing filters (PASS)
    - AC-23: re-fetches tickets immediately when currentRequester changes (PASS)
  - **Total Client:** 37 passed (37 across 6 files)
    - `tests/lab-01/App.test.tsx`: 3 tests passing (100%)
    - `tests/lab-02/RequesterSelector.test.tsx` (UI-01, UI-02): 8 tests passing (100%)
    - `tests/lab-02/CreateTicket.test.tsx` (UI-03, UI-04, UI-05): 10 tests passing (100%)
    - `tests/lab-02/MyTickets.test.tsx` (UI-06, UI-07): 8 tests passing (100%)
    - `tests/lab-02/RequesterTicketDetail.test.tsx` (UI-08): 4 tests passing (100%)
      - UI-08 (AC-21): renders complete ticket detail in read-only mode for owned ticket (PASS)
      - UI-08 (AC-21): strictly excludes comments, notes, actions taken, and status modification controls (PASS)
      - UI-08: invokes onBack callback when clicking Back to My Tickets (PASS)
      - UI-08 (AC-22): renders error view with back button when ticket access is denied or not found (PASS)
    - `tests/lab-02/AttachmentSection.test.tsx` (UI-09): 4 tests passing (100%)
      - UI-09 (AC-12, AC-14, AC-32): renders active and soft-removed attachments properly (PASS)
      - UI-09 (AC-13, BR-21): soft removal modal enforces non-empty reason with minimum 3 characters (PASS)
      - UI-09 (AC-13, AC-15): confirming removal calls API and notifies parent (PASS)
      - UI-09 (AC-11, BR-19): displays cap warning and disables upload when active count is 5 (PASS)

- **Server Tests (`npm --prefix server test`):**
  - `tests/lab-01/health.test.ts`: 1 test passing (100%)
  - `tests/lab-01/categories.test.ts`: 1 test passing (100%)
  - `tests/lab-02/reference-data.api.test.ts`: 2 tests passing (100%)
  - `tests/lab-02/dev-requesters.api.test.ts`: 4 tests passing (100%)
  - `tests/lab-02/create-ticket.api.test.ts`: 8 tests passing (100%)
  - `tests/lab-02/attachments.api.test.ts`: 7 tests passing (100%)
  - `tests/lab-02/my-tickets.api.test.ts` (API-07, API-08, API-09): 14 tests passing (100%)
  - `tests/lab-02/ticket-detail.api.test.ts` (API-10): 6 tests passing (100%)
    - API-10 (AC-21): returns 200 with complete read-only ticket details and attachments (PASS)
    - API-10 (AC-22): returns 404 Not Found when requester attempts to access another requester's ticket (PASS)
    - API-10: returns 404 Not Found for nonexistent ticket ID (PASS)
    - API-10 (AC-33): rejects non-numeric or non-positive ticket ID with 400 (PASS)
    - API-10 (AC-27): rejects request without X-Dev-Requester-Id header with 400 (PASS)
    - API-10 (AC-27): rejects request with inactive requester ID with 400 (PASS)
  - **Total Server:** 43 passed (43 across 8 files)
