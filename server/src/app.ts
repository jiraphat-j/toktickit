import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());

// Ensure upload directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ---------------------------------------------------------------------------
// Multer Configuration for Attachments (Issue 4)
// ---------------------------------------------------------------------------
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const storedName = `${crypto.randomUUID()}${ext}`;
    cb(null, storedName);
  },
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const err = new Error("Unsupported file type");
      (err as any).code = "UNSUPPORTED_MEDIA_TYPE";
      return cb(err);
    }
    cb(null, true);
  },
});

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
// Attachment APIs (Lab 2 Issue 4)
// ---------------------------------------------------------------------------

// POST /api/tickets/:id/attachments — Upload attachment
app.post(
  "/api/tickets/:id/attachments",
  requireDevRequester,
  (req: RequesterRequest, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(413).json({
            error: {
              code: "PAYLOAD_TOO_LARGE",
              message: "Uploaded attachment exceeds maximum size limit of 5 MB.",
            },
          });
        }
        if (err.code === "UNSUPPORTED_MEDIA_TYPE") {
          return res.status(415).json({
            error: {
              code: "UNSUPPORTED_MEDIA_TYPE",
              message: "File type is not supported. Allowed types: JPG, PNG, WEBP, PDF.",
            },
          });
        }
        return res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: err.message || "File upload failed.",
          },
        });
      }
      next();
    });
  },
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const requester = req.devRequester!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Attachment file is required." },
      });
      return;
    }

    try {
      // Ownership check (Ticket must exist and belong to selected requester)
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket || ticket.requesterId !== requester.id) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Ticket not found or access denied.",
          },
        });
        return;
      }

      // Check active attachments limit (Max 5 active)
      const activeCount = await prisma.attachment.count({
        where: {
          ticketId: ticket.id,
          isRemoved: false,
        },
      });

      if (activeCount >= 5) {
        fs.unlinkSync(req.file.path);
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Maximum limit of 5 active attachments reached for this ticket.",
          },
        });
        return;
      }

      const attachment = await prisma.attachment.create({
        data: {
          ticketId: ticket.id,
          originalFileName: req.file.originalname,
          storedFileName: req.file.filename,
          mimeType: req.file.mimetype,
          sizeBytes: req.file.size,
        },
      });

      res.status(201).json(attachment);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload attachment.",
        },
      });
    }
  }
);

// GET /api/tickets/:id/attachments — List attachment metadata
app.get(
  "/api/tickets/:id/attachments",
  requireDevRequester,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const requester = req.devRequester!;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket || ticket.requesterId !== requester.id) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Ticket not found or access denied.",
          },
        });
        return;
      }

      const attachments = await prisma.attachment.findMany({
        where: { ticketId: ticket.id },
        orderBy: { uploadedAt: "asc" },
      });

      res.status(200).json(attachments);
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch attachment list.",
        },
      });
    }
  }
);

// GET /api/attachments/:id/download — Download active attachment
app.get(
  "/api/attachments/:id/download",
  requireDevRequester,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const requester = req.devRequester!;
    const attachmentId = parseInt(req.params.id, 10);

    if (isNaN(attachmentId) || attachmentId <= 0) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid attachment ID." },
      });
      return;
    }

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { ticket: true },
      });

      if (
        !attachment ||
        attachment.ticket.requesterId !== requester.id ||
        attachment.isRemoved
      ) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Attachment not found, removed, or access denied.",
          },
        });
        return;
      }

      const filePath = path.join(UPLOAD_DIR, attachment.storedFileName);
      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Attachment file content not found on server storage.",
          },
        });
        return;
      }

      res.setHeader("Content-Type", attachment.mimeType);
      res.download(filePath, attachment.originalFileName);
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to download attachment.",
        },
      });
    }
  }
);

// PATCH /api/attachments/:id/remove — Soft remove attachment
app.patch(
  "/api/attachments/:id/remove",
  requireDevRequester,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const requester = req.devRequester!;
    const attachmentId = parseInt(req.params.id, 10);
    const { reason } = req.body;

    const trimmedReason = typeof reason === "string" ? reason.trim() : "";
    if (!trimmedReason || trimmedReason.length < 3) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Removal reason is required and must be at least 3 characters.",
        },
      });
      return;
    }

    if (isNaN(attachmentId) || attachmentId <= 0) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid attachment ID." },
      });
      return;
    }

    try {
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
        include: { ticket: true },
      });

      if (!attachment || attachment.ticket.requesterId !== requester.id) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Attachment not found or access denied.",
          },
        });
        return;
      }

      if (attachment.isRemoved) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Attachment has already been removed.",
          },
        });
        return;
      }

      const updated = await prisma.attachment.update({
        where: { id: attachment.id },
        data: {
          isRemoved: true,
          removedAt: new Date(),
          removedReason: trimmedReason,
        },
      });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to remove attachment.",
        },
      });
    }
  }
);

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
