# Lab 2 — AI Use and Reflection

**LLM/Agent used:** Google Antigravity AI Agent  
**Model:** Gemini 3.7 Flash / Claude 3.7 Sonnet  
**Thinking level:** Standard / Extended reasoning  

---

## Selected Key Prompts (6–10 Prompts)

| # | Prompt Purpose | Prompt (summarised) | What I Did / Reviewed / Fixed |
|:---:|---|---|---|
| **1** | Plan & Issue Setup | "จากไฟล์พวกนี้ช่วยพาผมทำ lab2 Software หน่อย โดยไม่ข้ามขั้น มีขั้นตอน PR ด้วยโดยทำคู่กับเพื่อนให้เพื่อนเป็นคน Approve และ merge พาทำแบบละเอียด" | ให้ Agent วิเคราะห์ requirement จาก `Lab_02_labsheet.pdf` และ `lab2-workthrough.md`, แตก 9 Issues เข้าสู่ GitHub Project Board พร้อมระบุ scope, AC และ dependencies ชัดเจน |
| **2** | Issue 1 Contract Generation | "ขอใหม่ตั้งแต่ Step 1: อย่าลืมพวกชื่อและรายละเอียดทั้งหมดด้วยทำทีละ step รอผมเสร็จก่อน -> เรียบร้อย issue 1 : #12" | ให้ Agent สร้าง branch `feature/12-lab2-contract` และจัดทำเอกสาร Contract ทั้ง 4 ชุด (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) ให้ครอบคลุม AC-01 ถึง AC-36 ตรวจสอบความสอดคล้องของ Business Rules ทุกข้อ |
| **3** | Issue 2 Schema & Context API | "ไป issue 2 กันเลย -> Implement Development Requester schema, seed, and context API" | นำหลักการ TDD มาใช้ โดยให้ Agent เขียน failing API tests ก่อน (`API-01, API-02, API-03`), เพิ่ม Prisma Model `DevRequester`/`Category`/`RelatedSystem`, สร้าง Idempotent seed script, และทำ middleware กรอง header `X-Dev-Requester-Id` อย่างเข้มงวด |

---

## My Reflection

การใช้ AI Agent ในช่วงการวางแผน (Spec-Driven Development) ช่วยให้สามารถแปลงความต้องการของ Stakeholder และ Lab Sheet ที่ซับซ้อนให้ออกมาเป็น Functional Requirements (FRs), Business Rules (BRs) และ Acceptance Criteria (ACs) ได้อย่างรัดกุม โดยผมได้ตรวจสอบและปรับปรุงให้ `specification.md`, `api-spec.md`, `ui-spec.md` และ `tests.md` เชื่อมโยงกันแบบ 100% Traceability ก่อนที่จะเริ่มเขียนโค้ดจริง และในขั้นตอนการทำ TDD บน Issue 2 ได้เน้นย้ำการตรวจสอบความถูกต้องของการทำ seed แบบ idempotent เพื่อให้สามารถรันซ้ำได้โดยไม่เกิด duplicate
