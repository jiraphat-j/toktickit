# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash (Google Antigravity AI Agent)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | ให้ช่วยทำ Lab 1 Issue 1 (feature/1-project-foundation) โดยยึด checklist และ PROJECT_STRUCTURE.md เป็นหลัก ให้ตรวจสถานะ repo ก่อนสรุปแผน | ตรวจสอบไฟล์ในโปรเจกต์ ยืนยัน PostgreSQL provider ใน `schema.prisma` และสร้าง `implementation_plan.md` สรุปขั้นตอนงาน Foundation |
| 2 | อนุมัติแผนและให้เริ่มดำเนินการ พร้อมบันทึกประวัติ prompt ลงใน `docs/lab-01/ai_use.md` ตั้งแต่ต้นแชท | อัปเดต `README.md` ติดตั้ง dependencies ของ client/server รันการทดสอบ Vitest/Supertest |
| 3 | ดำเนินการ Issue 2 (API Health Check) เพิ่ม endpoint `GET /api/health` และปรับปรุง React UI แสดงสถานะ Online/Offline พร้อมบันทึกใน `ai_use.md` | อัปเดต `server/src/app.ts` ส่งคืน HTTP 200 ปรับแต่ง `api.ts` และ `App.tsx` เพื่อเช็คสถานะ API และรัน Supertest `health.test.ts` ผ่านเรียบร้อย |
| 4 | ดำเนินการ Issue 3 (Create & Seed Categories) สร้าง Prisma Category Model และ Seed Script 4 หมวดหมู่แบบ idempotent พร้อมบันทึกใน `ai_use.md` | เพิ่ม `model Category` ใน `schema.prisma`, เขียนสคริปต์ `upsert` ใน `seed.ts` สำหรับ 4 หมวดหมู่ และสั่ง `npx prisma generate` |
| 5 | *(Reserved for Issue 4 — Category List UI & API)* | |
| 6 | *(Reserved for Release & Test Verification)* | |

## Reflection
การระบุเงื่อนไขอย่างชัดเจนใน Prompt (เช่น กำหนดให้ใช้ `lab1_checklist.md` เป็น Source of Truth, ห้ามทำข้ามไป Issue 2–4 บน branch Foundation, และห้าม commit/push อัตโนมัติ) ช่วยให้ AI Agent วางแผนและดำเนินการตรงตามหลักสถาปัตยกรรมและ Git Flow ของวิชา
