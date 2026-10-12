import { TicketStatus } from "@prisma/client";

/**
 * Permitted status transitions matrix for TokTickIT (Lab 4 Sprint).
 * Reference: docs/lab-04/specification.md (Section 7: Ticket Status Transition Matrix)
 *
 * State Machine Rules:
 * - NEW ➔ OPEN, IN_PROGRESS, CANCELLED (Direct jump to RESOLVED or CLOSED is illegal)
 * - OPEN ➔ IN_PROGRESS, WAITING_FOR_REQUESTER, RESOLVED, CANCELLED
 * - IN_PROGRESS ➔ WAITING_FOR_REQUESTER, RESOLVED, CANCELLED (RESOLVED requires actionsCount >= 1)
 * - WAITING_FOR_REQUESTER ➔ IN_PROGRESS, RESOLVED, CANCELLED (RESOLVED requires actionsCount >= 1)
 * - RESOLVED ➔ CLOSED, REOPENED (Direct jump to IN_PROGRESS or OPEN is illegal)
 * - CLOSED ➔ REOPENED (Maintains Lab 3 regression lifecycle test compatibility)
 * - REOPENED ➔ OPEN, IN_PROGRESS, RESOLVED, CANCELLED (RESOLVED requires actionsCount >= 1)
 * - CANCELLED ➔ REOPENED (Maintains Lab 3 regression lifecycle test compatibility)
 */
export const PERMITTED_STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  NEW: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
  OPEN: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  IN_PROGRESS: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  WAITING_FOR_REQUESTER: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  RESOLVED: [TicketStatus.CLOSED, TicketStatus.REOPENED],
  CLOSED: [TicketStatus.REOPENED],
  REOPENED: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
  CANCELLED: [TicketStatus.REOPENED],
};

/**
 * Check if transitioning from currentStatus to targetStatus is permitted.
 */
export function isPermittedStatusTransition(
  currentStatus: TicketStatus,
  targetStatus: TicketStatus
): boolean {
  if (currentStatus === targetStatus) return true;
  const permitted = PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
  return permitted.includes(targetStatus);
}
