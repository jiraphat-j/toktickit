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
  currentStatus: TicketStatus;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: DevRequester;
  attachments?: AttachmentMeta[];
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
