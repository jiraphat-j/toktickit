# TokTickIT — Project Structure & File Guide

เอกสารสรุปโครงสร้างโปรเจกต์ **TokTickIT** (Lab 1 Scaffold) 

---

## 📁 Overview Structure

```text
toktickit/
├── .gitignore
├── README.md
├── PROJECT_STRUCTURE.md
├── docs/
│   └── lab-01/
│       ├── ai_use.md
│       ├── reviewer.md
│       └── tests.md
├── client/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   └── tests/
│       ├── setup.ts
│       └── lab-01/
│           └── App.test.tsx
└── server/
    ├── .env.example
    ├── package.json
    ├── tsconfig.json
    ├── vitest.config.ts
    ├── prisma/
    │   ├── schema.prisma
    │   └── seed.ts
    ├── src/
    │   ├── app.ts
    │   ├── index.ts
    │   └── prisma.ts
    └── tests/
        └── lab-01/
            ├── categories.test.ts
            └── health.test.ts
```

---

## 📄 File Details & Responsibilities (รายละเอียดหน้าที่ของแต่ละไฟล์)

### 1. Root Files (โฟลเดอร์หลัก)

* [`.gitignore`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/.gitignore) — กำหนดไฟล์/โฟลเดอร์ที่ไม่ต้องอัปโหลดขึ้น Git เช่น `node_modules/`, `.env`, `dist/`, และไฟล์ฐานข้อมูล Prisma SQLite (`*.db`)
* [`README.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/README.md) — ไฟล์อธิบายโปรเจกต์เบื้องต้น (ปัจจุบันมีเพียงหัวข้อชื่อโปรเจกต์ `# TokTickIT`)
* [`PROJECT_STRUCTURE.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/PROJECT_STRUCTURE.md) — เอกสารสรุปโครงสร้างไฟล์และหน้าที่ความรับผิดชอบของแต่ละไฟล์ในโปรเจกต์

---

### 2. 📂 `docs/lab-01/` (เอกสารสำหรับประกอบการส่ง Lab 1)

* [`docs/lab-01/ai_use.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-01/ai_use.md) — แบบบันทึกการใช้งาน AI/LLM สำหรับลงประวัติ Prompt ที่ใช้ (6–10 prompts) และบทสะท้อนความคิด (Reflection)
* [`docs/lab-01/reviewer.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-01/reviewer.md) — แบบบันทึกการทำ Peer Review กับเพื่อนร่วมงาน (บันทึก Pull Request, ข้อติชมจาก Reviewer และคำตอบรับ)
* [`docs/lab-01/tests.md`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/docs/lab-01/tests.md) — แบบบันทึกแผนการทดสอบ (Test Plan) และหลักฐานผลการทดสอบ (Test Evidence) ทั้ง Server และ Client

---

### 3. 📂 `client/` (Frontend — React + Vite + TypeScript)

#### Config & Root Files
* [`client/.env.example`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/.env.example) — ตัวอย่างไฟล์กำหนด Environment Variable (เช่น `VITE_API_URL="http://localhost:3000"`)
* [`client/index.html`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/index.html) — ไฟล์ HTML หลักสำหรับ Single Page Application (SPA) จุดค้ำยันของ React DOM (`<div id="root">`)
* [`client/package.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/package.json) — กำหนด Dependencies (React, Bootstrap, Testing Library, Vitest ฯลฯ) และ Scripts (dev, build, preview, test)
* [`client/tsconfig.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/tsconfig.json) — การตั้งค่า TypeScript สำหรับ Frontend (JSX React, Type checking, moduleResolution)
* [`client/vite.config.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/vite.config.ts) — การตั้งค่า Vite Dev Server (port 5173) และการตั้งค่า Vitest สำหรับรัน UI Tests บนสภาพแวดล้อม `jsdom`

#### Source Code (`client/src/`)
* [`client/src/App.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/App.tsx) — Main UI Component หลัก จัดการสถานะ UI (idle, loading, success, error) มีปุ่มกด "Check System" เพื่อดึงสถานะระบบและหมวดหมู่ IT Service
* [`client/src/api.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/api.ts) — API Client layer สำหรับติดต่อกับ Backend Server (ฟังก์ชัน `checkSystem()` ทำหน้าที่ยิง Request ไปยัง `/api/health` และ `/api/categories`)
* [`client/src/main.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/main.tsx) — Entry point หลักของ React App ทำหน้าที่ Mount Component `<App />` เข้ากับ DOM element `#root` และนำเข้า Bootstrap CSS
* [`client/src/vite-env.d.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/src/vite-env.d.ts) — TypeScript Type Declaration สำหรับ Vite Client Environment

#### Unit / Component Tests (`client/tests/`)
* [`client/tests/setup.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/tests/setup.ts) — ไฟล์ Setup สำหรับ Vitest นำเข้า Custom Matchers จาก `@testing-library/jest-dom`
* [`client/tests/lab-01/App.test.tsx`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/client/tests/lab-01/App.test.tsx) — Component Test สำหรับ `App.tsx` (ทดสอบการแสดงผล Header, การคลิกปุ่ม, แสดงสถานะ Online/Offline และการโหลดหมวดหมู่)

---

### 4. 📂 `server/` (Backend — Express + Prisma + TypeScript)

#### Config & Root Files
* [`server/.env.example`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/.env.example) — ตัวอย่าง Environment Variables ของ Backend เช่น `DATABASE_URL` (PostgreSQL connection string) และ `PORT=3000`
* [`server/package.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/package.json) — กำหนด Dependencies (Express, Prisma Client, CORS) และ DevDependencies (Supertest, tsx, Vitest) รวมถึง npm scripts (`dev`, `prisma:migrate`, `prisma:seed`, `test`)
* [`server/tsconfig.json`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/tsconfig.json) — การตั้งค่า TypeScript คอมไพเลอร์สำหรับ Node.js Backend (ส่งออกไปที่โฟลเดอร์ `dist/`)
* [`server/vitest.config.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/vitest.config.ts) — การตั้งค่า Vitest สำหรับ Backend Integration Testing ในสภาพแวดล้อม `node`

#### Database Schema & Seed (`server/prisma/`)
* [`server/prisma/schema.prisma`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/prisma/schema.prisma) — นิยาม Prisma Data Model (มีโครงสำหรับการเพิ่ม `Category` model: `id`, `name`, `createdAt`) และการเชื่อมต่อฐานข้อมูล PostgreSQL
* [`server/prisma/seed.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/prisma/seed.ts) — สคริปต์ยัดข้อมูลเริ่มต้น (Seed Data) ของหมวดหมู่บริการ IT ทั้ง 4 หมวดหมู่ (Account and Access, Hardware, Software, Network) โดยใช้ `upsert` เพื่อป้องกันข้อมูลซ้ำซ้อน

#### Backend Source Code (`server/src/`)
* [`server/src/app.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/app.ts) — การตั้งค่า Express App, Middleware (CORS, JSON Parser) และ Router Handler (`GET /api/health`, `GET /api/categories`) โดยแยกออกมาเพื่อให้ Supertest ใช้ทดสอบได้โดยไม่ต้องเปิด HTTP Port
* [`server/src/index.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/index.ts) — Entry point หลักของ Server สั่งให้ `app.listen(PORT)` เพื่อเปิดรับ Web Request ที่ HTTP Port ( default: 3000 )
* [`server/src/prisma.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/src/prisma.ts) — Singleton pattern สำหรับสร้าง PrismaClient (Lazy initialization) เพื่อป้องกันไม่ให้เกิด Database side-effects ขณะทดสอบ Endpoint ที่ไม่ได้ใช้ DB

#### Integration Tests (`server/tests/`)
* [`server/tests/lab-01/health.test.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/tests/lab-01/health.test.ts) — Integration test สำหรับสอบทาน `GET /api/health` โดยใช้ Supertest (ต้องส่ง HTTP 200 และคืนค่า JSON `{ status: "ok", service: "TokTickIT API" }`)
* [`server/tests/lab-01/categories.test.ts`](file:///c:/Users/Feast/OneDrive/Desktop/Work%20University/software%20engineering/Lab1_Starter_Scaffold/toktickit/server/tests/lab-01/categories.test.ts) — Integration test สำหรับสอบทาน `GET /api/categories` ว่าส่งคืนข้อมูล 4 หมวดหมู่ที่ seeded ไว้อย่างถูกต้องตามลำดับ ID
