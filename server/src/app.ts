import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
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
// Helpers: Ticket Number Generator & Idempotency Fingerprint
// ---------------------------------------------------------------------------
export async function generateTicketNumber(): Promise<string> {
  const prisma = getPrisma();
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ticket_sequence START 1;`);
  const result = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(`SELECT nextval('ticket_sequence');`);
  const seqNum = Number(result[0].nextval);
  const year = new Date().getFullYear();
  return `TKT-${year}-${String(seqNum).padStart(6, "0")}`;
}

export function computeRequestFingerprint(payload: Record<string, any>): string {
  const normalized = {
    categoryId: Number(payload.categoryId),
    relatedSystemId: Number(payload.relatedSystemId),
    summary: typeof payload.summary === "string" ? payload.summary.trim() : "",
    description: typeof payload.description === "string" ? payload.description.trim() : "",
    requestedPriority: String(payload.requestedPriority || "").trim(),
  };
  return crypto.createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
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
// Ticket Creation API (Lab 2 Issue 3)
// ---------------------------------------------------------------------------
app.post("/api/tickets", requireDevRequester, async (req: RequesterRequest, res: Response) => {
  const prisma = getPrisma();
  const requester = req.devRequester!;
  const { categoryId, relatedSystemId, summary, description, requestedPriority } = req.body;

  const details: { field: string; message: string }[] = [];

  // Summary validation (5–150 chars after trim)
  const trimmedSummary = typeof summary === "string" ? summary.trim() : "";
  if (!trimmedSummary || trimmedSummary.length < 5 || trimmedSummary.length > 150) {
    details.push({
      field: "summary",
      message: "Summary is required and must be between 5 and 150 characters.",
    });
  }

  // Description validation (10–2000 chars after trim, no whitespace-only)
  const trimmedDescription = typeof description === "string" ? description.trim() : "";
  if (!trimmedDescription || trimmedDescription.length < 10 || trimmedDescription.length > 2000) {
    details.push({
      field: "description",
      message: "Description is required and must be between 10 and 2000 characters.",
    });
  }

  // Priority validation
  const validPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (!requestedPriority || !validPriorities.includes(requestedPriority)) {
    details.push({
      field: "requestedPriority",
      message: "Requested Priority must be one of: LOW, MEDIUM, HIGH.",
    });
  }

  // Category & RelatedSystem existence and active validation
  let categoryRecord = null;
  if (typeof categoryId === "number" && categoryId > 0) {
    categoryRecord = await prisma.category.findFirst({
      where: { id: categoryId, isActive: true },
    });
  }
  if (!categoryRecord) {
    details.push({
      field: "categoryId",
      message: "Category is invalid or inactive.",
    });
  }

  let systemRecord = null;
  if (typeof relatedSystemId === "number" && relatedSystemId > 0) {
    systemRecord = await prisma.relatedSystem.findFirst({
      where: { id: relatedSystemId, isActive: true },
    });
  }
  if (!systemRecord) {
    details.push({
      field: "relatedSystemId",
      message: "Related System is invalid or inactive.",
    });
  }

  if (details.length > 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid ticket input data.",
        details,
      },
    });
    return;
  }

  // Idempotency check
  const idempotencyKey = req.headers["idempotency-key"];
  let fingerprint = "";

  if (typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
    fingerprint = computeRequestFingerprint(req.body);
    const existingRequest = await prisma.ticketCreationRequest.findUnique({
      where: { id: idempotencyKey },
      include: {
        ticket: {
          include: {
            category: { select: { id: true, name: true } },
            relatedSystem: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (existingRequest && existingRequest.expiresAt > new Date()) {
      if (
        existingRequest.requestFingerprint === fingerprint &&
        existingRequest.requesterId === requester.id
      ) {
        res.status(201).json(existingRequest.ticket);
        return;
      } else {
        res.status(409).json({
          error: {
            code: "CONFLICT",
            message: "Idempotency key reused with different request payload.",
          },
        });
        return;
      }
    }
  }

  try {
    const ticketNumber = await generateTicketNumber();
    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: requester.id,
        categoryId: categoryRecord!.id,
        relatedSystemId: systemRecord!.id,
        summary: trimmedSummary,
        description: trimmedDescription,
        requestedPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
        currentStatus: "NEW",
      },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
      },
    });

    if (typeof idempotencyKey === "string" && idempotencyKey.trim().length > 0) {
      try {
        await prisma.ticketCreationRequest.create({
          data: {
            id: idempotencyKey,
            requesterId: requester.id,
            requestFingerprint: fingerprint,
            ticketId: newTicket.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          },
        });
      } catch (idempErr: any) {
        // Handle concurrent insertion race condition gracefully
        if (idempErr.code === "P2002") {
          const existing = await prisma.ticketCreationRequest.findUnique({
            where: { id: idempotencyKey },
            include: {
              ticket: {
                include: {
                  category: { select: { id: true, name: true } },
                  relatedSystem: { select: { id: true, name: true } },
                },
              },
            },
          });
          if (existing) {
            res.status(201).json(existing.ticket);
            return;
          }
        }
        throw idempErr;
      }
    }

    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create support ticket.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Ticket Scoped Route Placeholder for My Tickets (Issue 7)
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
