# Lab 2 — AI Use and Reflection

**LLM/Agent used:** Google Antigravity AI Agent  
**Model:** Gemini 3.7 Flash / Claude 3.7 Sonnet  
**Thinking level:** Standard / Extended reasoning  

---

## Selected Key Prompts (6–10 Prompts)

| # | Prompt Purpose | Prompt (summarised) | What I Did / Reviewed / Fixed |
|:---:|---|---|---|
| **1** | Plan & Issue Setup | "จากไฟล์พวกนี้ช่วยพาผมทำ lab2 Software หน่อย โดยไม่ข้ามขั้น มีขั้นตอน PR ด้วยโดยทำคู่กับเพื่อนให้เพื่อนเป็นคน Approve และ merge พาทำแบบละเอียด" | วิเคราะห์ความต้องการร่วมกับ AI จาก `Lab_02_labsheet.pdf` และ `lab2-workthrough.md` เพื่อวางแผนแตกเป็น 9 GitHub Issues พร้อมกำหนด Acceptance Criteria (ACs) และลำดับ Dependency อย่างรัดกุมก่อนเริ่มลงมือเขียนโค้ด |
| **2** | Issue 1 Contract Generation | "ขอใหม่ตั้งแต่ Step 1: อย่าลืมพวกชื่อและรายละเอียดทั้งหมดด้วยทำทีละ step รอผมเสร็จก่อน -> เรียบร้อย issue 1 : #12" | ควบคุม AI ให้ร่างเอกสาร Specification ทั้ง 4 ฉบับ (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) และทำการ cross-check ทุก Functional Requirements และ Business Rules (BR-01..34) ให้สอดคล้องกันแบบ 100% Traceability |
| **3** | Issue 2 Schema & Context API | "ไป issue 2 กันเลย -> Implement Development Requester schema, seed, and context API" | บังคับใช้กระบวนการ TDD โดยให้ AI เขียน failing tests ก่อน (`API-01, API-02, API-03`) และตรวจสอบโค้ดการทำ seed ให้เป็นแบบ Idempotent (upsert) เพื่อป้องกันข้อมูลขยะซ้ำซ้อนเมื่อรัน migration ซ้ำ |
| **4** | Issue 3 Ticket Creation & Idempotency | "ต่อไป #14 issue 3 เริ่มได้เลย -> Implement Ticket schema, ticket number, and Create Ticket API" | กำกับให้ทำ atomic sequence generator (`TKT-YYYY-XXXXXX`) และระบบ Idempotency 24 ชม. เมื่อ Reviewer ท้วงติงกรณี concurrent duplicate request ผมได้วิเคราะห์ DB error code `P2002` และสั่งให้ AI ปรับ error handling เพื่อแก้ปัญหา race condition อย่างปลอดภัย |
| **5** | Issue 4 Attachment API & Soft Removal | "#15 issue4 ต่อเลย -> Implement Attachment upload, download, and soft removal API" | กำหนดให้อัปโหลดไฟล์โดยใช้ server-generated opaque UUID ในการตั้งชื่อไฟล์, ดักจับข้อผิดพลาดขนาดไฟล์และประเภทไฟล์ (413/415), ตรวจสอบให้มั่นใจว่าการทำ soft-remove จะไม่ลบไฟล์จริงออกจาก disk แต่ปิดกั้นการดาวน์โหลดด้วย 404 และคืนสิทธิ์โควตา 5 ไฟล์ |
| **6** | Issue 5 Zen Green Shell & Selector UI | "ไปทำกันต่อที่ issue 5 กันต่อ plan ก่อนค่อย implement อ่านรายละเอียดให้ครบถ้วน" | ให้ AI วาง Implementation Plan อย่างเป็นระบบ ตรวจสอบให้หน้า Selector มี Disclaimer ชัดเจนว่าเป็นเพียง Testing Mechanism ไม่ใช่การ Login (BR-03) และนำคำแนะนำจาก Peer Review มาสั่งปรับปรุง Responsive Media Queries (AC-28) กับเพิ่ม `:focus-visible` และ Keyboard Navigation Test (AC-30) |
| **7** | Issue 6 Create Ticket UI & Validation | "เริ่มทำ issue 6 ได้เลยอย่าลืม plan และค่อย implement -> merge เรียบร้อยต่อไปเพิ่มข้อมูล คอมเมนท์บนลิงค์นี้..." | วาง Implementation Plan และตรวจสอบฟอร์ม Create Ticket ครอบคลุม field-level validation ทั้ง Summary (5–150 ตัวอักษร) และ Description (10–2000 ตัวอักษร) ควบคุมการตรวจสอบประเภท/ขนาดไฟล์แนบ (≤ 5 MB) และจัดการ Partial Failure กรณีสร้าง Ticket สำเร็จแต่อัปโหลดไฟล์ล้มเหลว (AC-07) โดยไม่ roll back ตั๋วที่สร้างแล้ว พร้อมคงข้อมูลในฟอร์มเมื่อ backend unreachable (AC-06) |
| **8** | Issue 7 My Tickets API & UI | "ต่อไปทำ issue ถัดไปกัน step เดิมเลย plan --> implement -> ตรวจ PR แล้วครับ โดยรวม My Tickets API... แต่ช่วยตรวจใน MyTickets.tsx ตอนนี้ UI มี sorting สำหรับ Ticket Number และ Created Date แต่ยังไม่มี Last Updated... และ Test coverage ยังไม่ครอบคลุม currentStatus filter และ updatedAt sorting" | กำกับ AI พัฒนา `GET /api/tickets` ให้รองรับการค้นหา, ตัวกรองแบบ AND, whitelist sorting พร้อม secondary tie-breaker `{ id: "desc" }`, pagination และแยกระหว่าง Empty State (0 tickets ever) กับ No-Results State (0 filter matches) ใน UI อย่างชัดเจน เมื่อ Reviewer ตรวจพบว่ายังขาด sorting ตาม `updatedAt` บน UI และเทสต์ยังไม่ครอบคลุม `currentStatus` กับ `updatedAt` ผมได้สั่งให้ AI เพิ่มคอลัมน์/sorting ใน UI และเพิ่ม automated tests ทั้ง server และ client ให้ผ่านครบ 100% |
| **9** | Issue 8 Ticket Detail & Attachment UI | "โอเคไป issue ถัดไปกัน -> Ticket Detail and Attachment UI (#19)" | วางกรอบและกำกับ AI พัฒนา `GET /api/tickets/:id` พร้อมตรวจสอบ Ownership Isolation อย่างเข้มงวด (คืน 404 Not Found หากเข้าถึงตั๋วของ requester อื่น ตาม AC-22) กำหนดให้หน้า Ticket Detail แสดงผลแบบ Read-Only ทั้งหมดโดยตัด controls ของ IT Staff ออก (ห้ามมี comment, workflow dropdown หรือ internal notes ตาม AC-21) และสร้าง Attachment Section ที่แยก Active vs Soft-Removed, จำกัด active attachment สูงสุด 5 ไฟล์ (AC-11), และมี modal บังคับกรอกเหตุผลลบ ≥3 ตัวอักษร (AC-13, BR-21) พร้อมตรวจจับจุดผิดพลาดใน component test เรื่อง text selector ชนกันและสั่งแก้ไขด้วย `within()` scoping จนผ่านครบทั้ง 80 tests |
| **10** | Issue 9 E2E & Release Readiness | "ไปลุย issue สุดท้ายกันเลย -> E2E, visual QA, documentation, and release readiness (#20)" | กำกับ AI ออกแบบและพัฒนาชุด Playwright E2E suites ครอบคลุม complete user journey (E2E-01) และ responsive/accessibility audit (E2E-02) บน 3 viewports (Desktop 1280px, Tablet 768px, Mobile 375px) ตรวจพบปัญหา horizontal scroll บน mobile จากปุ่ม pagination 7 ปุ่มใน MyTickets และสั่งให้ AI แก้ด้วย `flex-wrap: wrap` และ `.zen-main-container` จนได้ Zero Horizontal Overflow (`scrollWidth <= window.innerWidth`) ในทุกหน้าจอ ควบคุมการจับภาพ Visual QA 11 ภาพลงใน `artifacts/` และอัปเดตเอกสารสรุปผลเทสต์ผ่าน 86/86 tests (100% Pass Rate) |

---

## My Reflection

ตลอดการพัฒนา Lab 2 ผมได้เรียนรู้ว่า **AI เป็นเครื่องมือเร่งความเร็วในการเขียนโค้ด (Speed Multiplier) ที่ทรงพลัง แต่ความถูกต้องเชิงวิศวกรรม (Engineering Correctness) ยังคงต้องอาศัยการตัดสินใจและการตรวจสอบอย่างเข้มงวดของตัวนักพัฒนาเอง**

1. **การควบคุมด้วย Spec-Driven & Test-Driven Development (TDD):**
   หากปล่อยให้ AI เขียนโค้ดโดยไม่มีกรอบที่ชัดเจน AI มักจะสร้างโซลูชันที่ครอบคลุมเฉพาะ Happy Path แต่ตกหล่น Edge Cases เช่น Idempotency Race Condition, การจัดการ Partial Failure ระหว่างการสร้างตั๋วกับการอัปโหลดไฟล์ (AC-07), หรือการที่ฟอร์มเผลอล้างข้อมูลผู้ใช้ทิ้งเมื่อ Server ตอบกลับเป็น Error การมี Acceptance Criteria และการเขียน Automated Test กำกับไว้ล่วงหน้า ทำให้สามารถทดสอบและตีกรอบให้ AI ปรับแก้จนผ่านเกณฑ์ได้อย่างปลอดภัย

2. **คุณค่าของการทำ Peer Review ควบคู่กับ AI:**
   การทำงานร่วมกับเพื่อนร่วมชั้น (@thanapornboont-star) แสดงให้เห็นถึงความสำคัญของ Human Reviewer ตัวอย่างเช่น ใน Issue 3 เพื่อนมองเห็นจุดเสี่ยงเรื่อง Concurrent Requests ที่ใช้ Idempotency-Key เดียวกัน, ใน Issue 5 เพื่อนช่วยตรวจเรื่อง Accessibility (`:focus-visible`) และ Responsive Layout บนมือถือ, ใน Issue 6 เพื่อนได้ตรวจสอบความครบถ้วนของ Error Handling และ Form Validation รวมถึงการที่ผมได้ช่วย Review PR #30 ของเพื่อนเรื่อง CSS utility classes ที่ขาดหายก่อนจะ Merge, ใน Issue 7 เพื่อนช่วยตรวจจับจุดตกหล่นเรื่องการขาด sorting ตาม `updatedAt` บน UI และเคสทดสอบ `currentStatus`, ใน Issue 8 เราทั้งคู่ได้ตรวจทานการทำ Ownership Isolation (404), การตัดสิทธิ์ workflow controls ของฝั่ง Requester และ Attachment Lifecycle Management จนระบบมีความรัดกุมก่อนส่งมอบ และใน Issue 9 เพื่อนได้ช่วยตรวจสอบความครบถ้วนของ E2E flow, responsive/accessibility tests บนทั้ง 3 viewports รวมถึงการอัปเดตผลการทดสอบ 86/86 tests

3. **บทบาทของนักพัฒนาในยุค AI-Augmented Engineering:**
   ผมพบว่าทักษะที่สำคัญที่สุดไม่ใช่การจำไวยากรณ์โค้ด แต่คือ **การออกแบบโครงสร้างระบบ (System Architecture), การอ่านและวิเคราะห์ Log/Diff อย่างละเอียด, และการตั้งคำถามเชิงวิพากษ์ (Critical Thinking)** เพื่อประเมินว่าโค้ดที่ AI สร้างขึ้นนั้น ปลอดภัย มีประสิทธิภาพ และตอบโจทย์มาตรฐานวิชาชีพอย่างแท้จริงหรือไม่

