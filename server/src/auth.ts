import { Request, Response, NextFunction, Router } from "express";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";
import {
  createSession,
  getSession,
  destroySession,
  SESSION_COOKIE_NAME,
} from "./session.js";
import type { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  sessionToken?: string;
}

export function extractSessionToken(req: Request): string | null {
  if (req.signedCookies && req.signedCookies[SESSION_COOKIE_NAME]) {
    return req.signedCookies[SESSION_COOKIE_NAME];
  }
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return req.cookies[SESSION_COOKIE_NAME];
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  return null;
}

export function validatePasswordComplexity(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (typeof password !== "string" || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter.");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter.");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number.");
  }
  return { valid: errors.length === 0, errors };
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractSessionToken(req);
  if (!token) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. No session provided.",
      },
    });
    return;
  }

  const session = getSession(token);
  if (!session) {
    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Session is invalid or has expired.",
      },
    });
    return;
  }

  try {
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });

    if (!user || !user.isActive) {
      destroySession(token);
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "User account not found or is deactivated.",
        },
      });
      return;
    }

    req.user = user;
    req.sessionToken = token;

    // BR-04: If mustChangePassword is true, block access to all routes except allowed auth routes
    if (user.mustChangePassword) {
      const allowedEndings = [
        "/api/auth/change-password",
        "/api/auth/me",
        "/api/auth/logout",
      ];
      const currentUrl = (req.originalUrl || req.url).split("?")[0];
      const isAllowed = allowedEndings.some((allowed) => currentUrl.endsWith(allowed));

      if (!isAllowed) {
        res.status(403).json({
          error: {
            code: "PASSWORD_CHANGE_REQUIRED",
            message: "Password change is required before accessing application resources.",
          },
        });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to authenticate session.",
      },
    });
  }
}

export const authRouter = Router();

// POST /api/auth/login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  const details: { field: string; message: string }[] = [];

  if (!email || typeof email !== "string" || !email.trim()) {
    details.push({ field: "email", message: "Email is required." });
  }
  if (!password || typeof password !== "string") {
    details.push({ field: "password", message: "Password is required." });
  }

  if (details.length > 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid login parameters.",
        details,
      },
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const prisma = getPrisma();

  try {
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const sendGenericAuthError = () => {
      res.status(401).json({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
    };

    if (!user || !user.isActive) {
      sendGenericAuthError();
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      sendGenericAuthError();
      return;
    }

    const token = createSession(user.id);

    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      signed: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        isActive: user.isActive,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Login failed.",
      },
    });
  }
});

// POST /api/auth/logout
authRouter.post("/logout", (req: AuthenticatedRequest, res: Response) => {
  const token = extractSessionToken(req);
  if (token) {
    destroySession(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME);
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

// GET /api/auth/me
authRouter.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    user: req.user,
  });
});

// POST /api/auth/change-password
authRouter.post("/change-password", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { newPassword, confirmPassword } = req.body || {};
  const details: { field: string; message: string }[] = [];

  const complexity = validatePasswordComplexity(newPassword);
  if (!complexity.valid) {
    details.push({
      field: "newPassword",
      message: complexity.errors.join(" "),
    });
  }

  if (newPassword !== confirmPassword) {
    details.push({
      field: "confirmPassword",
      message: "Passwords do not match.",
    });
  }

  if (details.length > 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid password data.",
        details,
      },
    });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const prisma = getPrisma();
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update password.",
      },
    });
  }
});

// GET /api/auth/protected-check (for AUTH-05 verification)
authRouter.get("/protected-check", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    message: "Access granted to protected endpoint",
    user: req.user,
  });
});
