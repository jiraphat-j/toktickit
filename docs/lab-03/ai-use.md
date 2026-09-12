# Lab 3 — AI Use and Reflection

**LLM/Agent used:** Google Antigravity AI Agent  
**Model:** Gemini 3.8 Flash (High reasoning) / Claude 3.7 Sonnet  
**Thinking level:** Extended reasoning & Spec-Driven Engineering  

---

## Selected Key Prompts (Lab 3 Sprint)

| # | Prompt Purpose | Prompt (summarised) | What I Did / Reviewed / Fixed |
|:---:|---|---|---|
| **1** | Sprint 3 Contract & Specification | "เริ่มต้น Lab 3 โดยยึดตาม LAB3_AI_AGENT_PLAYBOOK_OWNER.md ให้พาทำทีละ step อย่างละเอียด วางแผนระบบ Authentication และ RBAC 3 บทบาท พร้อมกำหนด Status Transition Matrix และ User Management safeguards ก่อนเริ่มเขียนโค้ด" | กำกับ AI ให้วิเคราะห์ requirements จาก `Lab_3_sheet.pdf` และ playbook เพื่อร่างเอกสาร Specification ทั้ง 3 ฉบับ (`specification.md`, `ui-spec.md`, `api-spec.md`) ตรวจสอบความถูกต้องของการแปลง temporary requester selector มาเป็น real session authentication, ตรวจทาน Authorization Matrix ให้ปิดกั้น Requester จาก Internal Notes และ Status mutation อย่างสมบูรณ์ 100%, และกำหนดกฎความปลอดภัย BR-20/BR-21 ป้องกัน Admin ลบหรือปิดใช้งานบัญชีตัวเองและ Admin คนสุดท้ายในระบบ |

---

## My Reflection

ในก้าวแรกของการพัฒนา **Lab 3 (Users, Roles, IT Staff Ticketing, and Admin Screens)** ความท้าทายหลักไม่ใช่การเขียนโค้ดฟังก์ชันใหม่จากศูนย์ แต่คือ **การออกแบบสถาปัตยกรรม (System Architecture) เพื่อยกระดับระบบจาก Single-Role Testing Prototype ใน Lab 2 ไปสู่ Multi-Role Enterprise Application โดยไม่ทำให้ฟังก์ชันเดิมพังทลาย (Zero Regression)**

1. **คุณค่าของ Spec-Driven Development (Spec DD) ในการจัดการความปลอดภัย:**
   ในการทำงานด้านความปลอดภัยและระบบสิทธิ์ (RBAC) การมีเอกสาร Specification ที่ระบุ Functional Requirements (FR), Business Rules (BR) และ Authorization Matrix อย่างชัดเจนตั้งแต่ต้นช่วยป้องกันช่องโหว่ประเภท Broken Access Control (OWASP Top 10) ได้อย่างมีนัยสำคัญ ผมได้ควบคุมให้ AI แยกสิทธิ์การเข้าถึงอย่างเด็ดขาด โดยเฉพาะการแยกแยะระหว่าง **Public Comments** (สื่อสารระหว่างผู้ใช้กับเจ้าหน้าที่) และ **Internal Notes** (บันทึกภายในสำหรับ IT Staff และ Admin เท่านั้น) พร้อมทั้งกำหนดให้การตรวจสอบสิทธิ์ทั้งหมดต้องเกิดขึ้นที่ฝั่ง Server-Side เสมอ ไม่พึ่งพาเพียงการซ่อนปุ่มบนหน้า UI

2. **การวางแผน Lifecycle และ Edge Cases ก่อนลงมือเขียนโค้ด:**
   การสร้างระบบบริหารจัดการผู้ใช้ (User Management) มีจุดบกพร่องที่พบบ่อย เช่น การที่ผู้ดูแลระบบเผลอปิดการใช้งานบัญชีของตนเองจนไม่สามารถเข้าสู่ระบบได้ (Self-Deactivation) หรือการปิดการใช้งานผู้ดูแลระบบคนสุดท้ายขององค์กร (Last Active Admin Lockout) การกำหนดกฎ BR-20 และ BR-21 ไว้ใน Specification ตั้งแต่ขั้นตอนแรก ทำให้ระบบมีกลไกป้องกันตั้งแต่ระดับ Data Layer และ API Validation ก่อนที่จะเริ่มเขียนโค้ดส่วน Backend

3. **การทำงานร่วมกับ AI ในฐานะ Enterprise Architect:**
   บทบาทของผมในขั้นตอนนี้คือการทำหน้าที่เป็น Lead Engineer และ System Architect ที่คอยตั้งคำถาม ทบทวนข้อขัดแย้งเชิงตรรกะในเอกสาร และควบคุมให้ AI ผลิตเอกสารสัญญาทางวิศวกรรมที่สอดคล้องกับมาตรฐานของห้องปฏิบัติการและตอบโจทย์ Stakeholder ได้อย่างแม่นยำและรัดกุมที่สุด
