const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const DEV_REQUESTER_STORAGE_KEY = "toktickit.devRequesterId";

export interface Category {
  id: number;
  name: string;
}

export interface DevRequester {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
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
