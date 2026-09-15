import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import multer from "multer";
import bcrypt from "bcryptjs";
import { getPrisma } from "./prisma.js";
import {
  authRouter,
  requireAuth,
  requireRole,
  authenticateSessionOrDev,
  UserOrRequesterRequest,
  AuthenticatedRequest,
  validatePasswordComplexity,
} from "./auth.js";
import { SESSION_SECRET } from "./session.js";

export const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser(SESSION_SECRET));
app.use("/api/auth", authRouter);

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
// Context Middleware: Validate Session or Legacy X-Dev-Requester-Id
// ---------------------------------------------------------------------------
export type RequesterRequest = UserOrRequesterRequest;
export const requireDevRequester = authenticateSessionOrDev;

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
  const requester = (req.user || req.devRequester)!;
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
        itPriority: requestedPriority as "LOW" | "MEDIUM" | "HIGH",
        currentStatus: "NEW",
        problemAppearsResolved: false,
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
// List My Tickets API (Lab 2 Issue 7 / #18)
// ---------------------------------------------------------------------------
app.get("/api/tickets", requireDevRequester, async (req: RequesterRequest, res: Response) => {
  const prisma = getPrisma();
  const requesterId = (req.user?.id || req.devRequester?.id)!;
  const details: { field: string; message: string }[] = [];

  const {
    search,
    categoryId,
    requestedPriority,
    currentStatus,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = "1",
    pageSize = "8",
  } = req.query;

  // Validation: sortBy whitelist
  const allowedSortBy = ["createdAt", "updatedAt", "ticketNumber"];
  if (typeof sortBy !== "string" || !allowedSortBy.includes(sortBy)) {
    details.push({
      field: "sortBy",
      message: `sortBy must be one of: ${allowedSortBy.join(", ")}.`,
    });
  }

  // Validation: sortOrder whitelist
  const normalizedSortOrder = typeof sortOrder === "string" ? sortOrder.toLowerCase() : "";
  if (normalizedSortOrder !== "asc" && normalizedSortOrder !== "desc") {
    details.push({
      field: "sortOrder",
      message: "sortOrder must be one of: asc, desc.",
    });
  }

  // Validation: page must be positive integer >= 1
  let pageNum = 1;
  if (typeof page === "string") {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || String(parsedPage) !== page.trim()) {
      details.push({
        field: "page",
        message: "page must be a positive integer >= 1.",
      });
    } else {
      pageNum = parsedPage;
    }
  } else {
    details.push({
      field: "page",
      message: "page must be a positive integer >= 1.",
    });
  }

  // Validation: pageSize whitelist (8, 20, 50)
  let pageSizeNum = 8;
  const allowedPageSizes = [8, 20, 50];
  if (typeof pageSize === "string") {
    const parsedPageSize = parseInt(pageSize, 10);
    if (isNaN(parsedPageSize) || !allowedPageSizes.includes(parsedPageSize) || String(parsedPageSize) !== pageSize.trim()) {
      details.push({
        field: "pageSize",
        message: `pageSize must be one of: ${allowedPageSizes.join(", ")}.`,
      });
    } else {
      pageSizeNum = parsedPageSize;
    }
  } else {
    details.push({
      field: "pageSize",
      message: `pageSize must be one of: ${allowedPageSizes.join(", ")}.`,
    });
  }

  // Validation: categoryId (optional positive integer)
  let parsedCategoryId: number | undefined;
  if (categoryId !== undefined && categoryId !== "") {
    if (typeof categoryId === "string") {
      const parsed = parseInt(categoryId, 10);
      if (isNaN(parsed) || parsed <= 0 || String(parsed) !== categoryId.trim()) {
        details.push({
          field: "categoryId",
          message: "categoryId must be a positive integer.",
        });
      } else {
        parsedCategoryId = parsed;
      }
    } else {
      details.push({
        field: "categoryId",
        message: "categoryId must be a positive integer.",
      });
    }
  }

  // Validation: requestedPriority (optional enum)
  const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
  if (requestedPriority !== undefined && requestedPriority !== "") {
    if (typeof requestedPriority !== "string" || !allowedPriorities.includes(requestedPriority)) {
      details.push({
        field: "requestedPriority",
        message: `requestedPriority must be one of: ${allowedPriorities.join(", ")}.`,
      });
    }
  }

  // Validation: currentStatus (optional enum)
  const allowedStatuses = ["NEW"];
  if (currentStatus !== undefined && currentStatus !== "") {
    if (typeof currentStatus !== "string" || !allowedStatuses.includes(currentStatus)) {
      details.push({
        field: "currentStatus",
        message: `currentStatus must be one of: ${allowedStatuses.join(", ")}.`,
      });
    }
  }

  if (details.length > 0) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid query parameters.",
        details,
      },
    });
    return;
  }

  // Build Prisma where clause with Requester Ownership (BR-08, AC-22)
  const where: any = {
    requesterId,
  };

  // Search filter (ticketNumber or summary, case-insensitive, BR-24, AC-16)
  if (typeof search === "string" && search.trim().length > 0) {
    const trimmedSearch = search.trim();
    where.OR = [
      { ticketNumber: { contains: trimmedSearch, mode: "insensitive" } },
      { summary: { contains: trimmedSearch, mode: "insensitive" } },
    ];
  }

  // Category filter
  if (parsedCategoryId !== undefined) {
    where.categoryId = parsedCategoryId;
  }

  // Priority filter
  if (typeof requestedPriority === "string" && requestedPriority.length > 0) {
    where.requestedPriority = requestedPriority;
  }

  // Status filter
  if (typeof currentStatus === "string" && currentStatus.length > 0) {
    where.currentStatus = currentStatus;
  }

  try {
    const [total, items] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: [
          { [sortBy as string]: normalizedSortOrder as "asc" | "desc" },
          { id: "desc" }, // Secondary stable sort tie-breaker (BR-26)
        ],
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          category: {
            select: { id: true, name: true },
          },
          relatedSystem: {
            select: { id: true, name: true },
          },
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          problemAppearsResolved: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              attachments: {
                where: { isRemoved: false },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / pageSizeNum);

    res.status(200).json({
      items,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list tickets.",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// Get Owned Ticket Detail API (Lab 2 Issue 8 / #19, AC-21, AC-22, API-10)
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", requireDevRequester, async (req: RequesterRequest, res: Response) => {
  const prisma = getPrisma();
  const requester = req.devRequester!;
  const ticketId = parseInt(req.params.id, 10);

  if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
    res.status(400).json({
      error: {
        code: "BAD_REQUEST",
        message: "Invalid ticket ID parameter.",
      },
    });
    return;
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        relatedSystem: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryOwner: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        attachments: {
          select: {
            id: true,
            originalFileName: true,
            mimeType: true,
            sizeBytes: true,
            uploadedAt: true,
            isRemoved: true,
            removedAt: true,
            removedReason: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    // Ownership check (AC-22, BR-23, BR-09, SEC-02)
    if (!ticket) {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found or access denied.",
        },
      });
      return;
    }

    const currentUserId = req.user?.id || req.devRequester?.id;
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";

    if (!isStaffOrAdmin && ticket.requesterId !== currentUserId) {
      res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found or access denied.",
        },
      });
      return;
    }

    res.status(200).json(ticket);
  } catch (error) {
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve ticket details.",
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

      const currentUserId = req.user?.id || req.devRequester?.id;
      const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";

      if (!ticket || (!isStaffOrAdmin && ticket.requesterId !== currentUserId)) {
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
    const currentUserId = req.user?.id || req.devRequester?.id;
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";
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

      if (!ticket || (!isStaffOrAdmin && ticket.requesterId !== currentUserId)) {
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
    const currentUserId = req.user?.id || req.devRequester?.id;
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";
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
        (!isStaffOrAdmin && attachment.ticket.requesterId !== currentUserId) ||
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
    const currentUserId = req.user?.id || req.devRequester?.id;
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";
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

      if (!attachment || (!isStaffOrAdmin && attachment.ticket.requesterId !== currentUserId)) {
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
// Lab 3 RBAC & Ticket Workflow Endpoints (Issue #36)
// ---------------------------------------------------------------------------

// POST /api/tickets/:id/resolve-indication (REQ-03, AC-08, BR-10)
app.post(
  "/api/tickets/:id/resolve-indication",
  authenticateSessionOrDev,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const currentUserId = req.user?.id || req.devRequester?.id;
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid ticket ID parameter.",
        },
      });
      return;
    }

    if (req.user && req.user.role !== "REQUESTER") {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only ticket requesters can indicate problem resolution.",
        },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (!ticket || ticket.requesterId !== currentUserId) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: "Ticket not found.",
          },
        });
        return;
      }

      const resolved = typeof req.body?.resolved === "boolean" ? req.body.resolved : true;
      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          problemAppearsResolved: resolved,
        },
        select: {
          id: true,
          problemAppearsResolved: true,
          updatedAt: true,
        },
      });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update problem resolution indicator.",
        },
      });
    }
  }
);

// GET /api/tickets/:id/comments (AC-09, BR-16, COM-01)
app.get(
  "/api/tickets/:id/comments",
  authenticateSessionOrDev,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, requesterId: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found or access denied." },
        });
        return;
      }

      const currentUserId = req.user?.id || req.devRequester?.id;
      const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";

      if (!isStaffOrAdmin && ticket.requesterId !== currentUserId) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found or access denied." },
        });
        return;
      }

      const comments = await prisma.publicComment.findMany({
        where: { ticketId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      res.status(200).json(comments);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch comments." },
      });
    }
  }
);

// POST /api/tickets/:id/comments (AC-09, BR-16, BR-17, COM-01, COM-03)
app.post(
  "/api/tickets/:id/comments",
  authenticateSessionOrDev,
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, requesterId: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found or access denied." },
        });
        return;
      }

      const currentUserId = req.user?.id || req.devRequester?.id;
      const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";

      if (!isStaffOrAdmin && ticket.requesterId !== currentUserId) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found or access denied." },
        });
        return;
      }

      const rawContent = req.body?.content;
      if (typeof rawContent !== "string") {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Comment content must be a string." },
        });
        return;
      }

      const trimmed = rawContent.trim();
      if (trimmed.length < 1) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Comment content cannot be empty or whitespace only." },
        });
        return;
      }

      if (trimmed.length > 2000) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Comment content cannot exceed 2000 characters." },
        });
        return;
      }

      const comment = await prisma.publicComment.create({
        data: {
          ticketId,
          authorId: currentUserId!,
          content: trimmed,
        },
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create comment." },
      });
    }
  }
);

// GET /api/tickets/:id/internal-notes (AC-10, AC-11, SEC-04, BR-16, BR-18, COM-02)
app.get(
  "/api/tickets/:id/internal-notes",
  authenticateSessionOrDev,
  async (req: RequesterRequest, res: Response) => {
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";
    if (!isStaffOrAdmin) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Requesters are not permitted to access internal notes.",
        },
      });
      return;
    }

    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const notes = await prisma.internalNote.findMany({
        where: { ticketId },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      res.status(200).json(notes);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch internal notes." },
      });
    }
  }
);

// POST /api/tickets/:id/internal-notes (AC-10, AC-11, SEC-04, BR-16, BR-17, BR-18, COM-02, COM-03)
app.post(
  "/api/tickets/:id/internal-notes",
  authenticateSessionOrDev,
  async (req: RequesterRequest, res: Response) => {
    const isStaffOrAdmin = req.user?.role === "IT_STAFF" || req.user?.role === "ADMINISTRATOR";
    if (!isStaffOrAdmin) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Requesters are not permitted to post internal notes.",
        },
      });
      return;
    }

    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
        return;
      }

      const rawContent = req.body?.content;
      if (typeof rawContent !== "string") {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Internal note content must be a string." },
        });
        return;
      }

      const trimmed = rawContent.trim();
      if (trimmed.length < 1) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Internal note content cannot be empty or whitespace only." },
        });
        return;
      }

      if (trimmed.length > 2000) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Internal note content cannot exceed 2000 characters." },
        });
        return;
      }

      const note = await prisma.internalNote.create({
        data: {
          ticketId,
          authorId: req.user!.id,
          content: trimmed,
        },
        include: {
          author: {
            select: { id: true, fullName: true, role: true },
          },
        },
      });

      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create internal note." },
      });
    }
  }
);

// GET /api/staff/tickets (STF-01..04, AC-12, BR-23)
app.get(
  "/api/staff/tickets",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const details: { field: string; message: string }[] = [];

    const {
      search,
      categoryId,
      currentStatus,
      itPriority,
      ownerId,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = "1",
      limit = "10",
      pageSize,
    } = req.query;

    const where: any = {};

    // Search filter (ticketNumber or summary, case-insensitive, BR-23, AC-12)
    if (typeof search === "string" && search.trim().length > 0) {
      const trimmedSearch = search.trim();
      where.OR = [
        { ticketNumber: { contains: trimmedSearch, mode: "insensitive" } },
        { summary: { contains: trimmedSearch, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (categoryId !== undefined && categoryId !== "") {
      const parsedCatId = parseInt(String(categoryId), 10);
      if (isNaN(parsedCatId) || parsedCatId <= 0 || String(parsedCatId) !== String(categoryId).trim()) {
        details.push({ field: "categoryId", message: "categoryId must be a positive integer." });
      } else {
        where.categoryId = parsedCatId;
      }
    }

    // Status filter (NEW, OPEN, IN_PROGRESS, RESOLVED)
    const allowedStatuses = ["NEW", "OPEN", "IN_PROGRESS", "RESOLVED"];
    if (currentStatus !== undefined && currentStatus !== "") {
      if (typeof currentStatus !== "string" || !allowedStatuses.includes(currentStatus)) {
        details.push({
          field: "currentStatus",
          message: `currentStatus must be one of: ${allowedStatuses.join(", ")}.`,
        });
      } else {
        where.currentStatus = currentStatus;
      }
    }

    // IT Priority filter (LOW, MEDIUM, HIGH)
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];
    if (itPriority !== undefined && itPriority !== "") {
      if (typeof itPriority !== "string" || !allowedPriorities.includes(itPriority)) {
        details.push({
          field: "itPriority",
          message: `itPriority must be one of: ${allowedPriorities.join(", ")}.`,
        });
      } else {
        where.itPriority = itPriority;
      }
    }

    // Owner filter ("unassigned", "me", or integer user ID)
    if (ownerId !== undefined && ownerId !== "") {
      if (ownerId === "unassigned") {
        where.primaryOwnerId = null;
      } else if (ownerId === "me") {
        const staffUserId = req.user?.id || req.devRequester?.id;
        where.primaryOwnerId = staffUserId;
      } else {
        const parsedOwnerId = parseInt(String(ownerId), 10);
        if (isNaN(parsedOwnerId) || parsedOwnerId <= 0 || String(parsedOwnerId) !== String(ownerId).trim()) {
          details.push({
            field: "ownerId",
            message: "ownerId must be a positive integer, 'unassigned', or 'me'.",
          });
        } else {
          where.primaryOwnerId = parsedOwnerId;
        }
      }
    }

    // Sorting whitelist
    const allowedSortBy = ["createdAt", "updatedAt", "ticketNumber", "itPriority"];
    if (typeof sortBy !== "string" || !allowedSortBy.includes(sortBy)) {
      details.push({
        field: "sortBy",
        message: `sortBy must be one of: ${allowedSortBy.join(", ")}.`,
      });
    }

    // Sort order whitelist
    const normalizedSortOrder = typeof sortOrder === "string" ? sortOrder.toLowerCase() : "";
    if (normalizedSortOrder !== "asc" && normalizedSortOrder !== "desc") {
      details.push({
        field: "sortOrder",
        message: "sortOrder must be one of: asc, desc.",
      });
    }

    // Pagination: page
    let pageNum = 1;
    if (page !== undefined && page !== "") {
      const parsedPage = parseInt(String(page), 10);
      if (isNaN(parsedPage) || parsedPage < 1 || String(parsedPage) !== String(page).trim()) {
        details.push({ field: "page", message: "page must be a positive integer >= 1." });
      } else {
        pageNum = parsedPage;
      }
    }

    // Pagination: limit / pageSize
    let limitNum = 10;
    const effectiveLimitParam = pageSize !== undefined && pageSize !== "" ? pageSize : limit;
    if (effectiveLimitParam !== undefined && effectiveLimitParam !== "") {
      const parsedLimit = parseInt(String(effectiveLimitParam), 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || String(parsedLimit) !== String(effectiveLimitParam).trim()) {
        details.push({ field: "limit", message: "limit must be a positive integer >= 1." });
      } else {
        limitNum = parsedLimit;
      }
    }

    if (details.length > 0) {
      res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid query parameters.",
          details,
        },
      });
      return;
    }

    try {
      const [totalItems, items] = await Promise.all([
        prisma.ticket.count({ where }),
        prisma.ticket.findMany({
          where,
          orderBy: [
            { [sortBy as string]: normalizedSortOrder as "asc" | "desc" },
            { id: "desc" },
          ],
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            category: { select: { id: true, name: true } },
            requestedPriority: true,
            itPriority: true,
            currentStatus: true,
            requester: { select: { id: true, fullName: true, email: true } },
            primaryOwner: { select: { id: true, fullName: true, email: true } },
            problemAppearsResolved: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalItems / limitNum) || 1;

      res.status(200).json({
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to query staff ticket queue.",
        },
      });
    }
  }
);

// GET /api/staff/members (Active Staff & Admin Directory for Queue Assignment Filter)
app.get(
  "/api/staff/members",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (_req: Request, res: Response) => {
    try {
      const staffMembers = await getPrisma().user.findMany({
        where: {
          role: { in: ["IT_STAFF", "ADMINISTRATOR"] },
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
        },
        orderBy: { fullName: "asc" },
      });

      res.status(200).json(staffMembers);
    } catch (error) {
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch staff members.",
        },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/owner (AC-13, BR-11, STF-05)
app.patch(
  "/api/staff/tickets/:id/owner",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
        return;
      }

      const { ownerId } = req.body || {};

      let targetOwnerId: number | null = null;

      if (ownerId !== null && ownerId !== undefined) {
        if (typeof ownerId !== "number" || isNaN(ownerId) || ownerId <= 0) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Invalid ownerId." },
          });
          return;
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: ownerId },
          select: { id: true, fullName: true, email: true, role: true, isActive: true },
        });

        if (!targetUser) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Target owner user does not exist." },
          });
          return;
        }

        if (!targetUser.isActive) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Cannot assign inactive user as ticket owner." },
          });
          return;
        }

        if (targetUser.role === "REQUESTER") {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Cannot assign requester as ticket owner." },
          });
          return;
        }

        targetOwnerId = targetUser.id;
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { primaryOwnerId: targetOwnerId },
        include: {
          primaryOwner: {
            select: { id: true, fullName: true, email: true },
          },
        },
      });

      res.status(200).json({
        id: updated.id,
        primaryOwnerId: updated.primaryOwnerId,
        primaryOwner: updated.primaryOwner,
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update ticket owner." },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/priority (AC-14, BR-13, STF-06)
app.patch(
  "/api/staff/tickets/:id/priority",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    const { itPriority } = req.body || {};
    const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

    if (!itPriority || !allowedPriorities.includes(itPriority)) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid IT priority. Must be LOW, MEDIUM, or HIGH." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
        return;
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { itPriority: itPriority as any },
      });

      res.status(200).json({
        id: updated.id,
        itPriority: updated.itPriority,
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update IT priority." },
      });
    }
  }
);

// PATCH /api/staff/tickets/:id/status (AC-15, BR-15, STF-07, STF-08)
app.patch(
  "/api/staff/tickets/:id/status",
  requireAuth,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  async (req: RequesterRequest, res: Response) => {
    const prisma = getPrisma();
    const ticketId = parseInt(req.params.id, 10);

    if (isNaN(ticketId) || ticketId <= 0 || String(ticketId) !== req.params.id.trim()) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket ID parameter." },
      });
      return;
    }

    const { status } = req.body || {};
    const allowedStatuses = [
      "NEW",
      "OPEN",
      "IN_PROGRESS",
      "WAITING_FOR_REQUESTER",
      "RESOLVED",
      "CLOSED",
      "REOPENED",
      "CANCELLED",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Invalid ticket status." },
      });
      return;
    }

    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        select: { id: true, currentStatus: true },
      });

      if (!ticket) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "Ticket not found." },
        });
        return;
      }

      const STATUS_TRANSITIONS: Record<string, string[]> = {
        NEW: ["OPEN", "IN_PROGRESS", "CANCELLED"],
        OPEN: ["IN_PROGRESS", "WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
        IN_PROGRESS: ["WAITING_FOR_REQUESTER", "RESOLVED", "CANCELLED"],
        WAITING_FOR_REQUESTER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
        RESOLVED: ["CLOSED", "REOPENED"],
        CLOSED: ["REOPENED"],
        REOPENED: ["OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"],
        CANCELLED: ["REOPENED"],
      };

      const permitted = STATUS_TRANSITIONS[ticket.currentStatus] || [];

      if (!permitted.includes(status)) {
        res.status(400).json({
          error: {
            code: "ILLEGAL_STATUS_TRANSITION",
            message: `Cannot transition status from ${ticket.currentStatus} to ${status} directly`,
          },
        });
        return;
      }

      const updated = await prisma.ticket.update({
        where: { id: ticketId },
        data: { currentStatus: status as any },
      });

      res.status(200).json({
        id: updated.id,
        currentStatus: updated.currentStatus,
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update ticket status." },
      });
    }
  }
);

// ---------------------------------------------------------------------------
// Administrator User Management Endpoints (AC-16..21, BR-07, BR-08, BR-19..22, ADM-01..04, SEC-05, SEC-06)
// ---------------------------------------------------------------------------

// 1. GET /api/admin/users — List users with search, role filter, active filter, pagination
app.get(
  "/api/admin/users",
  requireAuth,
  requireRole("ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const { search, role, isActive, page, limit } = req.query;

      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 10;

      if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Page and limit must be positive integers.",
          },
        });
        return;
      }

      if (role && !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role as string)) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Invalid role filter.",
          },
        });
        return;
      }

      const where: any = {};

      if (search && typeof search === "string" && search.trim()) {
        const term = search.trim();
        where.OR = [
          { fullName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ];
      }

      if (role) {
        where.role = role as any;
      }

      if (isActive !== undefined && isActive !== "") {
        if (isActive === "true") {
          where.isActive = true;
        } else if (isActive === "false") {
          where.isActive = false;
        }
      }

      const totalItems = await prisma.user.count({ where });
      const totalPages = Math.ceil(totalItems / limitNum) || 1;
      const skip = (pageNum - 1) * limitNum;

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: limitNum,
      });

      res.status(200).json({
        items: users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems,
          totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to list users." },
      });
    }
  }
);

// 2. POST /api/admin/users — Create new user account with single role and initial password
app.post(
  "/api/admin/users",
  requireAuth,
  requireRole("ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const { fullName, email, role, initialPassword } = req.body;

      if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 100) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Full name must be between 2 and 100 characters.",
          },
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Valid email address is required.",
          },
        });
        return;
      }

      if (!role || !["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Valid role (REQUESTER, IT_STAFF, ADMINISTRATOR) is required.",
          },
        });
        return;
      }

      if (!initialPassword || typeof initialPassword !== "string") {
        res.status(400).json({
          error: {
            code: "BAD_REQUEST",
            message: "Initial password is required.",
          },
        });
        return;
      }

      const complexity = validatePasswordComplexity(initialPassword);
      if (!complexity.valid) {
        res.status(400).json({
          error: {
            code: "WEAK_PASSWORD",
            message: complexity.errors.join(" "),
            details: complexity.errors,
          },
        });
        return;
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check duplicate email (BR-08)
      const existingUser = await prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      });

      if (existingUser) {
        res.status(409).json({
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: `A user with email "${normalizedEmail}" already exists.`,
          },
        });
        return;
      }

      const passwordHash = await bcrypt.hash(initialPassword, 10);

      const newUser = await prisma.user.create({
        data: {
          fullName: fullName.trim(),
          email: normalizedEmail,
          role,
          passwordHash,
          isActive: true,
          mustChangePassword: true,
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(201).json(newUser);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create user." },
      });
    }
  }
);

// 3. PATCH /api/admin/users/:id — Edit user details and toggle active status with safeguards
app.patch(
  "/api/admin/users/:id",
  requireAuth,
  requireRole("ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const authReq = req as AuthenticatedRequest;
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid user ID." },
        });
        return;
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "User not found." },
        });
        return;
      }

      const { fullName, email, role, isActive } = req.body;

      // Validation: fullName
      if (fullName !== undefined) {
        if (typeof fullName !== "string" || fullName.trim().length < 2 || fullName.trim().length > 100) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Full name must be between 2 and 100 characters." },
          });
          return;
        }
      }

      // Validation: email
      let normalizedEmail: string | undefined = undefined;
      if (email !== undefined) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof email !== "string" || !emailRegex.test(email.trim())) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Valid email address is required." },
          });
          return;
        }
        normalizedEmail = email.toLowerCase().trim();
        if (normalizedEmail !== targetUser.email.toLowerCase()) {
          const emailExists = await prisma.user.findFirst({
            where: {
              email: { equals: normalizedEmail, mode: "insensitive" },
              id: { not: userId },
            },
          });
          if (emailExists) {
            res.status(409).json({
              error: {
                code: "EMAIL_ALREADY_EXISTS",
                message: `Email "${normalizedEmail}" is already registered by another user.`,
              },
            });
            return;
          }
        }
      }

      // Validation: role
      if (role !== undefined) {
        if (!["REQUESTER", "IT_STAFF", "ADMINISTRATOR"].includes(role)) {
          res.status(400).json({
            error: { code: "BAD_REQUEST", message: "Invalid role specified." },
          });
          return;
        }
      }

      // Safeguard 1: Self-deactivation prevention (BR-20, SEC-05)
      if (authReq.user?.id === userId && isActive === false) {
        res.status(400).json({
          error: {
            code: "CANNOT_DEACTIVATE_SELF",
            message: "Administrators cannot deactivate their own account.",
          },
        });
        return;
      }

      // Safeguard 2: Last active administrator lockout protection (BR-21, SEC-06)
      if (targetUser.role === "ADMINISTRATOR" && targetUser.isActive) {
        const isDeactivating = isActive === false;
        const isDemoting = role !== undefined && role !== "ADMINISTRATOR";

        if (isDeactivating || isDemoting) {
          const activeAdminCount = await prisma.user.count({
            where: {
              role: "ADMINISTRATOR",
              isActive: true,
            },
          });

          if (activeAdminCount <= 1) {
            res.status(400).json({
              error: {
                code: "LAST_ACTIVE_ADMIN",
                message: "Cannot deactivate or demote the last active administrator.",
              },
            });
            return;
          }
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName !== undefined && { fullName: fullName.trim() }),
          ...(normalizedEmail !== undefined && { email: normalizedEmail }),
          ...(role !== undefined && { role }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          isActive: true,
          mustChangePassword: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.status(200).json(updatedUser);
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update user." },
      });
    }
  }
);

// 4. POST /api/admin/users/:id/reset-password — Reset initial password
app.post(
  "/api/admin/users/:id/reset-password",
  requireAuth,
  requireRole("ADMINISTRATOR"),
  async (req: Request, res: Response) => {
    try {
      const prisma = getPrisma();
      const userId = parseInt(req.params.id, 10);

      if (isNaN(userId)) {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Invalid user ID." },
        });
        return;
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!targetUser) {
        res.status(404).json({
          error: { code: "NOT_FOUND", message: "User not found." },
        });
        return;
      }

      const { initialPassword } = req.body;

      if (!initialPassword || typeof initialPassword !== "string") {
        res.status(400).json({
          error: { code: "BAD_REQUEST", message: "Initial password is required." },
        });
        return;
      }

      const complexity = validatePasswordComplexity(initialPassword);
      if (!complexity.valid) {
        res.status(400).json({
          error: {
            code: "WEAK_PASSWORD",
            message: complexity.errors.join(" "),
            details: complexity.errors,
          },
        });
        return;
      }

      const passwordHash = await bcrypt.hash(initialPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });

      res.status(200).json({
        success: true,
        message: "Password reset successfully; user must change password on next login",
        mustChangePassword: true,
      });
    } catch (error) {
      res.status(500).json({
        error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to reset password." },
      });
    }
  }
);

export default app;

