import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// Context Middleware: Validate X-Dev-Requester-Id
// ---------------------------------------------------------------------------
export interface RequesterRequest extends Request {
  devRequester?: {
    id: number;
    fullName: string;
    email: string;
    isActive: boolean;
  };
}

export async function requireDevRequester(
  req: RequesterRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const requesterIdHeader = req.headers["x-dev-requester-id"];

  if (!requesterIdHeader || typeof requesterIdHeader !== "string") {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "X-Dev-Requester-Id header is required and must be a valid integer ID.",
      },
    });
    return;
  }

  const requesterId = parseInt(requesterIdHeader, 10);
  if (isNaN(requesterId) || requesterId <= 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "X-Dev-Requester-Id header must be a positive integer ID.",
      },
    });
    return;
  }

  try {
    const prisma = getPrisma();
    const requester = await prisma.devRequester.findUnique({
      where: { id: requesterId },
    });

    if (!requester || !requester.isActive) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Development Requester not found or is currently inactive.",
        },
      });
      return;
    }

    req.devRequester = requester;
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to validate Development Requester context.",
      },
    });
  }
}

// ---------------------------------------------------------------------------
// Health Check (Lab 1)
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Reference Data APIs (Lab 2 Issue 2)
// ---------------------------------------------------------------------------

// GET /api/dev-requesters — returns active requesters in id asc order
app.get("/api/dev-requesters", async (_req: Request, res: Response) => {
  try {
    const requesters = await getPrisma().devRequester.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
      },
    });
    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch development requesters.",
      },
    });
  }
});

// GET /api/categories — returns active categories in id asc order
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const categories = await getPrisma().category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch categories.",
      },
    });
  }
});

// GET /api/related-systems — returns active related systems in name asc order
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const systems = await getPrisma().relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
      },
    });
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch related systems.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Ticket Scoped Route Placeholder for Context Middleware (Issue 2)
// (Will be fully expanded in Issue 3 & Issue 7)
// ---------------------------------------------------------------------------
app.get("/api/tickets", requireDevRequester, (req: RequesterRequest, res: Response) => {
  res.status(200).json({
    message: "Requester context validated",
    requester: req.devRequester,
    items: [],
    pagination: { page: 1, pageSize: 8, total: 0, totalPages: 0 },
  });
});

export default app;
