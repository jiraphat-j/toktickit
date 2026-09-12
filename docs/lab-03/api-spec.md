# Lab 3 REST API Specification
### TokTickIT — Users, Roles, IT Staff Ticketing, and Admin Screens

---

## 1. Global Conventions & Protocol

### 1.1 Base URL & Format
- **Base Path:** `/api`
- **Content Type:** `application/json; charset=utf-8` (except attachment upload: `multipart/form-data`)
- **Timestamp Format:** ISO-8601 UTC string (e.g. `2026-09-12T12:00:00.000Z`)

### 1.2 Authentication & Session Protocol
- Sessions are maintained using a cryptographically signed, `HttpOnly`, `SameSite=Lax` cookie named `toktickit_session`.
- The client does not supply arbitrary user IDs in headers or request bodies. User identity and role are securely extracted server-side from the verified session.
- If an unauthenticated request reaches a protected endpoint, the server responds with `401 Unauthorized`.
- If an authenticated user attempts to access an action or resource forbidden to their role, the server responds with `403 Forbidden` (or `404 Not Found` for requester ticket isolation).
- If a user has `mustChangePassword = true`, any request to endpoints outside `/api/auth/change-password`, `/api/auth/me`, and `/api/auth/logout` is rejected with `403 Forbidden` and error code `PASSWORD_CHANGE_REQUIRED`.

### 1.3 Standard JSON Error Response Shape
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable error explanation",
    "details": [
      {
        "field": "email",
        "message": "Valid email address is required"
      }
    ]
  }
}
```

Standard Error Codes:
- `BAD_REQUEST` (400) — Validation failure, malformed payload, or illegal status transition.
- `UNAUTHORIZED` (401) — Authentication missing, expired, or invalid credentials.
- `FORBIDDEN` (403) — Insufficient role permissions or password change required.
- `NOT_FOUND` (404) — Resource does not exist or belongs to another requester.
- `CONFLICT` (409) — Duplicate email or idempotency key mismatch.
- `PAYLOAD_TOO_LARGE` (413) — Uploaded attachment exceeds 5 MB.
- `UNSUPPORTED_MEDIA_TYPE` (415) — File extension or MIME type not allowed.
- `INTERNAL_SERVER_ERROR` (500) — Unhandled server failure.

---

## 2. Authentication & Session APIs

### 2.1 Login
- **Method & Path:** `POST /api/auth/login`
- **Access:** Public
- **Request Body:**
```json
{
  "email": "jiraphat@toktickit.local",
  "password": "Password123!"
}
```
- **Response `200 OK`:** (Sets `toktickit_session` cookie)
```json
{
  "user": {
    "id": 1,
    "email": "jiraphat@toktickit.local",
    "fullName": "Jiraphat J.",
    "role": "REQUESTER",
    "isActive": true,
    "mustChangePassword": false
  }
}
```
- **Errors:**
  - `400 Bad Request`: Email or password omitted.
  - `401 Unauthorized`: `"Invalid email or password"` (generic message for wrong password, missing account, or `isActive = false`).

### 2.2 Logout
- **Method & Path:** `POST /api/auth/logout`
- **Access:** Authenticated
- **Response `200 OK`:** (Clears `toktickit_session` cookie)
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2.3 Current User (`me`)
- **Method & Path:** `GET /api/auth/me`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
{
  "user": {
    "id": 1,
    "email": "jiraphat@toktickit.local",
    "fullName": "Jiraphat J.",
    "role": "REQUESTER",
    "isActive": true,
    "mustChangePassword": false
  }
}
```
- **Error `401 Unauthorized`:** Session absent or expired.

### 2.4 Mandatory & First-Login Password Change
- **Method & Path:** `POST /api/auth/change-password`
- **Access:** Authenticated
- **Request Body:**
```json
{
  "newPassword": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```
- **Validation Rules:**
  - `newPassword` length ≥ 8 characters.
  - Must include at least 1 uppercase letter, 1 lowercase letter, and 1 number.
  - `newPassword` and `confirmPassword` must match identically.
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

## 3. Reference Data APIs

### 3.1 List Active Categories
- **Method & Path:** `GET /api/categories`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Account and Access", "isActive": true },
  { "id": 2, "name": "Hardware", "isActive": true },
  { "id": 3, "name": "Software", "isActive": true },
  { "id": 4, "name": "Network", "isActive": true }
]
```

### 3.2 List Active Related Systems
- **Method & Path:** `GET /api/related-systems`
- **Access:** Authenticated
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Campus Wi-Fi", "isActive": true },
  { "id": 2, "name": "Corporate Laptop", "isActive": true },
  { "id": 3, "name": "Email", "isActive": true },
  { "id": 4, "name": "Grade Submission App", "isActive": true },
  { "id": 5, "name": "LEB2 App", "isActive": true },
  { "id": 6, "name": "Printer", "isActive": true }
]
```

---

## 4. Requester Ticket APIs (Lab 2 Regression with Real Auth)

### 4.1 Create Ticket
- **Method & Path:** `POST /api/tickets`
- **Access:** Authenticated Requester (or Staff/Admin creating on behalf)
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "categoryId": 1,
  "relatedSystemId": 3,
  "summary": "Cannot access campus email from mobile",
  "description": "Getting authentication error 500 when syncing inbox.",
  "requestedPriority": "HIGH"
}
```
- **Response `201 Created`:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requesterId": 1,
  "categoryId": 1,
  "relatedSystemId": 3,
  "summary": "Cannot access campus email from mobile",
  "description": "Getting authentication error 500 when syncing inbox.",
  "requestedPriority": "HIGH",
  "itPriority": "HIGH",
  "currentStatus": "NEW",
  "problemAppearsResolved": false,
  "createdAt": "2026-09-12T14:30:00.000Z",
  "updatedAt": "2026-09-12T14:30:00.000Z"
}
```

### 4.2 List My Tickets (Requester Dashboard)
- **Method & Path:** `GET /api/tickets`
- **Access:** Authenticated Requester (scoped strictly to `requesterId == currentUser.id`)
- **Query Parameters:**
  - `search` (string, optional)
  - `categoryId` (int, optional)
  - `requestedPriority` (enum: `LOW`, `MEDIUM`, `HIGH`, optional)
  - `currentStatus` (enum, optional)
  - `sortBy` (`createdAt`, `updatedAt`, `ticketNumber`, default: `createdAt`)
  - `sortOrder` (`asc`, `desc`, default: `desc`)
  - `page` (int, default: 1)
  - `limit` (int, default: 8, allowed: 8, 20, 50)
- **Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot access campus email from mobile",
      "category": { "id": 1, "name": "Account and Access" },
      "relatedSystem": { "id": 3, "name": "Email" },
      "requestedPriority": "HIGH",
      "currentStatus": "NEW",
      "problemAppearsResolved": false,
      "createdAt": "2026-09-12T14:30:00.000Z",
      "updatedAt": "2026-09-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 8,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### 4.3 Get Ticket Detail (Requester View)
- **Method & Path:** `GET /api/tickets/:id`
- **Access:** Authenticated Requester (Owner only) or Staff/Admin
- **Response `200 OK`:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requester": {
    "id": 1,
    "fullName": "Jiraphat J.",
    "email": "jiraphat@toktickit.local"
  },
  "category": { "id": 1, "name": "Account and Access" },
  "relatedSystem": { "id": 3, "name": "Email" },
  "summary": "Cannot access campus email from mobile",
  "description": "Getting authentication error 500 when syncing inbox.",
  "requestedPriority": "HIGH",
  "itPriority": "HIGH",
  "currentStatus": "NEW",
  "problemAppearsResolved": false,
  "createdAt": "2026-09-12T14:30:00.000Z",
  "updatedAt": "2026-09-12T14:30:00.000Z",
  "attachments": []
}
```
- **Error `404 Not Found`:** Returned if ticket does not exist OR if owned by another requester.

### 4.4 Mark Problem Appears Resolved (Requester Action)
- **Method & Path:** `POST /api/tickets/:id/resolve-indication`
- **Access:** Authenticated Requester (Owner only)
- **Request Body:**
```json
{
  "resolved": true
}
```
- **Response `200 OK`:**
```json
{
  "id": 101,
  "problemAppearsResolved": true,
  "updatedAt": "2026-09-12T14:40:00.000Z"
}
```

### 4.5 Attachment Lifecycle APIs (Preserved from Lab 2)
- `POST /api/tickets/:id/attachments` (multipart/form-data, max 5 MB, max 5 active)
- `GET /api/tickets/:id/attachments/:attachmentId/download` (safe download)
- `DELETE /api/tickets/:id/attachments/:attachmentId` (soft-removal with required reason)

---

## 5. IT Staff Ticket Queue & Workflow APIs

### 5.1 Staff Ticket Queue Query
- **Method & Path:** `GET /api/staff/tickets`
- **Access:** IT Staff, Administrator
- **Query Parameters:**
  - `search` (string, partial match on `ticketNumber` or `summary`)
  - `categoryId` (int)
  - `currentStatus` (enum)
  - `itPriority` (enum: `LOW`, `MEDIUM`, `HIGH`)
  - `ownerId` (`unassigned`, or user ID integer)
  - `sortBy` (`ticketNumber`, `createdAt`, `updatedAt`, `itPriority`, default: `createdAt`)
  - `sortOrder` (`asc`, `desc`, default: `desc`)
  - `page` (int, default: 1)
  - `limit` (int, default: 10, allowed: 10, 25, 50)
- **Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Cannot access campus email from mobile",
      "category": { "id": 1, "name": "Account and Access" },
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "currentStatus": "NEW",
      "requester": { "id": 1, "fullName": "Jiraphat J." },
      "primaryOwner": null,
      "problemAppearsResolved": false,
      "createdAt": "2026-09-12T14:30:00.000Z",
      "updatedAt": "2026-09-12T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
}
```

### 5.2 Claim or Reassign Ticket Owner
- **Method & Path:** `PATCH /api/staff/tickets/:id/owner`
- **Access:** IT Staff, Administrator
- **Request Body:**
```json
{
  "ownerId": 2
}
```
*(Pass `null` or omit to unassign; pass staff user ID to assign. Passing `currentUser.id` represents claiming.)*
- **Response `200 OK`:**
```json
{
  "id": 101,
  "primaryOwnerId": 2,
  "primaryOwner": {
    "id": 2,
    "fullName": "Thanaporn B.",
    "email": "thanaporn@toktickit.local"
  },
  "updatedAt": "2026-09-12T14:45:00.000Z"
}
```

### 5.3 Update Operational IT Priority
- **Method & Path:** `PATCH /api/staff/tickets/:id/priority`
- **Access:** IT Staff, Administrator
- **Request Body:**
```json
{
  "itPriority": "MEDIUM"
}
```
- **Response `200 OK`:**
```json
{
  "id": 101,
  "itPriority": "MEDIUM",
  "updatedAt": "2026-09-12T14:50:00.000Z"
}
```

### 5.4 Update Ticket Status (Workflow Transition)
- **Method & Path:** `PATCH /api/staff/tickets/:id/status`
- **Access:** IT Staff, Administrator
- **Request Body:**
```json
{
  "status": "IN_PROGRESS"
}
```
- **Validation:** Must follow the Status Transition Matrix.
- **Response `200 OK`:**
```json
{
  "id": 101,
  "currentStatus": "IN_PROGRESS",
  "updatedAt": "2026-09-12T14:55:00.000Z"
}
```
- **Error `400 Bad Request`:**
```json
{
  "error": {
    "code": "ILLEGAL_STATUS_TRANSITION",
    "message": "Cannot transition status from NEW to RESOLVED directly"
  }
}
```

---

## 6. Communication APIs (Public Comments & Internal Notes)

### 6.1 List Public Comments
- **Method & Path:** `GET /api/tickets/:id/comments`
- **Access:** Authenticated (Owning Requester, IT Staff, Administrator)
- **Response `200 OK`:**
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "author": { "id": 1, "fullName": "Jiraphat J.", "role": "REQUESTER" },
    "content": "I am still seeing the error code on iOS.",
    "createdAt": "2026-09-12T15:00:00.000Z"
  }
]
```

### 6.2 Post Public Comment
- **Method & Path:** `POST /api/tickets/:id/comments`
- **Access:** Authenticated (Owning Requester, IT Staff, Administrator)
- **Request Body:**
```json
{
  "content": "We have cleared your Exchange sync cache. Please restart your mail client."
}
```
- **Validation:** 1–2000 characters after trimming whitespace.
- **Response `201 Created`:**
```json
{
  "id": 2,
  "ticketId": 101,
  "author": { "id": 2, "fullName": "Thanaporn B.", "role": "IT_STAFF" },
  "content": "We have cleared your Exchange sync cache. Please restart your mail client.",
  "createdAt": "2026-09-12T15:05:00.000Z"
}
```

### 6.3 List Internal Notes
- **Method & Path:** `GET /api/tickets/:id/internal-notes`
- **Access:** IT Staff, Administrator ONLY
- **Response `200 OK`:**
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "author": { "id": 2, "fullName": "Thanaporn B.", "role": "IT_STAFF" },
    "content": "User account was throttled due to 3 failed attempts from off-campus VPN.",
    "createdAt": "2026-09-12T15:02:00.000Z"
  }
]
```
- **Error `403 Forbidden`:** If requested by a Requester.

### 6.4 Post Internal Note
- **Method & Path:** `POST /api/tickets/:id/internal-notes`
- **Access:** IT Staff, Administrator ONLY
- **Request Body:**
```json
{
  "content": "Waiting for network team confirmation on gateway firewall rule."
}
```
- **Response `201 Created`:**
```json
{
  "id": 2,
  "ticketId": 101,
  "author": { "id": 2, "fullName": "Thanaporn B.", "role": "IT_STAFF" },
  "content": "Waiting for network team confirmation on gateway firewall rule.",
  "createdAt": "2026-09-12T15:10:00.000Z"
}
```

---

## 7. Administrator User Management APIs

### 7.1 List Users
- **Method & Path:** `GET /api/admin/users`
- **Access:** Administrator ONLY
- **Query Parameters:**
  - `search` (string, matches `fullName` or `email`)
  - `role` (enum: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
  - `page` (int, default: 1)
  - `limit` (int, default: 10)
- **Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 1,
      "fullName": "Jiraphat J.",
      "email": "jiraphat@toktickit.local",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-10T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "totalItems": 1, "totalPages": 1 }
}
```

### 7.2 Create User
- **Method & Path:** `POST /api/admin/users`
- **Access:** Administrator ONLY
- **Request Body:**
```json
{
  "fullName": "Anan S.",
  "email": "anan.s@toktickit.local",
  "role": "IT_STAFF",
  "initialPassword": "InitialPassword123!"
}
```
- **Response `201 Created`:**
```json
{
  "id": 10,
  "fullName": "Anan S.",
  "email": "anan.s@toktickit.local",
  "role": "IT_STAFF",
  "isActive": true,
  "mustChangePassword": true,
  "createdAt": "2026-09-12T15:30:00.000Z"
}
```
- **Error `409 Conflict`:** Email already registered.

### 7.3 Edit User Account
- **Method & Path:** `PATCH /api/admin/users/:id`
- **Access:** Administrator ONLY
- **Request Body:**
```json
{
  "fullName": "Anan Sompong",
  "email": "anan.sompong@toktickit.local",
  "role": "IT_STAFF",
  "isActive": false
}
```
- **Safeguard Validations:**
  - `400 Bad Request`: Administrator attempting to deactivate own account (`self-deactivation prevention`).
  - `400 Bad Request`: Administrator attempting to deactivate or demote the last active administrator (`last-active-admin protection`).
- **Response `200 OK`:**
```json
{
  "id": 10,
  "fullName": "Anan Sompong",
  "email": "anan.sompong@toktickit.local",
  "role": "IT_STAFF",
  "isActive": false,
  "mustChangePassword": true,
  "updatedAt": "2026-09-12T15:35:00.000Z"
}
```

### 7.4 Reset Initial Password
- **Method & Path:** `POST /api/admin/users/:id/reset-password`
- **Access:** Administrator ONLY
- **Request Body:**
```json
{
  "initialPassword": "NewTempPassword999!"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Password reset successfully; user must change password on next login",
  "mustChangePassword": true
}
```
