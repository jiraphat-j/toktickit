# Lab 3 — AI Use and Reflection

**LLM/Agent used:** Google Antigravity AI Agent  
**Model:** Gemini 3.8 Flash (High reasoning) / Claude 3.7 Sonnet  
**Thinking level:** Extended reasoning & Spec-Driven Engineering  

---

## Selected Key Prompts (Lab 3 Sprint)

| # | Prompt Purpose | Prompt (summarised) | What I Did / Reviewed / Fixed |
|:---:|---|---|---|
| **1** | Sprint 3 Contract & Specification | "เริ่มต้น Lab 3 โดยยึดตาม LAB3_AI_AGENT_PLAYBOOK_OWNER.md ให้พาทำทีละ step อย่างละเอียด วางแผนระบบ Authentication และ RBAC 3 บทบาท พร้อมกำหนด Status Transition Matrix และ User Management safeguards ก่อนเริ่มเขียนโค้ด" | กำกับ AI ให้วิเคราะห์ requirements จาก `Lab_3_sheet.pdf` และ playbook เพื่อร่างเอกสาร Specification ทั้ง 3 ฉบับ (`specification.md`, `ui-spec.md`, `api-spec.md`) ตรวจสอบความถูกต้องของการแปลง temporary requester selector มาเป็น real session authentication, ตรวจทาน Authorization Matrix ให้ปิดกั้น Requester จาก Internal Notes และ Status mutation อย่างสมบูรณ์ 100%, และกำหนดกฎความปลอดภัย BR-20/BR-21 ป้องกัน Admin ลบหรือปิดใช้งานบัญชีตัวเองและ Admin คนสุดท้ายในระบบ |
| **2** | Test DD & Traceability Plan | "จัดทำเอกสาร docs/lab-03/tests.md เพื่อวางแผนการทดสอบแบบ Test-Driven Development ก่อนเขียนโค้ด ครอบคลุมทั้ง Unit, Component, API, Security/RBAC, Regression และ E2E พร้อมทำตาราง Traceability Matrix แมป AC-01 ถึง AC-22 ให้ครบ 100%" | วางแผนโครงสร้างชุดทดสอบร่วมกับ AI โดยกำหนดให้มี Test IDs ที่เจาะจงชัดเจน (`AUTH-*`, `SEC-*`, `REQ-*`, `STF-*`, `COM-*`, `ADM-*`, `UI-*`, `E2E-*`) กำกับให้เน้นการทดสอบเชิงลึกในฝั่ง Direct API Security Authorization เพื่อยืนยันว่าการซ่อนปุ่มบนหน้าบ้านจะไม่สามารถข้ามการตรวจสิทธิ์หลังบ้านได้ และตรวจสอบให้แน่ใจว่าทุก Acceptance Criterion มี automated test รองรับล่วงหน้าก่อนเริ่มลงมือเขียนโค้ดจริง |
| **3** | User Model, Migration & Seed Foundation | "อัปเดต Prisma schema สร้าง User data model รองรับ Role (REQUESTER, IT_STAFF, ADMIN), จัดการ migration เพื่อย้ายข้อมูล DevRequester เดิมเข้าสู่ User โดยไม่ทำให้ข้อมูล Ticket สูญหาย (Zero Data Loss), และอัปเดต seed.ts ให้ครอบคลุม Users ทุกบทบาท พร้อม Ticket และ Comments ตาม Playbook Step 3" | ตรวจสอบโครงสร้าง Schema ร่วมกับ AI และเขียน Custom SQL Migration เพื่อ backfill ข้อมูล `itPriority` และคัดลอกข้อมูลจาก `DevRequester` เข้าตาราง `User` พร้อมแฮชรหัสผ่าน `Password123!` ป้องกันข้อผิดพลาด Foreign Key Violation เมื่อผูก `Ticket.requesterId` เข้ากับ `User.id` รวมทั้งกำกับให้ `seed.ts` มีคุณสมบัติ Idempotent และสร้างชุดทดสอบ `migration-seed.test.ts` เพื่อยืนยันความถูกต้องของข้อมูลในฐานข้อมูล 100% |
| **4** | Authentication, Session & Password Lifecycle | "พัฒนาระบบ Authentication, Session Management และรหัสผ่านตาม Step 4 (Issue #35): สร้าง session store ด้วย HttpOnly signed cookie และ token ในหน่วยความจำ, ทำ POST /api/auth/login ตรวจสอบ bcrypt hash พร้อม generic 401 เมื่อข้อมูลไม่ถูกต้องหรือบัญชี inactive, ทำ POST /api/auth/change-password บังคับเปลี่ยนรหัสผ่านตาม complexity requirements, และสร้างหน้า Login, ChangePassword พร้อม middleware requireAuth ป้องกัน protected routes" | กำกับ AI ในการสร้าง Session Management โดยใช้ Signed HttpOnly Cookies (`toktickit_session`) และ Cryptographic Token ร่วมกับ middleware `requireAuth` ที่ตรวจสอบ `isActive` และบังคับเปลี่ยนรหัสผ่าน (`mustChangePassword: true`) โดยส่ง `403 PASSWORD_CHANGE_REQUIRED` หากยังไม่เปลี่ยนรหัสผ่าน, ตรวจสอบการจัดการ Client-Side Validation ในคอมโพเนนต์ `Login.tsx` และ `ChangePassword.tsx` ให้มี Checklist กฎความปลอดภัยรหัสผ่านแบบเรียลไทม์, และแก้ไขปัญหา Race Condition/Mock Collision ในการทดสอบ Unit Tests ของ Lab 2 โดยใช้ Session Presence Check ใน `App.tsx` ทำให้เทสต์เดิมทั้ง 46 ข้อและเทสต์ใหม่ผ่านได้ครบ 100% |

---

## My Reflection

ตลอดการดำเนินงานในขั้นตอนแรกๆ ของ **Lab 3 (Users, Roles, IT Staff Ticketing, and Admin Screens)** ผมได้เรียนรู้ว่า **การวางแผนการทดสอบ (Test-Driven Development) ร่วมกับการกำหนด Specification อย่างแม่นยำ และการออกแบบ Database Migration อย่างรัดกุม เปรียบเสมือนเข็มทิศและโครงสร้างค้ำยันทางวิศวกรรม ที่ทำให้การพัฒนาฟีเจอร์ระดับองค์กรเป็นไปอย่างราบรื่นและไร้ข้อผิดพลาด**

1. **คุณค่าของ Spec-Driven Development (Spec DD) ในการจัดการความปลอดภัย:**
   ในการทำงานด้านความปลอดภัยและระบบสิทธิ์ (RBAC) การมีเอกสาร Specification ที่ระบุ Functional Requirements (FR), Business Rules (BR) และ Authorization Matrix อย่างชัดเจนตั้งแต่ต้นช่วยป้องกันช่องโหว่ประเภท Broken Access Control (OWASP Top 10) ได้อย่างมีนัยสำคัญ ผมได้ควบคุมให้ AI แยกสิทธิ์การเข้าถึงอย่างเด็ดขาด โดยเฉพาะการแยกแยะระหว่าง **Public Comments** (สื่อสารระหว่างผู้ใช้กับเจ้าหน้าที่) และ **Internal Notes** (บันทึกภายในสำหรับ IT Staff และ Admin เท่านั้น) พร้อมทั้งกำหนดให้การตรวจสอบสิทธิ์ทั้งหมดต้องเกิดขึ้นที่ฝั่ง Server-Side เสมอ ไม่พึ่งพาเพียงการซ่อนปุ่มบนหน้า UI

2. **การวางแผน Lifecycle และ Edge Cases ก่อนลงมือเขียนโค้ด:**
   การสร้างระบบบริหารจัดการผู้ใช้ (User Management) มีจุดบกพร่องที่พบบ่อย เช่น การที่ผู้ดูแลระบบเผลอปิดการใช้งานบัญชีของตนเองจนไม่สามารถเข้าสู่ระบบได้ (Self-Deactivation) หรือการปิดการใช้งานผู้ดูแลระบบคนสุดท้ายขององค์กร (Last Active Admin Lockout) การกำหนดกฎ BR-20 และ BR-21 ไว้ใน Specification ตั้งแต่ขั้นตอนแรก ทำให้ระบบมีกลไกป้องกันตั้งแต่ระดับ Data Layer และ API Validation ก่อนที่จะเริ่มเขียนโค้ดส่วน Backend

3. **พลังของ Acceptance Criteria Traceability Matrix ใน Test DD:**
   การสร้าง `docs/lab-03/tests.md` ก่อนเริ่มเขียนโค้ดทำให้ผมเห็นภาพรวมของระบบทั้งหมด การแมปทุก AC เข้ากับ Test ID (เช่น `SEC-04` สำหรับการทดสอบว่า Requester ไม่สามารถแอบเข้าถึง `/internal-notes` ได้โดยเด็ดขาด) ช่วยเปลี่ยนข้อความเชิงบรรยายให้กลายเป็นเงื่อนไขทดสอบเชิงประจักษ์ (Executable Verification) ทำให้มั่นใจได้ว่าเมื่อลงมือพัฒนาใน Step ถัดไป ระบบจะมีเกณฑ์การประเมินคุณภาพที่โปร่งใสและตรวจสอบย้อนกลับได้แบบ 100%

4. **การทำงานร่วมกับ AI ในฐานะ Enterprise Architect:**
   บทบาทของผมในขั้นตอนนี้คือการทำหน้าที่เป็น Lead Engineer และ System Architect ที่คอยตั้งคำถาม ทบทวนข้อขัดแย้งเชิงตรรกะในเอกสาร และควบคุมให้ AI ผลิตเอกสารสัญญาทางวิศวรรณกรรมที่สอดคล้องกับมาตรฐานของห้องปฏิบัติการและตอบโจทย์ Stakeholder ได้อย่างแม่นยำและรัดกุมที่สุด

5. **กลยุทธ์ Database Migration และการรักษาความสมบูรณ์ของข้อมูล (Zero Data Loss Migration):**
   ในการเปลี่ยนผ่านจาก Temporary `DevRequester` สู่ Enterprise `User` Model พร้อม Role-Based Access Control หากใช้การ Reset ฐานข้อมูลหรือ Generate Migration แบบอัตโนมัติของ Prisma จะเสี่ยงต่อการเกิด Data Loss หรือติด Foreign Key Constraint Error ผมจึงกำกับให้สร้าง Custom SQL Migration Script ที่ดำเนินการอย่างเป็นลำดับ: สร้างตาราง `User` ก่อน แล้วคัดลอกข้อมูลจาก `DevRequester` พร้อมสร้าง Password Hash และ UUID เดิม จากนั้นจึงทำการ Backfill ค่า `itPriority` ของ Ticket เดิมให้เท่ากับ `requestedPriority` ก่อนที่จะใส่เงื่อนไข `NOT NULL` และ Foreign Key Constraint วิธีการนี้ทำให้ตั๋วและประวัติเดิมในระบบยังคงอยู่ครบถ้วน 100% และระบบฝั่ง Lab 2 Regression Tests ก็ยังทำงานผ่านได้ต่อเนื่องโดยไม่มีผลกระทบ (Backward Compatible)

6. **Session Security, HttpOnly Cookies และความท้าทายด้าน Test Isolation:**
   ในการพัฒนาระบบ Authentication สำหรับ Web Application ความปลอดภัยของ Session Token เป็นสิ่งสำคัญสูงสุด การเลือกใช้ Signed HttpOnly Cookies แทนการเก็บ Token ใน `localStorage` ช่วยป้องกันการโจมตีประเภท Cross-Site Scripting (XSS) Token Theft ได้อย่างมีประสิทธิภาพ นอกจากนี้ ในการทดสอบระดับ Unit/Integration ร่วมกับโค้ดดั้งเดิม (Lab 2 Requester Selector) การเรียก `fetchCurrentUser()` ทันทีเมื่อ App mount อาจรบกวน Mock ของเทสต์เดิมที่ไม่ได้คาดการณ์ API call ล่วงหน้า ผมจึงออกแบบให้ระบบใช้ Session Indicator flag ในการตัดสินใจ revalidate ทำให้ทั้งการป้องกันความปลอดภัยและการแยกสภาพแวดล้อมการทดสอบ (Test Isolation) เป็นไปอย่างสมบูรณ์แบบ
