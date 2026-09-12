# Lab 3 Zen Green UI Specification
### TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens

---

## 1. Design System Tokens & Foundations

The Zen Green design system established in Lab 2 is preserved and extended to support multi-role views, status progressions, and distinct communication channels.

### 1.1 Color Palette
| Token Name | Hex Code | Usage / Purpose |
|---|---|---|
| `--color-primary-green` | `#006B3C` | App header, primary CTAs, main brand accents |
| `--color-secondary-green`| `#0B7A46` | Active nav items, focus rings, interactive links, hover accents |
| `--color-pale-green` | `#EAF6EF` | Selected item background, public comment background, subtle containers |
| `--color-page-bg` | `#F5F7F6` | Main page background (calm off-white/gray-green) |
| `--color-surface` | `#FFFFFF` | Card surfaces, modals, popovers |
| `--color-text-main` | `#1C2826` | High-contrast dark charcoal green text |
| `--color-text-muted` | `#5C6B67` | Secondary text, timestamps, helper labels |
| `--color-field-border` | `#D0D7D5` | Neutral borders for inputs and containers |
| `--color-field-readonly`| `#F0F4F2` | Read-only input background, disabled surfaces |
| `--color-error` | `#B3261E` | Error text, destructive buttons, invalid borders |
| `--color-error-bg` | `#FDF2F2` | Error banner backgrounds, high priority badges |
| `--color-warning` | `#D97706` | Medium priority badges, waiting status, attention alerts |
| `--color-warning-bg` | `#FFFBEB` | Internal note container background, caution banners |
| `--color-warning-border`| `#FDE68A` | Internal note border (explicit amber boundary) |
| `--color-success` | `#15803D` | Resolved status badges, success alert banners |
| `--color-info` | `#0284C7` | In-progress status badges, IT Staff role badge |
| `--color-admin` | `#6D28D9` | Administrator role badge (Deep Purple) |

### 1.2 Status, Priority, and Role Badges

#### Ticket Status Badges
- `NEW`: Teal / Soft Green (`bg: #EAF6EF`, `text: #0B7A46`, `border: #A7D7C5`)
- `OPEN`: Slate Blue (`bg: #E0F2FE`, `text: #0369A1`, `border: #BAE6FD`)
- `IN_PROGRESS`: Blue (`bg: #DBEAFE`, `text: #1D4ED8`, `border: #BFDBFE`)
- `WAITING_FOR_REQUESTER`: Amber (`bg: #FEF3C7`, `text: #B45309`, `border: #FDE68A`)
- `RESOLVED`: Green (`bg: #DCFCE7`, `text: #15803D`, `border: #BBF7D0`)
- `CLOSED`: Neutral Gray (`bg: #F3F4F6`, `text: #4B5563`, `border: #E5E7EB`)
- `REOPENED`: Orange (`bg: #FFEDD5`, `text: #C2410C`, `border: #FED7AA`)
- `CANCELLED`: Muted Red (`bg: #FEE2E2`, `text: #991B1B`, `border: #FECACA`)

#### Priority Badges (Requested Priority & IT Priority)
- `HIGH`: Coral / Red (`bg: #FEE2E2`, `text: #991B1B`, `border: #FECACA`)
- `MEDIUM`: Amber (`bg: #FEF3C7`, `text: #92400E`, `border: #FDE68A`)
- `LOW`: Green (`bg: #DCFCE7`, `text: #166534`, `border: #BBF7D0`)

#### User Role Badges
- `REQUESTER`: Sage Green (`bg: #EAF6EF`, `text: #006B3C`, `border: #A7D7C5`)
- `IT_STAFF`: Sky Blue (`bg: #E0F2FE`, `text: #0284C7`, `border: #BAE6FD`)
- `ADMINISTRATOR`: Royal Purple (`bg: #F3E8FF`, `text: #6D28D9`, `border: #DDD6FE`)

---

## 2. Authenticated Application Shell

### 2.1 Header & Navigation
The header adapts dynamically to the authenticated user's role:
- **Left:** Brand logo + "TokTickIT" text.
- **Center Nav Links (Role-gated):**
  - `REQUESTER`: "My Tickets", "Create Ticket"
  - `IT_STAFF`: "Ticket Queue"
  - `ADMINISTRATOR`: "Ticket Queue", "User Management"
- **Right Profile Controls:**
  - User Full Name + Role Badge (e.g. `Jiraphat (Requester)`)
  - "Logout" button (accessible, with clear hover/focus state)

---

## 3. Screen Specifications

### 3.1 Login Screen (`/login`)
- **Container:** Centered card (`max-width: 440px`), surface white, subtle shadow, Zen Green brand header.
- **Fields:**
  - Email input (type: `email`, autofocus, trimmed lowercase on submit)
  - Password input (type: `password`, toggleable visibility)
  - "Sign In" Primary Button (Zen Green `#006B3C`, full-width, busy spinner on submit)
- **Error States:**
  - Safe error banner: *"Invalid email or password"* (does not reveal whether the email exists).
  - Validation: Empty field messages under individual inputs.

### 3.2 Mandatory Password Change Screen (`/change-password`)
- **Notice Banner:** Amber callout: *"First Login Notice: You must change your initial password before accessing TokTickIT."*
- **Fields:**
  - New Password input (enforces: min 8 characters, 1 uppercase, 1 lowercase, 1 number)
  - Confirm New Password input
  - Password strength checklist / helper feedback
  - "Save Password & Continue" Primary Button
- **Restrictions:** User cannot navigate away or access ticket/queue screens until this step is completed.

### 3.3 Requester Ticket Detail Screen (`/tickets/:id`)
Preserves the read-only inspection view from Lab 2 while adding:
1. **Problem Appears Resolved Section:**
   - Visual toggle/button: *"Mark Problem as Resolved"* (only enabled if ticket is not already closed/cancelled).
   - Display banner: *"Requester has indicated this issue appears resolved. Awaiting IT Staff formal resolution."*
2. **Public Comments Section:**
   - Chronological list of public messages.
   - Distinct pale green styling (`#EAF6EF`) with badge: `Public Comment`.
   - Textarea + "Add Comment" button (1–2000 characters).
3. **Strict Boundaries:** No internal notes section, no IT Priority dropdown, and no status transition buttons.

### 3.4 IT Staff Ticket Queue Screen (`/staff/queue`)
- **Page Title:** "IT Service Desk Ticket Queue"
- **Controls & Filters Toolbar:**
  - Search input: searches Ticket Number or Summary (instant or debounced)
  - Category Filter (Dropdown)
  - Current Status Filter (Dropdown)
  - IT Priority Filter (Dropdown)
  - Assignment Filter ("All", "Unassigned", "Assigned to Me")
  - Sort Controls (Ticket Number, Created Date, Last Updated, Priority)
- **Table View (Desktop ≥992px):**
  - Columns: Ticket Number, Created Date, Summary, Category, Requested Priority, IT Priority, Status, Owner, Last Updated, Action ("View Detail")
- **Card View (Mobile <768px):**
  - Compact stacked cards displaying key badges, summary, owner, and "View" button.
- **States:**
  - Loading skeleton table
  - Empty state (0 tickets in system)
  - No-results state (0 matches for filter criteria with "Clear Filters" button)

### 3.5 IT Staff Ticket Detail Screen (`/staff/tickets/:id`)
- **Grouped Layout:**
  - **Header:** Ticket Number, Created Date, Requester Name & Email, Category, Related System.
  - **Operational Bar:**
    - **Ticket Owner:** Shows assigned staff or "Unassigned". Actions: "Claim Ticket" or "Reassign" dropdown.
    - **IT Priority:** Dropdown (`LOW`, `MEDIUM`, `HIGH`) with "Save" action.
    - **Status Workflow:** Context-sensitive transition buttons based on the Status Transition Matrix.
    - **Requester Resolution Banner:** Appears if `problemAppearsResolved = true`.
  - **Attachments Section:** Full continuity from Lab 2 (active files, soft-removed audit list).
  - **Dual Communication Threads:**
    1. **Public Comments (Zen Green Accent):** Visible to Requester and Staff. Clear disclaimer: *"Visible to Requester"*.
    2. **Internal Notes (Amber Warning Accent):** Background `#FFFBEB`, border `2px solid #FDE68A`, badge: `Private to IT Staff & Admin`. Clear disclaimer: *"Never visible to the requester"*.

### 3.6 Administrator User Management Screen (`/admin/users`)
- **Header:** "User Management" + "Create User" Primary Button.
- **Search & Filter Bar:** Search by Name or Email, filter by Role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **User Directory Table:**
  - Columns: Full Name, Email, Role (Badge), Status (Active / Inactive Badge), Created Date, Actions ("Edit", "Reset Password").
- **Create User Modal:**
  - Fields: Full Name, Email, Role, Initial Password.
  - Checkbox: "Require password change on first login" (checked & disabled by default).
- **Edit User Modal:**
  - Editable: Full Name, Email, Role, Active Status (Toggle).
  - **Guards:** Active toggle is disabled if the user is the logged-in admin or the last active admin.
- **Reset Initial Password Modal:**
  - Input: New Initial Password. Warns that the user will be forced to change it on next login.

---

## 4. Responsive Breakpoints & Viewport Rules

- **Desktop (≥992px):** Full multi-column tables, side-by-side comment/note panels, persistent navigation tabs.
- **Tablet (768px – 991px):** Responsive tables with horizontal scroll or consolidated columns, stacked filter bars.
- **Mobile (<768px):**
  - Navigation collapses or stacks vertically.
  - Ticket Queue and User Directory render as card lists instead of tables.
  - Forms stack fields in 100% width with touch-friendly 44px tap targets.
  - Zero horizontal page overflow (`scrollWidth <= window.innerWidth`).

---

## 5. Accessibility & Interaction Expectations

- **Focus Visibility:** All interactive buttons, inputs, links, and modal controls must exhibit visible `:focus-visible` rings (`outline: 2px solid #0B7A46`, offset `2px`).
- **Screen Reader Support:** Semantic HTML headings (`<h1>`, `<h2>`), appropriate ARIA labels for status badges and modal dialogs (`role="dialog"`, `aria-modal="true"`).
- **Keyboard Navigation:** Full tab order traversal without keyboard traps; ESC key dismisses modals.

---

## 6. Visual QA Checklist

- [ ] Header renders correct user name and role badge upon login.
- [ ] Role-restricted navigation hides unauthorized screens.
- [ ] Login screen displays clean validation and safe authentication failure banner.
- [ ] Mandatory password change screen blocks other navigation until saved.
- [ ] Requester cannot see internal notes or staff operational controls.
- [ ] Public Comments and Internal Notes are visually distinct (Pale Green vs. Amber Warning).
- [ ] Ticket Queue displays badges with consistent colors across statuses and priorities.
- [ ] Ticket Detail allows claiming, reassigning, and valid status transitions.
- [ ] Administrator User Management prevents self-deactivation and last admin deactivation.
- [ ] Zero horizontal overflow across Desktop (1280px), Tablet (768px), and Mobile (375px).
