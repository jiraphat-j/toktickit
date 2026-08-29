# Lab 2 Zen Green UI Specification
### TokTickIT — Requester Ticketing MVP with UI Foundation

---

## 1. Design System Tokens (Zen Green Theme)

### 1.1 Color Palette
| Token Name | Hex Code | Usage / Purpose |
|---|---|---|
| `--color-primary-green` | `#006B3C` | App header, primary call-to-action buttons, high emphasis text/icons |
| `--color-secondary-green`| `#0B7A46` | Active navigation tabs, focus rings, interactive links, hover accents |
| `--color-pale-green` | `#EAF6EF` | Selected item background, table highlight, subtle section containers |
| `--color-page-bg` | `#F5F7F6` | Main application background (soft quiet off-white/gray-green) |
| `--color-surface` | `#FFFFFF` | Card containers, modal dialogues, dropdown menus |
| `--color-text-main` | `#1C2826` | Primary body text, labels (dark charcoal green, never pure #000) |
| `--color-text-muted` | `#5C6B67` | Placeholder text, secondary hints, timestamps |
| `--color-field-border` | `#D0D7D5` | Neutral borders for input fields and containers |
| `--color-field-readonly`| `#F0F4F2` | Read-only input background, disabled surfaces |
| `--color-error` | `#B3261E` | Error text, error field borders, required field asterisks (`*`) |
| `--color-error-bg` | `#FDF2F2` | Error banner background |
| `--color-warning` | `#D97706` | Warning badges and alerts (Amber) |
| `--color-success` | `#15803D` | Success confirmation messages and badges |

### 1.2 Typography & Spacing
- **Font Family:** Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- **Scale:**
  - Page Titles / H1: `24px / 1.4` (Semi-bold `600`)
  - Section Headers / H2: `18px / 1.4` (Semi-bold `600`)
  - Form Labels & Table Headers: `14px / 1.4` (Medium `500`)
  - Body Text & Input Values: `14px / 1.5` (Regular `400`)
  - Small / Hints / Metadata: `12px / 1.4` (Regular `400`)
- **Spacing Units:** `4px`, `8px`, `12px`, `16px`, `24px`, `32px`

---

## 2. Reusable UI Components & Rules

### 2.1 Form Controls
- **Label Placement:** Always positioned immediately above the control, font size `14px`, medium weight.
- **Required Fields:** Marked with a red asterisk `*` (`#B3261E`) adjacent to the label.
- **Input Heights:** Consistent height `40px` for text inputs, selects, and file pickers.
- **Description Textarea:** Multi-line, minimum initial height `120px`, vertical-only resize.
- **Read-Only / Disabled Fields:** Styled with background `#F0F4F2`, neutral border, clear non-editable cursor (`not-allowed`), text fully legible.
- **Validation Errors:** Red border (`#B3261E`) on the invalid control with a clear error message displayed directly below the field.

### 2.2 Buttons & Action Hierarchy
1. **Primary Button:** `#006B3C` background, white text, bold. Used for Submit Ticket, Continue, Confirm.
2. **Secondary Button:** White background, `#0B7A46` border and text. Used for Clear Filters, Cancel, Back.
3. **Destructive Button:** `#B3261E` background or border. Used for Soft-remove attachment.
4. **Busy State:** When request is processing, button text changes (e.g. `Submitting...`), a spinner is shown, and button is disabled (`opacity: 0.65`, `pointer-events: none`).

### 2.3 Badges (Priority & Status)
- **Requested Priority:**
  - `HIGH`: Pale Red / Coral badge (`bg: #FEE2E2`, `text: #991B1B`)
  - `MEDIUM`: Pale Amber badge (`bg: #FEF3C7`, `text: #92400E`)
  - `LOW`: Pale Green badge (`bg: #DCFCE7`, `text: #166534`)
- **Current Status:**
  - `NEW`: Pale Teal / Green badge (`bg: #EAF6EF`, `text: #0B7A46`, border: `#A7D7C5`)

---

## 3. Screen Specifications

### 3.1 Global Application Shell & Header
- **Top Header Bar:** Background `#006B3C`, white text and icons.
  - Left: Logo + "TokTickIT" text.
  - Center/Nav: "My Tickets" link, "Create Ticket" link (active tab indicated with white pill/underline).
  - Right: Selected Requester avatar + Name + "Change Requester" button/link.

### 3.2 Development Requester Selection Screen
- **Notice / Disclaimer:** Explicit amber/blue box stating:
  > *"Select a Development Requester to test requester-specific ticket behavior. This is not a login screen. Authentication and role-based access will be introduced in Lab 3."*
- **Elements:**
  - Development Requester dropdown (only active requesters loaded from DB).
  - Continue button (`#006B3C`).
  - Loading skeleton / spinner during API fetch.
  - Empty state if 0 active requesters exist.
  - Safe API failure state with "Retry" button.
- **Storage:** Persisted in `sessionStorage` key `toktickit.devRequesterId`. Revalidated on page reload.

### 3.3 Create Ticket Screen
- **Fields in Vertical Order:**
  1. Selected Requester (Read-only input with selected name & email).
  2. Category dropdown (`*` required, populated from `/api/categories`).
  3. Related System dropdown (`*` required, populated from `/api/related-systems`).
  4. Requested Priority radio group or dropdown (`LOW`, `MEDIUM`, `HIGH`, default: `MEDIUM`).
  5. Ticket Summary input (`*` required, 5–150 characters).
  6. Description textarea (`*` required, 10–2000 characters).
  7. Supporting Attachment picker (Max 5 MB, allowed: JPG, PNG, WEBP, PDF).
  8. Submit button + Cancel button.
- **States:**
  - Initial clean form
  - Client-side validation errors displayed under corresponding inputs
  - In-flight submitting state (disabled fields + busy spinner)
  - Success state: card displaying generated Ticket Number (e.g. `TKT-2026-000101`) with links to "View in My Tickets" or "Create Another Ticket"
  - API failure state: server error banner on top, all user-entered form data preserved

### 3.4 My Tickets Screen
- **Controls Header:**
  - Search bar: Input for searching Ticket Number or Summary.
  - Filters: Category filter dropdown, Requested Priority filter dropdown, Status filter dropdown.
  - "Clear Filters" button.
  - "Create Ticket" primary button.
- **Table / List View:**
  - Columns: Ticket No, Created Date, Summary, Category, Requested Priority, Status, Attachment count.
  - Sorting: Clicking column headers toggles `ASC` / `DESC` sorting.
  - Pagination: Page indicator (`Page X of Y`), Page Size selector (`8`, `20`, `50`), Next / Prev / Numbered buttons.
- **States:**
  - Loading skeleton / spinner
  - Empty state (Requester has never created tickets): "You haven't created any tickets yet." + Create Ticket CTA button.
  - No-results state (Search/filter matched zero tickets): "No tickets match your search/filter criteria." + Clear Filters button.
  - Data table populated with tickets.

### 3.5 Ticket Detail & Attachment Management Screen
- **Read-Only Ticket Header & Body:**
  - Ticket Number (Large bold header), Created Date, Requester, Category, Related System, Priority badge, Status badge.
  - Summary and full Description displayed clearly.
  - Note: Strictly NO comments, internal notes, actions taken, or status edit dropdowns.
- **Attachment Section:**
  - List of active attachments: File name, file size (formatted KB/MB), upload date, Download button, Remove button.
  - List of soft-removed attachments: File name, size, removal date, removal reason. Download button disabled/hidden.
  - Add Attachment button / upload form (enabled if active attachments < 5).
  - Soft-removal confirmation modal: requires typing a reason (min 3 chars) before confirming removal.

---

## 4. Responsive Layout Rules

| Viewport Category | Breakpoint | Layout & Behavior |
|---|---|---|
| **Desktop** | `≥ 992px` | Multi-column grid; content centered max-width `1200px`; full table layout for My Tickets. |
| **Tablet** | `768px – 991px` | Two-column grid where applicable; form fields expand to fill available width; responsive scrollable table. |
| **Mobile** | `< 768px` | Single-column stacked layout; form fields 100% width; My Tickets converts to stacked card view; touch-friendly buttons (`min-height: 44px`); zero horizontal window scrolling. |

---

## 5. Visual QA & Screenshot Checklist

| Screenshot Path | Description / State |
|---|---|
| `artifacts/lab-02/screenshots/create-ticket/01-initial.png` | Clean Create Ticket page on Desktop |
| `artifacts/lab-02/screenshots/create-ticket/02-validation.png` | Field-level validation messages |
| `artifacts/lab-02/screenshots/create-ticket/03-submitting.png` | Busy button state during submission |
| `artifacts/lab-02/screenshots/create-ticket/04-success.png` | Success card showing generated Ticket Number |
| `artifacts/lab-02/screenshots/create-ticket/05-api-failure.png` | Server failure with preserved form values |
| `artifacts/lab-02/screenshots/my-tickets/01-table-desktop.png` | My Tickets table with data on Desktop |
| `artifacts/lab-02/screenshots/my-tickets/02-cards-mobile.png` | My Tickets responsive cards on Mobile (<768px) |
| `artifacts/lab-02/screenshots/my-tickets/03-empty-state.png` | Empty state (0 tickets created) |
| `artifacts/lab-02/screenshots/my-tickets/04-no-results.png` | No-results state after filtering |
| `artifacts/lab-02/screenshots/ticket-detail/01-detail-desktop.png` | Read-only Ticket Detail on Desktop |
| `artifacts/lab-02/screenshots/ticket-detail/02-attachment-lifecycle.png` | Active vs Removed attachment display & removal modal |
