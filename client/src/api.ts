const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const DEV_REQUESTER_STORAGE_KEY = "toktickit.devRequesterId";

export interface Category {
  id: number;
  name: string;
  isActive?: boolean;
}

export interface RelatedSystem {
  id: number;
  name: string;
  isActive?: boolean;
}

export type Priority = "LOW" | "MEDIUM" | "HIGH";

export type TicketStatus = "NEW";

export interface DevRequester {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface AttachmentMeta {
  id: number;
  ticketId: number;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  isRemoved: boolean;
  removedAt?: string | null;
  removedReason?: string | null;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
  itPriority?: Priority | null;
  primaryOwnerId?: number | null;
  primaryOwner?: { id: number; fullName: string; email: string } | null;
  currentStatus: TicketStatus;
  problemAppearsResolved?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: DevRequester;
  attachments?: AttachmentMeta[];
}

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: { id: number; name: string };
  relatedSystem?: { id: number; name: string };
  requestedPriority: Priority;
  itPriority?: Priority | null;
  currentStatus: TicketStatus;
  problemAppearsResolved?: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    attachments: number;
  };
}

export interface TicketListResponse {
  items: TicketListItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface TicketQueryParams {
  search?: string;
  categoryId?: number;
  requestedPriority?: Priority;
  currentStatus?: TicketStatus;
  sortBy?: "createdAt" | "updatedAt" | "ticketNumber";
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export interface CreateTicketPayload {
  categoryId: number;
  relatedSystemId: number;
  summary: string;
  description: string;
  requestedPriority: Priority;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  const healthRes = await fetch(`${API_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error("Failed to connect to API health check");
  }

  const categoriesRes = await fetch(`${API_URL}/api/categories`);
  if (!categoriesRes.ok) {
    throw new Error("Failed to fetch IT request categories");
  }

  const categories: Category[] = await categoriesRes.json();
  return { online: true, categories };
}

export async function fetchActiveDevRequesters(): Promise<DevRequester[]> {
  const res = await fetch(`${API_URL}/api/dev-requesters`);
  if (!res.ok) {
    throw new Error(`Failed to load development requesters (${res.status})`);
  }
  return res.json();
}

export async function fetchActiveCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) {
    throw new Error(`Failed to load categories (${res.status})`);
  }
  return res.json();
}

export async function fetchActiveRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_URL}/api/related-systems`);
  if (!res.ok) {
    throw new Error(`Failed to load related systems (${res.status})`);
  }
  return res.json();
}

export async function createTicket(
  payload: CreateTicketPayload,
  requesterId: number,
  idempotencyKey: string
): Promise<Ticket> {
  const res = await fetch(`${API_URL}/api/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Requester-Id": requesterId.toString(),
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function uploadTicketAttachment(
  ticketId: number,
  file: File,
  requesterId: number
): Promise<AttachmentMeta> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    headers: {
      "X-Dev-Requester-Id": requesterId.toString(),
    },
    body: formData,
  });

  if (!res.ok) {
    let errorMsg = `Attachment upload failed (${res.status})`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchMyTickets(
  requesterId: number,
  params?: TicketQueryParams
): Promise<TicketListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.categoryId) query.set("categoryId", params.categoryId.toString());
  if (params?.requestedPriority) query.set("requestedPriority", params.requestedPriority);
  if (params?.currentStatus) query.set("currentStatus", params.currentStatus);
  if (params?.sortBy) query.set("sortBy", params.sortBy);
  if (params?.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params?.page) query.set("page", params.page.toString());
  if (params?.pageSize) query.set("pageSize", params.pageSize.toString());

  const queryString = query.toString();
  const url = `${API_URL}/api/tickets${queryString ? `?${queryString}` : ""}`;

  const res = await fetch(url, {
    headers: {
      "X-Dev-Requester-Id": requesterId.toString(),
    },
  });

  if (!res.ok) {
    let errorMsg = `Failed to load tickets (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export type TicketDetail = Ticket;

export async function fetchTicketDetail(
  requesterId: number,
  ticketId: number
): Promise<TicketDetail> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}`, {
    headers: {
      "X-Dev-Requester-Id": requesterId.toString(),
    },
  });

  if (!res.ok) {
    let errorMsg = `Failed to load ticket details (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function removeTicketAttachment(
  requesterId: number,
  attachmentId: number,
  reason: string
): Promise<AttachmentMeta> {
  const res = await fetch(`${API_URL}/api/attachments/${attachmentId}/remove`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "X-Dev-Requester-Id": requesterId.toString(),
    },
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to remove attachment (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export function getAttachmentDownloadUrl(attachmentId: number): string {
  return `${API_URL}/api/attachments/${attachmentId}/download`;
}

export function getStoredRequesterId(): number | null {
  const raw = sessionStorage.getItem(DEV_REQUESTER_STORAGE_KEY);
  if (!raw) return null;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) ? null : parsed;
}

export function setStoredRequesterId(id: number | null): void {
  if (id === null) {
    sessionStorage.removeItem(DEV_REQUESTER_STORAGE_KEY);
  } else {
    sessionStorage.setItem(DEV_REQUESTER_STORAGE_KEY, id.toString());
  }
}

// ---------------------------------------------------------------------------
// Lab 3 Authentication & User APIs
// ---------------------------------------------------------------------------
export type UserRole = "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  mustChangePassword: boolean;
}

export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    let errorMsg = "Invalid email or password";
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
    } catch {}
    throw new Error(errorMsg);
  }

  const data = await res.json();
  return data.user;
}

export async function logoutUser(): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Failed to logout");
  }
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function changeUserPassword(
  newPassword: string,
  confirmPassword: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ newPassword, confirmPassword }),
  });

  if (!res.ok) {
    let errorMsg = "Failed to update password";
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      if (data.error?.details && data.error.details.length > 0) {
        errorMsg = data.error.details.map((d: any) => d.message).join(" ");
      }
    } catch {}
    throw new Error(errorMsg);
  }
}

export async function toggleProblemResolved(
  ticketId: number,
  resolved: boolean
): Promise<{ id: number; problemAppearsResolved: boolean; updatedAt: string }> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/resolve-indication`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ resolved }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to update problem resolution indicator (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// IT Staff Ticket Queue & Staff Directory APIs (Issue #37, AC-12, BR-23)
// ---------------------------------------------------------------------------
export type StaffTicketStatus = "NEW" | "OPEN" | "IN_PROGRESS" | "RESOLVED";

export interface StaffTicketSummary {
  id: number;
  ticketNumber: string;
  summary: string;
  category: { id: number; name: string };
  requestedPriority: Priority;
  itPriority: Priority;
  currentStatus: StaffTicketStatus;
  requester: { id: number; fullName: string; email: string };
  primaryOwner: { id: number; fullName: string; email: string } | null;
  problemAppearsResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffTicketQueuePagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface StaffTicketQueueResponse {
  items: StaffTicketSummary[];
  pagination: StaffTicketQueuePagination;
}

export interface StaffTicketFilterParams {
  search?: string;
  categoryId?: number;
  currentStatus?: StaffTicketStatus | "";
  itPriority?: Priority | "";
  ownerId?: string | number; // "unassigned", "me", or number
  sortBy?: "ticketNumber" | "createdAt" | "updatedAt" | "itPriority";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface StaffMember {
  id: number;
  fullName: string;
  email: string;
  role: "IT_STAFF" | "ADMINISTRATOR";
}

export async function fetchStaffTickets(
  params: StaffTicketFilterParams = {}
): Promise<StaffTicketQueueResponse> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.categoryId !== undefined && params.categoryId !== null && params.categoryId !== (0 as any)) {
    query.set("categoryId", String(params.categoryId));
  }
  if (params.currentStatus) query.set("currentStatus", params.currentStatus);
  if (params.itPriority) query.set("itPriority", params.itPriority);
  if (params.ownerId !== undefined && params.ownerId !== null && params.ownerId !== "") {
    query.set("ownerId", String(params.ownerId));
  }
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.page !== undefined && params.page !== null) {
    query.set("page", String(params.page));
  }
  if (params.limit !== undefined && params.limit !== null) {
    query.set("limit", String(params.limit));
  }

  const url = `${API_URL}/api/staff/tickets${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch staff tickets (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchStaffMembers(): Promise<StaffMember[]> {
  const res = await fetch(`${API_URL}/api/staff/members`, {
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch staff members (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Lab 3 Ticket Operations & Communication APIs (Issue #38)
// ---------------------------------------------------------------------------
export interface TicketComment {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  };
}

export interface InternalNote {
  id: number;
  ticketId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    fullName: string;
    role: "IT_STAFF" | "ADMINISTRATOR";
  };
}

export async function updateTicketOwner(
  ticketId: number,
  ownerId: number | null
): Promise<{ id: number; primaryOwnerId: number | null; primaryOwner: any; updatedAt: string }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/owner`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ownerId }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to update ticket owner (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function updateTicketPriority(
  ticketId: number,
  itPriority: Priority
): Promise<{ id: number; itPriority: Priority; updatedAt: string }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ itPriority }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to update IT priority (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function updateTicketStatus(
  ticketId: number,
  status: TicketStatus
): Promise<{ id: number; currentStatus: TicketStatus; updatedAt: string }> {
  const res = await fetch(`${API_URL}/api/staff/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to update ticket status (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchTicketComments(ticketId: number): Promise<TicketComment[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch comments (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function createTicketComment(
  ticketId: number,
  content: string
): Promise<TicketComment> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to post comment (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function fetchInternalNotes(ticketId: number): Promise<InternalNote[]> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/internal-notes`, {
    credentials: "include",
  });

  if (!res.ok) {
    let errorMsg = `Failed to fetch internal notes (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export async function createInternalNote(
  ticketId: number,
  content: string
): Promise<InternalNote> {
  const res = await fetch(`${API_URL}/api/tickets/${ticketId}/internal-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    let errorMsg = `Failed to post internal note (${res.status})`;
    try {
      const data = await res.json();
      if (data.error?.message) errorMsg = data.error.message;
      else if (data.message) errorMsg = data.message;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}


