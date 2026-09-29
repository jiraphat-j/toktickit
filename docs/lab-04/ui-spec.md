# Lab 4 User Interface Specification
### TokTickIT — Actions Taken, Dashboards, and Final Regression

---

## 1. Design System & Zen Green Theme Tokens

Lab 4 maintains strict adherence to the **Zen Green Design System** established in Lab 2 and expanded in Lab 3. All components inherit tokens from `zen-green.css`.

| Token / Role | Hex Code | Usage |
|---|---|---|
| **Primary Green** | `#006B3C` | Primary buttons, active navigation indicator, brand accents |
| **Secondary Green** | `#0B7A46` | Interactive hover states, secondary highlights, `:focus-visible` outline |
| **Pale Green** | `#EAF6EF` | Metric card background, selected table rows, public comment container |
| **Amber Warning** | `#FEF3C7` / `#D97706` | Internal notes container, resolution gate advisory alerts, pending follow-ups |
| **Neutral Surface** | `#FFFFFF` | Card backgrounds, dialog surfaces, readable table bodies |
| **Page Canvas** | `#F5F7F6` | Application body background |
| **Border Gray** | `#E2E8F0` | Dividers, card borders, table separators |
| **Status NEW** | `#E0F2FE` (text `#0369A1`) | Badge for unassigned, freshly created tickets |
| **Status IN_PROGRESS** | `#FEF3C7` (text `#B45309`) | Badge for active operational work |
| **Status RESOLVED** | `#DCFCE7` (text `#15803D`) | Badge for resolved work awaiting closure |
| **Status CLOSED** | `#F3F4F6` (text `#4B5563`) | Badge for completed tickets |

---

## 2. Screen Specifications

### 2.1 Screen 1: IT Staff Dashboard (`/staff/dashboard`)

#### Purpose
Provides IT Staff and Administrators with an immediate, high-level operational overview of active service-desk workload, bottlenecks, personal assignments, and quick drill-down navigation to the Ticket Queue.

#### Layout & Visual Elements
1. **Header Section:**
   - Title: `IT Staff Operational Dashboard`
   - Subtitle: `Live overview of service desk activity and your assigned tasks`
   - Refresh button with loading spinner state.
2. **Key Metric Summary Grid (4 Cards):**
   - **Card 1: Unassigned Tickets:** Large counter, Pale Green background, icon, link to Queue filtered by `owner=unassigned`.
   - **Card 2: My Open Tickets:** Large counter of tickets assigned to `currentUser.id`, link to Queue filtered by `owner=me`.
   - **Card 3: Critical / High Priority:** Counter of open tickets requiring immediate attention, link to Queue filtered by `priority=CRITICAL,HIGH`.
   - **Card 4: Actions Taken by Me:** Counter of actions logged by `currentUser.id`.
3. **Status Distribution Breakdown:**
   - Visual progress bar / pill counter showing distribution across `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`.
   - Each status pill is clickable, opening the Queue filtered to that status.
4. **Recent Service Desk Activity Table:**
   - Displays top 5 most recently updated tickets: Ticket #, Summary, Requester, Status badge, Priority badge, Last Updated.
   - Action button: `View Ticket` navigating to Staff Ticket Detail.
5. **My Recent Actions List:**
   - Mini-list of the 5 most recent `ActionTaken` records logged by current user with ticket number, date, and result.
6. **State Handlings:**
   - **Loading State:** Skeleton card loaders and spinner.
   - **Empty State:** Distinct banner when 0 tickets exist in system.
   - **Safe Error State:** Non-blocking alert banner with retry button if backend call fails.
   - **Forbidden State:** Requesters navigating to this URL receive a friendly 403 Forbidden screen with a button to return to the Requester Portal.

---

### 2.2 Screen 2: Requester Dashboard (`/requester/dashboard`)

#### Purpose
Provides Requesters with an uncluttered, personal summary of their service requests without overwhelming them with dense operational queue tables.

#### Layout & Visual Elements
1. **Header Section:**
   - Title: `My Support Dashboard`
   - Subtitle: `Welcome back, {User Name}. Here is a summary of your active tickets.`
   - Primary Action Button: `+ Create New Ticket`
2. **Metric Cards Grid (3 Cards):**
   - **Card 1: Open Tickets:** Total tickets owned by user with status `NEW`, `OPEN`, `IN_PROGRESS`, or `WAITING_FOR_REQUESTER`.
   - **Card 2: Action Needed (Waiting for You):** Counter with amber tint if tickets are in `WAITING_FOR_REQUESTER` status.
   - **Card 3: Recently Resolved:** Counter of tickets resolved in the last 14 days.
3. **Tickets Needing Attention Section:**
   - Displays tickets currently in `WAITING_FOR_REQUESTER` status with a clear prompt: "Staff has requested additional information".
4. **Recent Tickets List:**
   - Compact cards showing the 5 most recent tickets with Ticket Number, Summary, Status badge, and `View Details` link.
5. **State Handlings:**
   - **Loading State:** Centered Zen Green spinner.
   - **Empty State:** Encouraging empty card: "You have no active support tickets. Need help with hardware or software? Create a ticket."
   - **Safe Error State:** Redesigned retry alert preserving user context.

---

### 2.3 Screen 3: Actions Taken Section on Ticket Detail

#### Purpose
A structured, parent-child work log integrated into `StaffTicketDetail.tsx` (and read-only in `RequesterTicketDetail.tsx`), enabling IT Staff to record technical actions, outcomes, follow-up requirements, and physical attachment notes.

#### Layout & Controls
1. **Section Header:**
   - Title: `Actions Taken` with counter badge (e.g. `Actions Taken (3)`).
   - IT Staff Action Button: `+ Log Action Taken` (primary Zen Green button). Hidden from Requester.
2. **Actions List / Table (Desktop View ≥992px):**
   - Columns:
     - `Date / Time`: Formatted local date and time.
     - `Performed By`: Staff member name and role badge.
     - `Description`: Action performed.
     - `Result`: Outcome of the action.
     - `Follow-Up`: Pill badge (`None` or `Required: {Follow-up Note}`).
     - `Attachment Notes`: Reference text or `—`.
     - `Actions`: `Edit` button (Staff/Admin only).
3. **Mobile View (<768px):**
   - Card layout per action with clear label-value pairs and responsive stacked action buttons.
4. **Log / Edit Action Modal Dialog:**
   - Accessible modal with backdrop blur.
   - Fields:
     - `Action Date & Time`: Defaults to now; past datetime picker.
     - `Performed By`: Read-only field bound to logged-in user name (`Auto-attributed`).
     - `Description` (textarea, mandatory 5–2000 chars, character counter).
     - `Result` (textarea, mandatory 2–2000 chars).
     - `Follow-up Required?` (checkbox / toggle).
     - `Follow-up Note` (textarea, conditionally shown/required when checkbox checked; 3–1000 chars).
     - `Attachment Notes` (optional input, max 500 chars).
   - Buttons: `Cancel` (secondary outline), `Save Action` (primary Zen Green with spinner when busy).
5. **Validation & Feedback:**
   - Field-level red error text below invalid inputs.
   - Immediate feedback on save success or failure.

---

### 2.4 Screen 4: Ticket Status Transition Controls & Resolution Gate

#### Purpose
Guides IT Staff through permitted status transitions while strictly communicating prerequisite business rules (specifically the Resolution Gate).

#### Layout & Controls
1. **Current Status Banner:**
   - Prominently displays the current ticket status badge with color coding.
2. **Permitted Transition Buttons:**
   - Only buttons corresponding to valid next states are rendered (e.g. if `NEW`, renders `Move to OPEN` and `Cancel Ticket`).
3. **Resolution Gate Visual Feedback:**
   - If ticket is in `IN_PROGRESS` or `WAITING_FOR_REQUESTER` and `actionsCount == 0`:
     - The `Resolve Ticket` button is disabled or accompanied by an Amber Warning tooltip: *"At least one Action Taken must be logged before resolving this ticket."*
   - Once an action is recorded, the `Resolve Ticket` button activates with full primary styling.
4. **Requester "Problem Appears Resolved" Indicator:**
   - Distinct informational pill in the Ticket Detail header: *"Requester indicated the problem appears resolved"* with amber checkmark.
   - Clarifying subtitle: *"Requires IT Staff review and formal resolution."*

---

## 3. Responsive Breakpoints & Overflow Guarantees

| Breakpoint | Target Viewports | Layout Rules |
|---|---|---|
| **Desktop** | `≥ 992px` (e.g. 1280px × 800px) | Multi-column metric grid (3 or 4 cards per row), tabular Actions Taken table, dual side-by-side details |
| **Tablet** | `768px – 991px` (e.g. 768px × 1024px) | 2-column metric cards, responsive wrapping tables with horizontal scroll contained inside card container |
| **Mobile** | `< 768px` (e.g. 375px × 667px) | Single column stacked metric cards, stacked action cards, full-width touch buttons |

### Zero Horizontal Overflow Guarantee
All pages must strictly pass:
```javascript
document.documentElement.scrollWidth <= window.innerWidth
```
No content or modal may cause horizontal body scrollbars across any viewport.

---

## 4. Accessibility Checklist

- [ ] **Visible Focus Rings:** All interactive elements (buttons, inputs, links, tabs) have `:focus-visible` outline `2px solid #0B7A46` with offset `2px`.
- [ ] **Color Contrast:** All text meets WCAG AA minimum 4.5:1 against its background.
- [ ] **Non-Color Status Cues:** All badges include explicit text labels (not color alone).
- [ ] **Keyboard Navigable:** Modals trap focus and close on `Escape`; all form controls reachable via `Tab`.
- [ ] **Semantic HTML:** Proper headings hierarchy (`h1`, `h2`, `h3`), `<main>`, `<nav>`, `<section>`, and `<dialog>` / `aria-modal`.
