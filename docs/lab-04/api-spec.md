# Lab 4 REST API Specification
### TokTickIT — Actions Taken, Dashboards, and Final Regression

---

## 1. Authentication & Session Context

All protected Lab 4 endpoints require a valid session established via the `toktickit_session` signed HttpOnly cookie.
The server resolves identity and role via `authenticateSessionOrDev` / `requireAuth` and `requireRole` middleware.

### Standard Error Response Shape
All error responses adhere to the standard schema:
```json
{
  "error": {
    "code": "STRING_ERROR_CODE",
    "message": "Human readable description of the error",
    "details": {}
  }
}
```

---

## 2. Actions Taken Endpoints

### 2.1 Create Action Taken
- **URL:** `POST /api/tickets/:ticketId/actions-taken`
- **Authorization:** `IT_STAFF` or `ADMINISTRATOR` (Active account required). Requesters return `403 Forbidden`.
- **Request Headers:**
  - `Content-Type: application/json`
  - `Cookie: toktickit_session=...`

#### Request Body
```json
{
  "actionDateTime": "2026-09-29T10:30:00.000Z", // Optional, ISO string; defaults to current server timestamp
  "description": "Inspected workstation RAM modules and ran memory diagnostics.",
  "result": "Identified faulty 8GB DDR4 stick in slot 2. Removed damaged module.",
  "followUpRequired": true,
  "followUpNote": "Order replacement 8GB DDR4 RAM from vendor.", // Required if followUpRequired is true
  "attachmentNotes": "Refer to diagnostics-log.pdf attached to this ticket." // Optional, max 500 chars
}
```

#### Success Response: `201 Created`
```json
{
  "action": {
    "id": 1,
    "ticketId": 14,
    "actionDateTime": "2026-09-29T10:30:00.000Z",
    "description": "Inspected workstation RAM modules and ran memory diagnostics.",
    "result": "Identified faulty 8GB DDR4 stick in slot 2. Removed damaged module.",
    "performedById": 2,
    "performedBy": {
      "id": 2,
      "fullName": "Somsak ITStaff",
      "email": "somsak@toktickit.com",
      "role": "IT_STAFF"
    },
    "followUpRequired": true,
    "followUpNote": "Order replacement 8GB DDR4 RAM from vendor.",
    "attachmentNotes": "Refer to diagnostics-log.pdf attached to this ticket.",
    "createdAt": "2026-09-29T10:30:05.123Z",
    "updatedAt": "2026-09-29T10:30:05.123Z"
  }
}
```

#### Error Responses
- `400 Bad Request` — Missing `description`, `result`, or `followUpNote` when `followUpRequired=true`.
  - `{"error": {"code": "VALIDATION_FAILED", "message": "followUpNote is mandatory when followUpRequired is true"}}`
- `401 Unauthorized` — No active session.
- `403 Forbidden` — Authenticated user is `REQUESTER`.
- `404 Not Found` — `ticketId` does not exist.

---

### 2.2 List Actions Taken for Ticket
- **URL:** `GET /api/tickets/:ticketId/actions-taken`
- **Authorization:**
  - `IT_STAFF` / `ADMINISTRATOR`: Permitted on any existing ticket.
  - `REQUESTER`: Permitted ONLY if `ticket.requesterId == currentUser.id`. Returns `404 Not Found` if ticket belongs to another user (Zero Leakage).

#### Success Response: `200 OK`
```json
{
  "actions": [
    {
      "id": 1,
      "ticketId": 14,
      "actionDateTime": "2026-09-29T10:30:00.000Z",
      "description": "Inspected workstation RAM modules and ran memory diagnostics.",
      "result": "Identified faulty 8GB DDR4 stick in slot 2. Removed damaged module.",
      "performedById": 2,
      "performedBy": {
        "id": 2,
        "fullName": "Somsak ITStaff",
        "email": "somsak@toktickit.com",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Order replacement 8GB DDR4 RAM from vendor.",
      "attachmentNotes": "Refer to diagnostics-log.pdf attached to this ticket.",
      "createdAt": "2026-09-29T10:30:05.123Z",
      "updatedAt": "2026-09-29T10:30:05.123Z"
    }
  ]
}
```

---

### 2.3 Retrieve Single Action Taken
- **URL:** `GET /api/actions-taken/:id`
- **Authorization:** `IT_STAFF`, `ADMINISTRATOR`, or owning `REQUESTER`.
- **Response:** `200 OK` with single action object, or `404 Not Found`.

---

### 2.4 Update Action Taken
- **URL:** `PATCH /api/actions-taken/:id`
- **Authorization:** `IT_STAFF` or `ADMINISTRATOR`. Requesters receive `403 Forbidden`.
- **Concurrency Control:** Clients include `updatedAt` in request body. If the record on disk has been updated after that timestamp, returns `409 Conflict`.

#### Request Body
```json
{
  "description": "Updated description with further test results.",
  "result": "Workstation confirmed stable after 12-hour burn-in.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": null,
  "expectedUpdatedAt": "2026-09-29T10:30:05.123Z"
}
```

#### Success Response: `200 OK`
Returns the updated Action Taken record.

---

## 3. Dashboard Endpoints

### 3.1 Requester Dashboard
- **URL:** `GET /api/dashboard/requester`
- **Authorization:** `REQUESTER`. (Staff / Admin calling this endpoint return their own requester context if applicable, or `403 Forbidden`).
- **Scoping:** Strictly queries where `requesterId = currentUser.id`.

#### Success Response: `200 OK`
```json
{
  "metrics": {
    "totalOpenTickets": 3,
    "waitingForRequesterCount": 1,
    "recentlyUpdatedCount": 4,
    "recentlyResolvedCount": 2
  },
  "attentionTickets": [
    {
      "id": 14,
      "ticketNumber": "TKT-2026-000014",
      "summary": "Cannot connect to KMUTT-Secure Wi-Fi in building CB2",
      "currentStatus": "WAITING_FOR_REQUESTER",
      "itPriority": "MEDIUM",
      "updatedAt": "2026-09-29T11:00:00.000Z"
    }
  ],
  "recentTickets": [
    {
      "id": 15,
      "ticketNumber": "TKT-2026-000015",
      "summary": "Request license key for MATLAB 2026",
      "currentStatus": "IN_PROGRESS",
      "itPriority": "LOW",
      "updatedAt": "2026-09-29T11:15:00.000Z"
    }
  ]
}
```

---

### 3.2 IT Staff Dashboard
- **URL:** `GET /api/dashboard/staff`
- **Authorization:** `IT_STAFF` or `ADMINISTRATOR`. Requesters return `403 Forbidden`.

#### Success Response: `200 OK`
```json
{
  "metrics": {
    "unassignedCount": 7,
    "myTicketsCount": 4,
    "criticalHighCount": 3,
    "myActionsCount": 12
  },
  "statusBreakdown": {
    "NEW": 5,
    "OPEN": 2,
    "IN_PROGRESS": 6,
    "WAITING_FOR_REQUESTER": 2,
    "RESOLVED": 4,
    "CLOSED": 15,
    "REOPENED": 1,
    "CANCELLED": 2
  },
  "priorityBreakdown": {
    "LOW": 4,
    "MEDIUM": 6,
    "HIGH": 3,
    "CRITICAL": 2
  },
  "recentTickets": [
    {
      "id": 16,
      "ticketNumber": "TKT-2026-000016",
      "summary": "Database connection timeout in Lab 502",
      "currentStatus": "IN_PROGRESS",
      "itPriority": "CRITICAL",
      "primaryOwner": {
        "id": 2,
        "fullName": "Somsak ITStaff"
      },
      "updatedAt": "2026-09-29T11:30:00.000Z"
    }
  ],
  "myRecentActions": [
    {
      "id": 10,
      "ticketId": 14,
      "ticketNumber": "TKT-2026-000014",
      "actionDateTime": "2026-09-29T10:30:00.000Z",
      "description": "Reconfigured AP radio frequencies",
      "result": "Interference resolved"
    }
  ]
}
```

---

## 4. Ticket Status Transition & Resolution Gate Endpoint

- **URL:** `PATCH /api/staff/tickets/:id/status`
- **Authorization:** `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body:**
  ```json
  {
    "newStatus": "RESOLVED"
  }
  ```

### Resolution Gate Business Logic
When `newStatus === 'RESOLVED'`:
1. Check `currentStatus` is in `('IN_PROGRESS', 'WAITING_FOR_REQUESTER')`. If not, return `400 Bad Request` (`ILLEGAL_STATUS_TRANSITION`).
2. Query `prisma.actionTaken.count({ where: { ticketId: id } })`.
3. If `count === 0`:
   - Return `400 Bad Request`:
     ```json
     {
       "error": {
         "code": "RESOLUTION_GATE_FAILED",
         "message": "Ticket cannot be resolved without at least one recorded Action Taken."
       }
     }
     ```
4. If `count >= 1`:
   - Update `currentStatus` to `RESOLVED`.
   - Update `updatedAt` to current timestamp.
   - Return `200 OK` with updated ticket object.
