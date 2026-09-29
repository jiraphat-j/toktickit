# Lab 4 — AI Use and Reflection
### TokTickIT — Actions Taken, Dashboards, and Final Regression

**LLM/Agent used:** Google Antigravity AI Agent  
**Model:** Gemini 3.8 Flash (High reasoning) / Claude Opus 4.6  
**Thinking level:** Extended reasoning & Spec-Driven Engineering  

---

## Selected Key Prompts (Lab 4 Sprint)

| # | Prompt Purpose | Prompt (summarised) | What I Did / Reviewed / Fixed |
|:---:|---|---|---|
| **1** | Sprint 4 Contract & Specification (Issue #55) | "เริ่มต้น Lab 4 จาก Lab4_labsheet.pdf กำหนด Engineering Specification, UI-Spec, API-Spec, Tests blueprint ครอบคลุม Actions Taken (Parent-Child relationship), Ticket Status Transition Matrix, Resolution Gate (ห้าม Resolve ถ้า Actions Taken = 0), และ Role Dashboards สำหรับ Requester และ IT Staff พร้อม Zero Regression" | กำกับ AI ให้สกัดข้อกำหนดทั้งหมดจากอาจารย์ผู้สอน แปลงเป็น Functional Requirements (FR-01..13), Business Rules (BR-01..19), และ Acceptance Criteria (AC-01..14), ตรวจสอบความถูกต้องของการออกแบบ Schema `ActionTaken` ให้เชื่อมโยงกับ `Ticket` และ `User`, ตรวจสอบ Resolution Gate ให้มี Server-side enforcement และกำหนดเกณฑ์การคำนวณ Dashboard ให้ดึงจากข้อมูลจริงหลังบ้าน 100% |
| **2** | Test DD & Traceability Plan (Issue #56) | "วางแผน Test-Driven Development (Test DD) สำหรับ Lab 4 ใน docs/lab-04/tests.md โดยสร้าง Traceability Matrix แมปทุก Acceptance Criterion (AC-01 ถึง AC-14) เข้ากับ Test IDs ให้ครบ 100% ก่อนเริ่มเขียนโค้ด ครอบคลุม Unit, Supertest API, Security/RBAC, UI Component, Workflow, Zero Regression และ Playwright E2E" | กำกับ AI ให้จัดทำตารางแผนการทดสอบล่วงหน้า 35 ชุดทดสอบ (`MIG-*`, `SEED-*`, `ACT-*`, `ACT-SEC-*`, `ACT-REQ-*`, `WF-*`, `DASH-*`, `UI-*`, `E2E-*`, `REG-*`), ตรวจสอบการวางแผนเคสทดสอบ Resolution Gate ให้ดักจับทั้งการยิง API ตรงและการกดผ่าน UI, ตรวจสอบการแยกสิทธิ์ Dashboard Data Isolation ระหว่าง Requester แต่ละคน, และบันทึกคำสั่งรันเทสต์ทั้งหมด |
| **3** | Actions Taken DB Migration & Seed (Issue #57) | (Upcoming) | (Pending implementation) |
| **4** | Actions Taken REST APIs & Authorization (Issue #58) | (Upcoming) | (Pending implementation) |
| **5** | Actions Taken UI on Ticket Detail (Issue #59) | (Upcoming) | (Pending implementation) |
| **6** | Ticket Workflow & Resolution Gate (Issue #60) | (Upcoming) | (Pending implementation) |
| **7** | IT Staff Role Dashboard (Issue #61) | (Upcoming) | (Pending implementation) |
| **8** | Requester Role Dashboard (Issue #62) | (Upcoming) | (Pending implementation) |
| **9** | Final Regression & Playwright E2E (Issue #63-64) | (Upcoming) | (Pending implementation) |
| **10** | Release Readiness & Documentation (Issue #65) | (Upcoming) | (Pending implementation) |

---

## My Reflection

*(ส่วนนี้จะได้รับการสรุปและเขียนบรรยายเชิงวิศวกรรมซอฟต์แวร์เมื่อเสร็จสิ้นการพัฒนาทุกขั้นตอน เพื่อสะท้อนถึงการออกแบบ Parent-Child Work Logging, Resolution Gate, Dashboard Analytics, และ Zero Regression)*
