# Lab 2 REST API Specification
### TokTickIT — Requester Ticketing MVP with UI Foundation

---

## 1. Global Conventions & Protocol

### 1.1 Base URL & Format
- Base Path: `/api`
- Content Type: `application/json; charset=utf-8` (except multipart file upload: `multipart/form-data`)
- Timestamp Format: ISO-8601 UTC string (e.g., `2026-08-29T12:00:00.000Z`)

### 1.2 Development Requester Context
- **Testing Mechanism Header:** All requester-scoped endpoints require the header `X-Dev-Requester-Id: <integer>`.
- `X-Dev-Requester-Id` is verified on every request by backend middleware against active `DevRequester` records in PostgreSQL.
- If missing, non-numeric, unknown, or pointing to an inactive requester (`isActive = false`), the API immediately responds with `400 Bad Request`.
- **Security / Lab 3 Transition:** The request body for ticket creation NEVER accepts `requesterId`. In Lab 3, this header will be replaced with a secure session cookie/JWT without altering database schemas or ownership models.

### 1.3 Ownership & Information Isolation Policy
- A requester can only view, list, create, or modify resources (Tickets, Attachments) that belong to their own `requesterId`.
- Accessing a Ticket or Attachment belonging to a different Requester returns **`404 Not Found`** (not `403 Forbidden`) to prevent enumeration/information leakage regarding whether a specific ticket ID exists.

### 1.4 Standard JSON Error Response Shape
All error responses return a standardized payload:
```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Human-readable error explanation",
    "details": [
      {
        "field": "summary",
        "message": "Summary must be between 5 and 150 characters"
      }
    ]
  }
}
```

Standard Error Codes:
- `BAD_REQUEST` (400) — Validation failure, invalid query parameters, or invalid header.
- `NOT_FOUND` (404) — Resource does not exist or belongs to another requester.
- `CONFLICT` (409) — Idempotency key reused with different request payload.
- `PAYLOAD_TOO_LARGE` (413) — Uploaded attachment exceeds 5 MB.
- `UNSUPPORTED_MEDIA_TYPE` (415) — File extension or MIME type not supported.
- `INTERNAL_SERVER_ERROR` (500) — Unhandled server error.

---

## 2. Reference Data APIs

### 2.1 List Active Development Requesters
- **Method & Path:** `GET /api/dev-requesters`
- **Authentication / Context:** None required
- **Description:** Returns all Development Requesters with `isActive: true` sorted by `id ASC`.
- **Response `200 OK`:**
```json
[
  {
    "id": 1,
    "fullName": "Somchai Jaidee",
    "email": "somchai.j@kmutt.ac.th",
    "isActive": true
  },
  {
    "id": 2,
    "fullName": "Suda Sukjai",
    "email": "suda.s@kmutt.ac.th",
    "isActive": true
  }
]
```

### 2.2 List Active Categories
- **Method & Path:** `GET /api/categories`
- **Authentication / Context:** None required
- **Description:** Returns all ticket categories with `isActive: true` sorted by `id ASC`.
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Account and Access", "isActive": true },
  { "id": 2, "name": "Hardware", "isActive": true },
  { "id": 3, "name": "Software", "isActive": true },
  { "id": 4, "name": "Network", "isActive": true }
]
```

### 2.3 List Active Related Systems
- **Method & Path:** `GET /api/related-systems`
- **Authentication / Context:** None required
- **Description:** Returns all related systems with `isActive: true` sorted by `name ASC`.
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Campus Wi-Fi", "isActive": true },
  { "id": 2, "name": "Corporate Laptop", "isActive": true },
  { "id": 3, "name": "Email", "isActive": true },
  { "id": 4, "name": "Grade Submission App", "isActive": true },
  { "id": 5, "name": "LEB2 App", "isActive": true },
  { "id": 6, "name": "Printer", "isActive": true },
  { "id": 7, "name": "VPN", "isActive": true }
]
```

---

## 3. Ticket Management APIs

### 3.1 Create Ticket
- **Method & Path:** `POST /api/tickets`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
  - `Idempotency-Key: <uuid-v4>` (Optional, highly recommended)
- **Request Body:**
```json
{
  "categoryId": 2,
  "relatedSystemId": 2,
  "summary": "Laptop screen flickers intermittently",
  "description": "The corporate laptop display turns black and flickers when connecting to external HDMI monitor.",
  "requestedPriority": "HIGH"
}
```
- **Validation Rules:**
  - `categoryId`: Positive integer, must exist in `Category` table and be `isActive: true`.
  - `relatedSystemId`: Positive integer, must exist in `RelatedSystem` table and be `isActive: true`.
  - `summary`: String, trimmed length 5–150 characters.
  - `description`: String, trimmed length 10–2000 characters. Whitespace only is rejected.
  - `requestedPriority`: Enum string (`LOW`, `MEDIUM`, `HIGH`).
  - Prohibited fields: `ticketNumber`, `status`, `currentStatus`, `requesterId`, `createdAt`, `updatedAt`, `itPriority`.
- **Idempotency Behavior (BR-14, BR-36):**
  - If `Idempotency-Key` is provided, the backend hashes the payload (`requestFingerprint`) and stores a `TicketCreationRequest` for 24 hours.
  - Duplicate identical request (`same key + same fingerprint`) returns `201 Created` with the previously created Ticket.
  - Conflict request (`same key + different fingerprint`) returns `409 Conflict`.
- **Response `201 Created`:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requesterId": 1,
  "categoryId": 2,
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystemId": 2,
  "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
  "summary": "Laptop screen flickers intermittently",
  "description": "The corporate laptop display turns black and flickers when connecting to external HDMI monitor.",
  "requestedPriority": "HIGH",
  "itPriority": null,
  "currentStatus": "NEW",
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z"
}
```

### 3.2 List My Tickets
- **Method & Path:** `GET /api/tickets`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
- **Query Parameters:**
  - `search` (string, optional): Substring match against `ticketNumber` or `summary` (case-insensitive).
  - `categoryId` (integer, optional): Filter by category ID.
  - `requestedPriority` (string, optional): Filter by priority (`LOW`, `MEDIUM`, `HIGH`).
  - `currentStatus` (string, optional): Filter by status (`NEW`).
  - `sortBy` (string, optional, default: `createdAt`): Allowed values: `createdAt`, `updatedAt`, `ticketNumber`.
  - `sortOrder` (string, optional, default: `desc`): Allowed values: `asc`, `desc`. Secondary sort is always `id desc`.
  - `page` (integer, optional, default: `1`): 1-indexed page number (must be >= 1).
  - `pageSize` (integer, optional, default: `8`): Items per page. Allowed values: `8`, `20`, `50`.
- **Validation Errors:** Invalid `sortBy`, `sortOrder`, non-numeric `page`, `page < 1`, or invalid `pageSize` returns `400 Bad Request`. Out-of-range valid page returns empty `items` with valid `pagination`.
- **Response `200 OK`:**
```json
{
  "items": [
    {
      "id": 101,
      "ticketNumber": "TKT-2026-000101",
      "summary": "Laptop screen flickers intermittently",
      "category": { "id": 2, "name": "Hardware" },
      "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
      "requestedPriority": "HIGH",
      "itPriority": null,
      "currentStatus": "NEW",
      "createdAt": "2026-08-29T12:00:00.000Z",
      "updatedAt": "2026-08-29T12:00:00.000Z",
      "_count": { "attachments": 2 }
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 8,
    "total": 1,
    "totalPages": 1
  }
}
```

### 3.3 Get Owned Ticket Detail
- **Method & Path:** `GET /api/tickets/:id`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
- **Path Parameters:**
  - `id` (integer): ID of the Ticket.
- **Ownership Rule:** If Ticket does not exist OR belongs to another requester, returns `404 Not Found`.
- **Response `200 OK`:**
```json
{
  "id": 101,
  "ticketNumber": "TKT-2026-000101",
  "requesterId": 1,
  "requester": { "id": 1, "fullName": "Somchai Jaidee", "email": "somchai.j@kmutt.ac.th" },
  "categoryId": 2,
  "category": { "id": 2, "name": "Hardware" },
  "relatedSystemId": 2,
  "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
  "summary": "Laptop screen flickers intermittently",
  "description": "The corporate laptop display turns black and flickers when connecting to external HDMI monitor.",
  "requestedPriority": "HIGH",
  "itPriority": null,
  "currentStatus": "NEW",
  "createdAt": "2026-08-29T12:00:00.000Z",
  "updatedAt": "2026-08-29T12:00:00.000Z",
  "attachments": [
    {
      "id": 15,
      "originalFileName": "screenshot_error.png",
      "mimeType": "image/png",
      "sizeBytes": 245120,
      "uploadedAt": "2026-08-29T12:05:00.000Z",
      "isRemoved": false,
      "removedAt": null,
      "removedReason": null
    }
  ]
}
```

---

## 4. Attachment APIs

### 4.1 Upload Attachment
- **Method & Path:** `POST /api/tickets/:id/attachments`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
  - `Content-Type: multipart/form-data`
- **Form Fields:**
  - `file`: Single binary file
- **Constraints & Business Rules:**
  - Allowed MIME/Types: `image/jpeg` (.jpg, .jpeg), `image/png` (.png), `image/webp` (.webp), `application/pdf` (.pdf).
  - Maximum size: 5 MB (5,242,880 bytes). Excess file returns `413 Payload Too Large`.
  - Allowed active attachments limit: Max 5 active (`isRemoved: false`) attachments per Ticket. If already at 5, returns `400 Bad Request`.
  - Non-owner ticket returns `404 Not Found`.
- **Response `201 Created`:**
```json
{
  "id": 16,
  "ticketId": 101,
  "originalFileName": "crash_log.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 1048576,
  "uploadedAt": "2026-08-29T12:10:00.000Z",
  "isRemoved": false,
  "removedAt": null,
  "removedReason": null
}
```

### 4.2 List Ticket Attachments Metadata
- **Method & Path:** `GET /api/tickets/:id/attachments`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
- **Response `200 OK`:**
```json
[
  {
    "id": 15,
    "ticketId": 101,
    "originalFileName": "screenshot_error.png",
    "mimeType": "image/png",
    "sizeBytes": 245120,
    "uploadedAt": "2026-08-29T12:05:00.000Z",
    "isRemoved": false,
    "removedAt": null,
    "removedReason": null
  },
  {
    "id": 14,
    "ticketId": 101,
    "originalFileName": "wrong_file.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 512000,
    "uploadedAt": "2026-08-29T12:01:00.000Z",
    "isRemoved": true,
    "removedAt": "2026-08-29T12:04:00.000Z",
    "removedReason": "Uploaded incorrect log file"
  }
]
```

### 4.3 Download Active Attachment
- **Method & Path:** `GET /api/attachments/:id/download`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
- **Behavior:**
  - If attachment does not exist, belongs to another requester, or has `isRemoved: true` ➔ returns **`404 Not Found`**.
  - On success, streams binary file with headers:
    - `Content-Type: <mimeType>`
    - `Content-Disposition: attachment; filename="<sanitized_originalFileName>"`
    - `Content-Length: <sizeBytes>`

### 4.4 Soft-Remove Attachment
- **Method & Path:** `PATCH /api/attachments/:id/remove`
- **Headers:**
  - `X-Dev-Requester-Id: <id>` (Required)
  - `Content-Type: application/json`
- **Request Body:**
```json
{
  "reason": "Uploaded confidential invoice by accident"
}
```
- **Validation Rules:**
  - `reason`: String, minimum 3 characters after trimming.
  - If attachment does not exist or is not owned by current requester ➔ returns `404 Not Found`.
  - If attachment is already removed ➔ returns `400 Bad Request`.
- **Response `200 OK`:**
```json
{
  "id": 15,
  "ticketId": 101,
  "originalFileName": "screenshot_error.png",
  "mimeType": "image/png",
  "sizeBytes": 245120,
  "uploadedAt": "2026-08-29T12:05:00.000Z",
  "isRemoved": true,
  "removedAt": "2026-08-29T12:15:00.000Z",
  "removedReason": "Uploaded confidential invoice by accident"
}
```
