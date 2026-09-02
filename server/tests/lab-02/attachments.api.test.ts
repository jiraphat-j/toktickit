import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

describe("Attachment API (Issue 4)", () => {
  const requesterA = "1"; // Somchai
  const requesterB = "2"; // Suda
  let ticketAId: number;
  let ticketBId: number;

  beforeAll(async () => {
    // Create a ticket for Requester A
    const resA = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", requesterA)
      .send({
        categoryId: 2,
        relatedSystemId: 2,
        summary: "Ticket A for Attachment Testing",
        description: "Testing attachments lifecycle for Requester A ticket.",
        requestedPriority: "MEDIUM",
      });
    ticketAId = resA.body.id;

    // Create a ticket for Requester B
    const resB = await request(app)
      .post("/api/tickets")
      .set("X-Dev-Requester-Id", requesterB)
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Ticket B for Attachment Testing",
        description: "Testing attachments lifecycle for Requester B ticket.",
        requestedPriority: "LOW",
      });
    ticketBId = resB.body.id;
  });

  // API-11 (AC-08): Valid upload of JPG, PNG, PDF
  it("API-11: uploads valid PNG and PDF files successfully and returns 201 Created", async () => {
    const pngBuffer = Buffer.from("\x89PNG\r\n\x1a\nfake-png-content-data");
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA)
      .attach("file", pngBuffer, "screenshot.png");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.originalFileName).toBe("screenshot.png");
    expect(res.body.mimeType).toBe("image/png");
    expect(res.body.isRemoved).toBe(false);
    expect(res.body).toHaveProperty("uploadedAt");
  });

  // API-12 (AC-09, AC-10): Validation for file type and size
  it("API-12: rejects unsupported file type (e.g. .exe or .txt) with 415 Unsupported Media Type", async () => {
    const textBuffer = Buffer.from("plain text content");
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA)
      .attach("file", textBuffer, "script.exe");

    expect(res.status).toBe(415);
    expect(res.body.error.code).toBe("UNSUPPORTED_MEDIA_TYPE");
  });

  it("API-12: rejects oversized attachment (> 5 MB) with 413 Payload Too Large", async () => {
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024, "a"); // 5MB + 1KB
    const res = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA)
      .attach("file", oversizedBuffer, "large_file.pdf");

    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe("PAYLOAD_TOO_LARGE");
  });

  // API-11 (AC-11): Maximum 5 active attachments limit
  it("API-11: blocks upload when ticket already has 5 active attachments with 400 Bad Request", async () => {
    // Ticket A already has 1 attachment. Upload 4 more to reach 5 active attachments.
    const fileBuffer = Buffer.from("%PDF-1.4 fake pdf data");
    for (let i = 2; i <= 5; i++) {
      const res = await request(app)
        .post(`/api/tickets/${ticketAId}/attachments`)
        .set("X-Dev-Requester-Id", requesterA)
        .attach("file", fileBuffer, `doc_${i}.pdf`);
      expect(res.status).toBe(201);
    }

    // 6th upload attempt must fail
    const res6th = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA)
      .attach("file", fileBuffer, "doc_6_excess.pdf");

    expect(res6th.status).toBe(400);
    expect(res6th.body.error.code).toBe("BAD_REQUEST");
  });

  // API-13 (AC-12): Download active attachment
  it("API-13: downloads active attachment successfully with 200 OK and correct headers", async () => {
    const listRes = await request(app)
      .get(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA);

    expect(listRes.status).toBe(200);
    expect(listRes.body.length).toBe(5);

    const firstAttachment = listRes.body[0];
    const dlRes = await request(app)
      .get(`/api/attachments/${firstAttachment.id}/download`)
      .set("X-Dev-Requester-Id", requesterA);

    expect(dlRes.status).toBe(200);
    expect(dlRes.headers["content-disposition"]).toContain(firstAttachment.originalFileName);
  });

  // API-14 (AC-13, AC-14, AC-15): Soft removal and freeing active slot
  it("API-14: soft-removal requires reason (min 3 chars), retains metadata, blocks download, and frees active slot", async () => {
    const listRes = await request(app)
      .get(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA);

    const attachmentToRemove = listRes.body[0];

    // Attempt removal without reason
    const resNoReason = await request(app)
      .patch(`/api/attachments/${attachmentToRemove.id}/remove`)
      .set("X-Dev-Requester-Id", requesterA)
      .send({ reason: "" });
    expect(resNoReason.status).toBe(400);

    // Valid removal with reason
    const removeReason = "Uploaded outdated diagnostic report";
    const removeRes = await request(app)
      .patch(`/api/attachments/${attachmentToRemove.id}/remove`)
      .set("X-Dev-Requester-Id", requesterA)
      .send({ reason: removeReason });

    expect(removeRes.status).toBe(200);
    expect(removeRes.body.isRemoved).toBe(true);
    expect(removeRes.body.removedReason).toBe(removeReason);
    expect(removeRes.body).toHaveProperty("removedAt");

    // AC-32: Download is now blocked (404 Not Found)
    const dlBlocked = await request(app)
      .get(`/api/attachments/${attachmentToRemove.id}/download`)
      .set("X-Dev-Requester-Id", requesterA);
    expect(dlBlocked.status).toBe(404);

    // AC-15: Slot is freed (4 active + 1 removed = 5 total), so adding a new attachment succeeds!
    const newUploadRes = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA)
      .attach("file", Buffer.from("%PDF-1.4 new data"), "replacement_doc.pdf");

    expect(newUploadRes.status).toBe(201);
  });

  // API-15 (AC-34, BR-09): Ownership isolation
  it("API-15: Requester B cannot upload, download, or remove attachments for Ticket A (returns 404)", async () => {
    // Requester B attempts upload to Ticket A
    const resUpload = await request(app)
      .post(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterB)
      .attach("file", Buffer.from("%PDF-1.4 unowned"), "attack.pdf");
    expect(resUpload.status).toBe(404);

    // Requester B attempts listing Ticket A attachments
    const resList = await request(app)
      .get(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterB);
    expect(resList.status).toBe(404);

    // Get an attachment from Ticket A
    const listA = await request(app)
      .get(`/api/tickets/${ticketAId}/attachments`)
      .set("X-Dev-Requester-Id", requesterA);
    const targetId = listA.body[0].id;

    // Requester B attempts downloading Ticket A's attachment
    const resDl = await request(app)
      .get(`/api/attachments/${targetId}/download`)
      .set("X-Dev-Requester-Id", requesterB);
    expect(resDl.status).toBe(404);

    // Requester B attempts removing Ticket A's attachment
    const resRemove = await request(app)
      .patch(`/api/attachments/${targetId}/remove`)
      .set("X-Dev-Requester-Id", requesterB)
      .send({ reason: "Malicious removal attempt" });
    expect(resRemove.status).toBe(404);
  });
});
