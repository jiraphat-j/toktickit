import crypto from "crypto";

export interface SessionData {
  userId: number;
  expiresAt: Date;
}

const sessionStore = new Map<string, SessionData>();

export const SESSION_COOKIE_NAME = "toktickit_session";
export const SESSION_SECRET = process.env.SESSION_SECRET || "toktickit-secret-key-lab3";
export const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(userId: number): string {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  sessionStore.set(token, { userId, expiresAt });
  return token;
}

export function getSession(token: string): SessionData | null {
  const session = sessionStore.get(token);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    sessionStore.delete(token);
    return null;
  }
  return session;
}

export function destroySession(token: string): void {
  sessionStore.delete(token);
}

export function clearAllSessions(): void {
  sessionStore.clear();
}

export function expireSession(token: string): boolean {
  const session = sessionStore.get(token);
  if (!session) return false;
  session.expiresAt = new Date(Date.now() - 1000);
  return true;
}

export function expireAllSessions(): void {
  const past = new Date(Date.now() - 1000);
  for (const session of sessionStore.values()) {
    session.expiresAt = past;
  }
}
