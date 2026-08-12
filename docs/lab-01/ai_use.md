# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash (Google Antigravity AI Agent)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | ให้ช่วยทำ Lab 1 Issue 1 (feature/1-project-foundation) โดยยึด checklist และ PROJECT_STRUCTURE.md เป็นหลัก ให้ตรวจสถานะ repo ก่อนสรุปแผน | ตรวจสอบไฟล์ในโปรเจกต์ ยืนยัน PostgreSQL provider ใน `schema.prisma` และสร้าง `implementation_plan.md` สรุปขั้นตอนงาน Foundation |
| 2 | อนุมัติแผนและให้เริ่มดำเนินการ พร้อมบันทึกประวัติ prompt ลงใน `docs/lab-01/ai_use.md` ตั้งแต่ต้นแชท | อัปเดต `README.md` ติดตั้ง dependencies ของ client/server รันการทดสอบ Vitest/Supertest |
| 3 | *(Reserved for Issue 2 — Health Check)* | |
| 4 | *(Reserved for Issue 3 — Category Schema & Seed)* | |
| 5 | *(Reserved for Issue 4 — Category List UI & API)* | |
| 6 | *(Reserved for Release & Test Verification)* | |

## Reflection
การระบุเงื่อนไขอย่างชัดเจนใน Prompt (เช่น กำหนดให้ใช้ `lab1_checklist.md` เป็น Source of Truth, ห้ามทำข้ามไป Issue 2–4 บน branch Foundation, และห้าม commit/push อัตโนมัติ) ช่วยให้ AI Agent วางแผนและดำเนินการตรงตามหลักสถาปัตยกรรมและ Git Flow ของวิชา
