# Lab 3 Peer Review Record

**Repository:** [jiraphat-j/toktickit](https://github.com/jiraphat-j/toktickit)  
**Author:** Jiraphat ([@jiraphat-j](https://github.com/jiraphat-j))  
**Peer Reviewer (Partner):** Thanaporn ([@thanapornboont-star](https://github.com/thanapornboont-star))  

---

## 1. Peer Review Summary Table (Reviews on My PRs)

| Issue | Title / Feature | PR Link | Reviewer Comments | Author Responses / Action | Status |
|:---:|---|:---:|---|---|:---:|
| **Issue #32** | `docs: Sprint 3 engineering contract and specification` | [PR #43](https://github.com/jiraphat-j/toktickit/pull/43) | "โดยรวม Engineering Specification, API Contract, UI Specification, RBAC, Status Transition Matrix และ Acceptance Criteria ครอบคลุม requirement ของ Lab 3 ได้ดีค่ะ และauthentication/session, requester isolation, Internal Notes protection และ admin safeguards ระบุไว้ชัดเจนและสอดคล้องกันทั้งหมดค่ะ" | ตรวจสอบความถูกต้องและสอดคล้องกันของเอกสารสัญญาทั้ง 5 ไฟล์ ครอบคลุมทุก Acceptance Criteria และเริ่มงาน Test DD ใน Issue #33 | **Approved & Merged** by @thanapornboont-star |
| **Issue #33** | `docs: Test DD and acceptance traceability plan` | [PR #44](https://github.com/jiraphat-j/toktickit/pull/44) | "โดยรวม tests.md ทำได้ละเอียดดีครับ... มี 2 จุดที่อยากให้แก้ก่อน Approve: 1. ใน docs/lab-03/reviewer.md ส่วน Detailed PR Review Logs ของ Issue #33 รบกวนเปลี่ยนเป็นลิงก์ PR #44 2. AC-04 ระบุว่าหลัง Logout ต้องป้องกัน browser back-navigation รบกวนเพิ่ม E2E test สำหรับ Logout → Browser Back" | แก้ไขเรียบร้อยทั้ง 2 จุด: 1. อัปเดตลิงก์ PR #44 ใน docs/lab-03/reviewer.md 2. เพิ่ม E2E test scenario (E2E-01b) ใน tests.md ตรวจสอบ Logout ➔ Browser Back Navigation ว่าถูก redirect ไปที่ /login และบล็อกการดูข้อมูล session เดิม | **Approved & Merged** by @thanapornboont-star |
| **Issue #34** | `feat: Database migration, User model, and seed data` | [PR #45](https://github.com/jiraphat-j/toktickit/pull/45) | "โดยรวม User Model, Role, migration, seed และ migration-seed tests วางโครงสร้างได้ดี โดยเฉพาะการใช้ bcrypt, idempotent upsert และการเพิ่ม Ticket/User relations" | ตรวจสอบความถูกต้องและรัน test migration-seed ผ่าน 100% เรียบร้อยครับ | **Approved & Merged** by @thanapornboont-star (Merge commit `8d5884a`) |
| **Issue #35** | `feat: Authentication, password lifecycle, and session management` | [PR #46](https://github.com/jiraphat-j/toktickit/pull/46) | "Auth API, password lifecycle, session cookie และ test coverage ออกมาดีค่ะ แต่มี blocker ที่ควรแก้ก่อน Approve: 1. handleLoginSuccess() ตอนนี้ set แค่ currentUser แต่ render flow ยังเช็ก !currentRequester ก่อน currentUser 2. revalidateSession() ยังผูกกับ getStoredRequesterId() 3. PR นี้ยังมี flow ของ Dev Selector ค้างอยู่ตาม BR-24 ถ้าตั้งใจคง compatibility ชั่วคราวให้ระบุ scope ให้ชัดเจน 4. Test AUTH-07 ยังไม่มี case session หมดอายุจริง" | แก้ไขเรียบร้อยครบทั้ง 4 จุด: 1. ปรับ render flow ให้ currentUser มี priority สูงสุดเข้า authenticated shell ทันที 2. ให้ session cookie/server identity เป็น source of truth ในการ revalidate เสมอ 3. แยก scope ของ legacy dev selector ไว้อย่างชัดเจนพร้อมระบุว่าจะ retire ถาวรใน Step 5 (Issue #36) 4. เพิ่ม helper expireAllSessions() และ test case สำหรับ expired session ใน AUTH-07 พร้อมเพิ่ม component test App.auth.test.tsx | **Approved & Merged** by @thanapornboont-star (Merge commit `fc9dd58`) |
| **Issue #36** | `feat: RBAC authorization layer and Requester regression` | [PR #47](https://github.com/jiraphat-j/toktickit/pull/47) | "BAC middleware, requester ownership isolation, forged requesterId protection และ Problem Appears Resolved test ทำได้ดีค่ะ" | ขอบพระคุณครับ | **Approved & Merged** by @thanapornboont-star (Merge commit `3a0e6c6`) |
| **Issue #38** | `feat: IT Staff Ticket Detail, claiming, and communication workflow` | [PR #49](https://github.com/jiraphat-j/toktickit/pull/49) | "Staff Ticket Detail, Claim/Reassign, IT Priority และ Status Transition ทำได้ดีมากค่ะ... แต่ staff-ticket-detail.api.test.ts ตอนนี้ยังเน้น owner, priority และ status workflow เป็นหลัก ยังไม่มี automated API test ที่ยืนยัน communication permission boundary โดยเฉพาะ Requester ต้องถูกปฏิเสธการอ่าน/สร้าง Internal Note ด้วย 403 รบกวนเพิ่ม tests อย่างน้อยตามนี้: Requester สร้าง Public Comment ได้, Staff/Admin อ่าน/สร้าง Public Comment ได้, Requester ไม่สามารถอ่าน/สร้าง Internal Note (403), Staff/Admin สร้าง Internal Note ได้" | เพิ่มชุดทดสอบใน `server/tests/lab-03/staff-ticket-detail.api.test.ts` ครอบคลุม Communication & Authorization Boundaries ครบทั้ง 5 เคส: Requester สร้าง Public Comment, Staff/Admin อ่าน/สร้าง Public Comment, Requester บล็อก Internal Notes (403), Staff/Admin อ่าน/สร้าง Internal Notes ได้สมบูรณ์ ผ่านครบ 34/34 tests | In Review |
| **Issue #39** | `feat: Administrator User Management and safeguards` | Planned | - | - | Planned |
| **Issue #40** | `test: Cross-feature UI shell, visual QA, and screenshots` | Planned | - | - | Planned |
| **Issue #41** | `test: E2E scenarios and complete regression suite` | Planned | - | - | Planned |
| **Issue #42** | `docs: Lab 3 documentation completion and submission evidence` | Planned | - | - | Planned |
| **Release** | `release: merge lab3-staging to main` | Planned | - | - | Planned |

---

## 2. Peer Review Given to Partner (@thanapornboont-star)

| Step / Work Item | Title / Feature | PR Link | My Comments Given | Partner Response & Fixes | Status |
|:---:|---|:---:|---|---|:---:|
| **Step 1** | `docs: establish Sprint 3 contract, specifications, and test blueprint…` | [PR #50](https://github.com/thanapornboont-star/toktickit/pull/50) | "ตรวจ PR #50 เรียบร้อยครับ เป็นการวางโครง Contract และ Test Blueprint ของ Lab 3 ที่ละเอียดและครอบคลุมมาก ทั้งการแยก Scope 3 บทบาท, Business Rules และ State Machine ของตั๋ว รวมถึง Schema และ Test Matrix ที่เตรียมไว้" | "ขอบคุณค่ะ" | **Approved & Merged** |
| **Step 3** | `feat: migrate identity to User model and seed Lab 3 roles and data` | [PR #51](https://github.com/thanapornboont-star/toktickit/pull/51) | "ตรวจ PR #51 เรียบร้อยครับ ตัว migration ทำได้ยอดเยี่ยมมาก มีการย้ายข้อมูลจาก DevRequester เข้า User table โดยคง id เดิมและ sync sequence ให้ครบถ้วน ทำให้ข้อมูลเดิมไม่สูญหายและไม่เกิด regression กับเทสต์เดิมของ Lab 1-2 เลยครับ ตัว seed ก็ครอบคลุมทั้ง 3 role และรันซ้ำได้ปลอดภัย" | "ขอบคุณค่ะ" | **Approved & Merged** |
| **Step 4** | `Sprint3/auth account entry` | [PR #52](https://github.com/thanapornboont-star/toktickit/pull/52) | "ตรวจ PR #52 เรียบร้อยครับ ระบบ Authentication และ First Password Change ทำได้รัดกุมมาก: มีการใช้ bcrypt และ session token ใน DB พร้อม expiration check, การล็อกอินตอบ error แบบ generic (401) ป้องกัน user enumeration และแยกเคสบัญชีถูกปิดใช้งาน (403) ถูกต้องตาม BR-01, BR-02, หน้า ChangePassword มี interactive checklist ตรวจสอบกฎรหัสผ่านแบบเรียลไทม์ และระบบใน App.tsx ดักไม่ให้เข้าหน้าอื่นก่อนเปลี่ยนรหัสผ่านได้สมบูรณ์, เทสต์ทั้งฝั่ง Server และ Client ผ่านครบ 100% โดยไม่กระทบโค้ดเดิม" | "ขอบคุณมากค่ะ โชคดีจังไม่ต้องแก้" | **Approved & Merged** |
| **Step 5** | `feat(sprint3/wi4): RBAC enforcement, requester continuity, public comments, indicate-resolved` | [PR #53](https://github.com/thanapornboont-star/toktickit/pull/53) | "ตรวจ PR #53 เรียบร้อยครับ การวาง Authorization Boundary และการเชื่อมต่อ Requester Continuity ทำได้สมบูรณ์มาก: การบังคับตัวตนผ่าน Bearer token และการตัดสิทธิ์ field ที่ client พยายาม spoof (requesterId, ownerId, status) เป็นไปตาม BR-07 และ BR-10 ครบถ้วน, การตอบกลับด้วย 404 Not Found เมื่อ Requester เข้าถึงตั๋วคนอื่น ช่วยป้องกัน information disclosure ได้ถูกต้องตาม BR-09, ฟังก์ชัน Public Comments และ Problem Appears Resolved ทำงานได้ตาม AC-08, AC-09, Middleware authenticateSessionOrDev ช่วยให้โค้ดของเดิมใน Lab 2 ยังทำงานได้ครบถ้วนโดยไม่เกิด regression, เทสต์ทั้ง Server (53/53) และ Client (39/39) ผ่านครบ 100% เอกสาร tests.md และ reviewer.md อัปเดตเรียบร้อยครับ Approved ครับ" | "ขอบคุณอีกครั้งค่ะ" | **Approved & Merged** |
| **Step 6** | `feat(sprint3/wi5): StaffTicketQueue component, search/filter toolbar, and tests` | [PR #54](https://github.com/thanapornboont-star/toktickit/pull/54) | "ตรวจ PR #54 เรียบร้อยครับ ตัว StaffTicketQueue ทำได้สมบูรณ์และครอบคลุมตาม AC-12/AC-22: มี toolbar ค้นหาด้วย ticketNumber/summary, filter แยกหมวดหมู่/สถานะ/ความสำคัญ, responsive layout สำหรับ desktop table และ mobile card list, และมี automated tests ผ่านครบทั้ง 11 ข้อ ไม่พบ regression กับเทสต์เดิมครับ Approved ครับ" | "ขอบคุณค่ะ" | **Approved & Merged** by @jiraphat-j |
| **Step 7** | `feat(sprint3/wi6): Staff ticket operations, comments, and internal notes` | [PR #55](https://github.com/thanapornboont-star/toktickit/pull/55) | "- Base branch เข้า `lab3-staging` ถูกต้อง<br>- โค้ดตรงตามข้อกำหนด Work Item 6 (AC-10, AC-13 ถึง AC-16, BR-12, BR-15, BR-18)<br>- Backend มี State Machine เช็คสถานะตั๋วอย่างเข้มงวด และบล็อก Requester จาก Internal Notes (403 Forbidden)<br>- Frontend นำ `StaffTicketDetail` มาแทน placeholder ใน `App.tsx` ครบถ้วน แยกโทนสี Amber สำหรับ Internal Notes ชัดเจน<br>- Test ผ่าน 100% ทั้ง Server (104 tests) และ Client (58 tests) เอกสารอัปเดตเรียบร้อย พร้อม merge ครับ" | "ขอบคุณมากค่า" | **Approved & Merged** by @jiraphat-j |

---

## 3. Detailed PR Review Logs (Reviews on My PRs)

### Issue #32 — Sprint 3 Engineering Contract and Specification
- **PR:** [PR #43](https://github.com/jiraphat-j/toktickit/pull/43)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"โดยรวม Engineering Specification, API Contract, UI Specification, RBAC, Status Transition Matrix และ Acceptance Criteria ครอบคลุม requirement ของ Lab 3 ได้ดีค่ะ และauthentication/session, requester isolation, Internal Notes protection และ admin safeguards ระบุไว้ชัดเจนและสอดคล้องกันทั้งหมดค่ะ"*
  - **Author Response:**
    > *"ขอบคุณมากครับ ตรวจสอบความถูกต้องและสอดคล้องกันของเอกสารสัญญาทั้ง 5 ไฟล์ ครอบคลุมทุก Acceptance Criteria เรียบร้อยแล้วครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `d8527fa` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `lab3/01-engineering-contract`

---

### Issue #33 — Test DD and Acceptance Traceability Plan
- **PR:** [PR #44](https://github.com/jiraphat-j/toktickit/pull/44)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"โดยรวม tests.md ทำได้ละเอียดดีครับ โดยเฉพาะ Test ID และ Traceability Matrix ที่ครอบคลุม AC-01 ถึง AC-22 ครบ และมีทั้ง API, Security/RBAC, UI, Regression และ E2E tests  
    > มี 2 จุดที่อยากให้แก้ก่อน Approve:  
    > 1. ใน docs/lab-03/reviewer.md ส่วน Detailed PR Review Logs ของ Issue #33 ยังใช้ [Link to PR on lab3-staging] อยู่ รบกวนเปลี่ยนเป็นลิงก์ PR #44 เพื่อให้ traceability ของ reviewer record ครบถ้วน  
    > 2. AC-04 ระบุว่าหลัง Logout ต้องป้องกัน browser back-navigation แต่ใน Test Plan ยังไม่มี test scenario ที่ระบุการกด Back โดยตรงครับ รบกวนเพิ่ม E2E test สำหรับ Logout → Browser Back → ต้องไม่สามารถกลับเข้า protected screen หรือเห็นข้อมูล session เดิมได้  
    >   
    > หลังแก้ 2 จุดนี้แล้วฝากส่งมาให้ re-review อีกครั้งครับ"*
  - **Author Action & Commit:**
    > Updated PR #44 link in `docs/lab-03/reviewer.md` and added automated test scenario `E2E-01b` in `docs/lab-03/tests.md` mapping browser back-navigation after logout to AC-04 in commit `ff014d8`.
  - **Author Response:**
    > *"แก้ไขตามคำแนะนำทั้ง 2 จุดเรียบร้อยแล้วครับ:  
    > 1. อัปเดตลิงก์ใน `docs/lab-03/reviewer.md` เป็น PR #44 ครบถ้วนแล้วครับ  
    > 2. เพิ่มเคสทดสอบ `E2E-01b` ใน `docs/lab-03/tests.md` สำหรับการทดสอบ Browser Back Navigation หลัง Logout (`page.goBack()`) ว่าระบบต้อง redirect กลับมาที่หน้า `/login` ทันที และไม่เปิดเผยข้อมูลจาก session เดิม พร้อมแมปลงใน Traceability Matrix (AC-04) เรียบร้อยแล้วครับ  
    >   
    > ขอบคุณสำหรับคำแนะนำมากๆ ครับ รบกวน Re-review อีกครั้งได้เลยครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `f6d9347` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `feature/33-test-plan`

---

### Issue #34 — Database Migration, User Model, and Seed Data
- **PR:** [PR #45](https://github.com/jiraphat-j/toktickit/pull/45)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"โดยรวม User Model, Role, migration, seed และ migration-seed tests วางโครงสร้างได้ดี โดยเฉพาะการใช้ bcrypt, idempotent upsert และการเพิ่ม Ticket/User relations"*
  - **Author Response:**
    > *"ขอบคุณมากครับ หากเรียบร้อยแล้วกด merge ได้เลยครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `8d5884a` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `feature/34-user-migration-seed`

---

### Issue #35 — Authentication, Password Lifecycle, and Session Management
- **PR:** [PR #46](https://github.com/jiraphat-j/toktickit/pull/46)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"Auth API, password lifecycle, session cookie และ test coverage ออกมาดีค่ะ แต่มี blocker ที่ควรแก้ก่อน Approve:*
    > *1. handleLoginSuccess() ตอนนี้ set แค่ currentUser แต่ render flow ยังเช็ก !currentRequester ก่อน currentUser ทำให้หลัง login สำเร็จมีโอกาสไม่เข้า authenticated shell และกลับไป Development Requester Selector แทน ซึ่งจุดนี้กระทบ AC-02/AC-05 โดยตรง*
    > *2. revalidateSession() ยังผูกกับ getStoredRequesterId() อยู่ ถ้าไม่มี stored requester ID function จะ return ก่อนเรียก /api/auth/me ทำให้ authenticated session ที่มีอยู่ไม่ถูก restore หลัง reload ได้ ควรให้ session cookie/server identity เป็น source of truth ตาม Lab 3 specification*
    > *3. PR นี้ยังมี fetchActiveDevRequesters(), currentRequester, RequesterSelector และ X-Dev-Requester-Id flow อยู่ ขณะที่ BR-24 ระบุว่า Development Requester selector และ header ต้องถูก retire และแทนด้วย authenticated session ครับ ถ้าตั้งใจคง compatibility ชั่วคราว รบกวนแยก/ระบุ scope ให้ชัดเจนด้วยนะคะ*
    > *4. Test AUTH-07 ระบุว่าจะตรวจ expired session แต่ implementation ตอนนี้ตรวจเพียง unauthenticated กับ valid session ยังไม่มี case ที่ session หมดอายุจริงค่ะ*
    > *รบกวนแก้ flow authentication/session ตรงนี้และเพิ่ม test ให้ครบและรีพลายว่าแก้แล้วนะคะ"*
  - **Author Action & Commit:**
    > 1. ปรับปรุง `client/src/App.tsx`: ให้ `currentUser` มีความสำคัญลำดับแรก (Priority 1) เข้าสู่ Authenticated App Shell ทันทีหลังล็อกอิน โดยไม่ติดเงื่อนไข `!currentRequester`
    > 2. ปรับปรุง `revalidateSession()` ใน `App.tsx`: ตรวจสอบ session cookie (`toktickit_auth=1` / `toktickit_session`) และเรียก `/api/auth/me` เป็น Single Source of Truth อย่างแท้จริง โดยไม่ผูกกับ `getStoredRequesterId()`
    > 3. แยก Scope ของ Development Requester Selector ใน `App.tsx` อย่างชัดเจน โดยระบุชัดเจนว่าเป็น `/* TEMPORARY LAB 2 BACKWARD COMPATIBILITY: Retained strictly for legacy Lab 2 test suite until Step 5 (Issue #36) completes retirement under BR-24 */` และให้หน้า Login (`<Login />`) เป็นหน้าเริ่มต้นหลักของผู้ใช้ที่ยังไม่ล็อกอิน 100%
    > 4. เพิ่มฟังก์ชัน `expireAllSessions()` และ `expireSession(token)` ใน `server/src/session.ts` และอัปเดตเทสต์ `AUTH-07` ใน `server/tests/lab-03/auth.api.test.ts` ให้ครอบคลุมทั้ง Absent Session, Valid Session และ Expired Session ที่ถูกปฏิเสธด้วย `401 Unauthorized` และตัด session ออกจาก store
    > 5. เพิ่มชุดทดสอบ `client/tests/lab-03/App.auth.test.tsx` (3/3 tests pass) ครอบคลุม Unauthenticated Login screen, Immediate Authenticated Shell transition, และ Mandatory Password Change screen
  - **Author Response:**
    > *"แก้ไขเรียบร้อยครบถ้วนทั้ง 4 จุดตามคำแนะนำของเพื่อนแล้วครับ:*
    > *1. ปรับปรุง Render flow ใน `App.tsx` ให้ `currentUser` อยู่ในลำดับความสำคัญสูงสุด โดยทันทีที่ `handleLoginSuccess()` ทำงาน จะเข้าสู่ Authenticated App Shell ทันที 100% ไม่ถูกดักด้วย `currentRequester` อีกต่อไป*
    > *2. ปรับ `revalidateSession()` ให้ใช้ Server Session Cookie เป็น Source of Truth เสมอ เมื่อเปิดหรือรีโหลดหน้าเว็บ จะเรียก `/api/auth/me` เพื่อ restore session โดยไม่ขึ้นกับ `getStoredRequesterId()`*
    > *3. แยก Scope ส่วน Legacy Dev Selector ออกอย่างชัดเจน โดยให้หน้า Login เป็นหน้าเริ่มต้นหลัก 100% และระบุอย่างโปร่งใสว่าเป็นบริดจ์ชั่วคราวสำหรับรองรับชุดทดสอบ Lab 2 ซึ่งจะถูกลบออกถาวรใน Step 5 (Issue #36) ตามกฎ BR-24*
    > *4. อัปเดตเทสต์ `AUTH-07` ให้ทดสอบกรณี Session หมดอายุจริง (Expired session) ส่ง cookie แล้วได้ `401 Unauthorized` และ session ถูกกวาดออกจาก memory store ครบถ้วน พร้อมเพิ่ม integration test `App.auth.test.tsx` อีก 3 ข้อ (รวมเทสต์ทั้งหมดผ่าน 104/104 ข้อ 100%)*
    > *รบกวนช่วย Re-review และ Approve ให้อีกครั้งนะครับ ขอบคุณมากๆ ครับ!"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `fc9dd583f663e5ddfe3779786242eb1faf86da82` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `feature/35-authentication-session`

---

### Issue #36 — RBAC Authorization Layer and Requester Regression
- **PR:** [PR #47](https://github.com/jiraphat-j/toktickit/pull/47)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Implementation Summary:**
    1. Built centralized RBAC middleware `requireRole` and hybrid `authenticateSessionOrDev` in `server/src/auth.ts`
    2. Enforced requester ownership isolation: cross-requester ticket access and attachments return `404 Not Found` (SEC-02, BR-09)
    3. Server ignores client-supplied `requesterId` in ticket creation and derives identity strictly from authenticated session (SEC-03, BR-24)
    4. Implemented Problem Appears Resolved toggle (`POST /api/tickets/:id/resolve-indication`, REQ-03, AC-08, BR-10) without altering `currentStatus`
    5. Blocked unauthorized requester access to internal notes (403 Forbidden, SEC-04) and staff status transitions (403 Forbidden, REQ-04)
    6. Updated client UI with Problem Appears Resolved toggle button, badge, and banner in `RequesterTicketDetail.tsx`
    7. Scoped legacy Dev Requester selector strictly for Lab 2 test backward compatibility while defaulting 100% to Login screen (BR-24)
    8. Added automated test suites: `server/tests/lab-03/authorization.api.test.ts` (17 tests) and `client/tests/lab-03/RequesterTicketDetail.resolved.test.tsx` (3 tests)
    9. Full regression: 72/72 server tests pass (100%), 52/52 client tests pass (100%)
  - **Reviewer Comment:**
    > *"BAC middleware, requester ownership isolation, forged requesterId protection และ Problem Appears Resolved test ทำได้ดีค่ะ"*
  - **Author Response:**
    > *"ขอบพระคุณครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `3a0e6c69545046b0072a9437523de2f984b7d39f` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `feature/36-authorization-requester`

---

### Issue #37 — IT Staff Ticket Queue and Advanced Filtering
- **PR:** [PR #48](https://github.com/jiraphat-j/toktickit/pull/48)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Implementation Summary:**
    1. Implemented backend query endpoint `GET /api/staff/tickets` in `server/src/app.ts` with RBAC guard (`requireAuth`, `requireRole("IT_STAFF", "ADMINISTRATOR")`).
    2. Implemented search (`ticketNumber`, `summary` case-insensitive), multi-filtering (`categoryId`, `currentStatus`, `itPriority`, `ownerId`: `unassigned`, `me`, or integer ID), sorting whitelist (`ticketNumber`, `createdAt`, `updatedAt`, `itPriority`), and pagination (`page`, `limit`/`pageSize`).
    3. Implemented query parameter validation rejecting invalid arguments with `400 Bad Request` and descriptive error `details`.
    4. Implemented staff directory endpoint `GET /api/staff/members` returning active staff and administrators for assignment dropdowns.
    5. Added client API methods `fetchStaffTickets` and `fetchStaffMembers` with TypeScript interfaces in `client/src/api.ts`.
    6. Developed responsive client component `StaffTicketQueue.tsx` with filter toolbar, desktop table ($\ge 768\text{px}$), mobile card list ($< 768\text{px}$, $\ge 44\text{px}$ touch targets), Zen Green badges, Problem Appears Resolved indicator, and empty/no-results states with Clear Filters reset.
    7. Mounted `StaffTicketQueue` inside `App.tsx` under `activeTab === "queue"`.
    8. Added automated test suites:
       - Server: `server/tests/lab-03/staff-queue.api.test.ts` (28 tests covering `STF-01..04`, RBAC, parameter validation, and staff members).
       - Client: `client/tests/lab-03/StaffTicketQueue.test.tsx` (9 tests covering `UI-03`, rendering, mobile cards, search, filters, sorting, empty states, and selection).
    9. Full regression: 100/100 server tests pass (100%), 61/61 client tests pass (100%).
  - **Reviewer Comment:**
    > *"ระบบ Staff Ticket Queue, Multi-filter, Sorting, Pagination และ Responsive UI ถูกต้องครบถ้วนตาม AC-12/AC-22 เทสต์ผ่าน 100%"*
  - **Author Response:**
    > *"ขอบคุณมากครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `d2f99b3` into `lab3-staging` by @thanapornboont-star
  - **Branch Closed:** `feature/37-staff-ticket-queue`

---

### Issue #38 — IT Staff Ticket Detail, Claiming, and Communication Workflow
- **PR:** [PR #49](https://github.com/jiraphat-j/toktickit/pull/49)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Implementation Summary:**
    1. Operational Bar: Claim ticket and reassign primary owner (`PATCH /api/staff/tickets/:id/owner`, AC-13, BR-11, STF-05).
    2. Operational IT Priority: Update `itPriority` independently of `requestedPriority` (`PATCH /api/staff/tickets/:id/priority`, AC-14, BR-13, STF-06).
    3. Status Workflow Transitions: Enforce strict Status Transition Matrix state machine (`PATCH /api/staff/tickets/:id/status`, AC-15, BR-15, STF-07, STF-08).
    4. Communication Threads:
       - Public Comments (`GET`/`POST /api/tickets/:id/comments`, AC-09, BR-16, BR-17, COM-01, COM-03) with Zen Green accent, 1–2000 chars validation.
       - Internal Notes (`GET`/`POST /api/tickets/:id/internal-notes`, AC-10, AC-11, BR-16, BR-17, BR-18, SEC-04, COM-02) with distinct Amber Warning accent, restricted strictly to Staff/Admin (403 for Requesters).
    5. Frontend:
       - Create `StaffTicketDetail.tsx` with operational controls, dual threads, attachment continuity, and responsive layout.
       - Update `RequesterTicketDetail.tsx` to support Public Comments (AC-09).
       - Mount `StaffTicketDetail` in `App.tsx` when selecting a ticket from the queue.
  - **Reviewer Comment:**
    > *"Staff Ticket Detail, Claim/Reassign, IT Priority และ Status Transition ทำได้ดีมากค่ะ ตอนนี้ยังไม่มีอะไรให้แก้ แต่ช่วยตรวจสอบเรื่อง Public Comments และ Internal Notes ใน StaffTicketDetail และมี backend authorization สำหรับ Internal Notes แล้ว แต่ staff-ticket-detail.api.test.ts ตอนนี้ยังเน้น owner, priority และ status workflow เป็นหลัก ยังไม่มี automated API test ที่ยืนยัน communication permission boundary โดยเฉพาะ Requester ต้องถูกปฏิเสธการอ่าน/สร้าง Internal Note ด้วย 403  
    >   
    > รบกวนเพิ่ม tests อย่างน้อยตามนี้ได้ไหมคะ:  
    > - Requester สามารถสร้าง Public Comment ได้  
    > - Staff/Admin สามารถอ่าน/สร้าง Public Comment ได้  
    > - Requester ไม่สามารถอ่าน/สร้าง Internal Note (403)  
    > - Staff/Admin สามารถสร้าง Internal Note ได้"*
  - **Author Action & Commit:**
    > เพิ่มชุดทดสอบใน `server/tests/lab-03/staff-ticket-detail.api.test.ts` ส่วน `Ticket Communication & Authorization Boundaries (COM-01..02, AC-09..11, BR-16..18, SEC-04)` ครบทั้ง 5 เคส:
    > 1. Requester สามารถสร้าง Public Comment บนตั๋วตนเองได้ (`POST /api/tickets/:id/comments` ➔ 201)
    > 2. Staff และ Admin สามารถอ่านและสร้าง Public Comment ได้ (`GET` ➔ 200, `POST` ➔ 201)
    > 3. Requester ถูกปฏิเสธการอ่าน Internal Notes ด้วย `403 Forbidden` (`GET /api/tickets/:id/internal-notes` ➔ 403)
    > 4. Requester ถูกปฏิเสธการสร้าง Internal Notes ด้วย `403 Forbidden` (`POST /api/tickets/:id/internal-notes` ➔ 403)
    > 5. Staff และ Admin สามารถอ่านและสร้าง Internal Notes ได้ (`GET` ➔ 200, `POST` ➔ 201)
    > รันเทสต์ผ่านครบทั้งหมด 34/34 tests ใน suite นี้ (และรวมทั้งระบบ 151 server tests)
  - **Author Response:**
    > *"เพิ่ม Automated API Tests ใน `server/tests/lab-03/staff-ticket-detail.api.test.ts` ครอบคลุม Communication Permission Boundary ครบถ้วนทั้ง 4 ประเด็นตามที่เพื่อนแนะนำเรียบร้อยแล้วครับ:
    > - ยืนยันสิทธิ์ Requester สร้าง Public Comment ได้ และ Staff/Admin อ่าน/สร้าง Public Comment ได้
    > - ยืนยันการบล็อก Requester ไม่ให้อ่านหรือสร้าง Internal Note ด้วย 403 Forbidden (SEC-04, AC-11, BR-18)
    > - ยืนยัน Staff และ Admin สามารถอ่านและเขียน Internal Note ได้อย่างถูกต้องตาม BR-16
    > เทสต์ทั้งหมดใน suite ผ่านครบ 34/34 tests (รวมทั้งระบบ 151 server tests) ไม่มี regression ครับ รบกวน re-review อีกครั้งได้เลยครับ ขอบคุณมากครับ"*
  - **Review Decision:** Changes Addressed (Awaiting Re-review)
  - **Merge Action:** Pending



---

## 4. Detailed Review Logs Given to Partner (@thanapornboont-star)

### Partner PR #50 — Sprint 3 Contract, Specifications, and Test Blueprint
- **PR:** [PR #50](https://github.com/thanapornboont-star/toktickit/pull/50)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR #50 เรียบร้อยครับ เป็นการวางโครง Contract และ Test Blueprint ของ Lab 3 ที่ละเอียดและครอบคลุมมาก ทั้งการแยก Scope 3 บทบาท, Business Rules และ State Machine ของตั๋ว รวมถึง Schema และ Test Matrix ที่เตรียมไว้"*
  - **Partner Response:**
    > *"ขอบคุณค่ะ"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging`

---

### Partner PR #51 — Migrate Identity to User Model and Seed Lab 3 Roles and Data
- **PR:** [PR #51](https://github.com/thanapornboont-star/toktickit/pull/51)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR #51 เรียบร้อยครับ ตัว migration ทำได้ยอดเยี่ยมมาก มีการย้ายข้อมูลจาก DevRequester เข้า User table โดยคง id เดิมและ sync sequence ให้ครบถ้วน ทำให้ข้อมูลเดิมไม่สูญหายและไม่เกิด regression กับเทสต์เดิมของ Lab 1-2 เลยครับ ตัว seed ก็ครอบคลุมทั้ง 3 role และรันซ้ำได้ปลอดภัย"*
  - **Partner Response:**
    > *"ขอบคุณค่ะ"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging`

---

### Partner PR #52 — Sprint 3 Authentication and Account Entry
- **PR:** [PR #52](https://github.com/thanapornboont-star/toktickit/pull/52)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR #52 เรียบร้อยครับ ระบบ Authentication และ First Password Change ทำได้รัดกุมมาก:  
    > - มีการใช้ bcrypt และ session token ใน DB พร้อม expiration check  
    > - การล็อกอินตอบ error แบบ generic (401) ป้องกัน user enumeration และแยกเคสบัญชีถูกปิดใช้งาน (403) ถูกต้องตาม BR-01, BR-02  
    > - หน้า ChangePassword มี interactive checklist ตรวจสอบกฎรหัสผ่านแบบเรียลไทม์ และระบบใน App.tsx ดักไม่ให้เข้าหน้าอื่นก่อนเปลี่ยนรหัสผ่านได้สมบูรณ์  
    > - เทสต์ทั้งฝั่ง Server และ Client ผ่านครบ 100% โดยไม่กระทบโค้ดเดิม"*
  - **Partner Response:**
    > *"ขอบคุณมากค่ะ โชคดีจังไม่ต้องแก้"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging`

---

### Partner PR #53 — Sprint 3 RBAC Enforcement, Requester Continuity, Public Comments, and Indicate-Resolved
- **PR:** [PR #53](https://github.com/thanapornboont-star/toktickit/pull/53)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR #53 เรียบร้อยครับ การวาง Authorization Boundary และการเชื่อมต่อ Requester Continuity ทำได้สมบูรณ์มาก:  
    > - การบังคับตัวตนผ่าน Bearer token และการตัดสิทธิ์ field ที่ client พยายาม spoof (requesterId, ownerId, status) เป็นไปตาม BR-07 และ BR-10 ครบถ้วน  
    > - การตอบกลับด้วย 404 Not Found เมื่อ Requester เข้าถึงตั๋วคนอื่น ช่วยป้องกัน information disclosure ได้ถูกต้องตาม BR-09  
    > - ฟังก์ชัน Public Comments และ Problem Appears Resolved ทำงานได้ตาม AC-08, AC-09  
    > - Middleware authenticateSessionOrDev ช่วยให้โค้ดของเดิมใน Lab 2 ยังทำงานได้ครบถ้วนโดยไม่เกิด regression  
    > - เทสต์ทั้ง Server (53/53) และ Client (39/39) ผ่านครบ 100% เอกสาร tests.md และ reviewer.md อัปเดตเรียบร้อยครับ Approved ครับ"*
  - **Partner Response:**
    > *"ขอบคุณอีกครั้งค่ะ"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging` (Merged commit on 2026-09-12)

---

### Partner PR #54 — Sprint 3 Staff Ticket Queue, Multi-Filter, and Pagination
- **PR:** [PR #54](https://github.com/thanapornboont-star/toktickit/pull/54)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Feature Branch:** `sprint3/staff-queue`
- **Target Branch:** `lab3-staging`
- **Linked Issue:** Closes #44
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR #54 เรียบร้อยครับ ตัว StaffTicketQueue ทำได้สมบูรณ์และครอบคลุมตาม AC-12/AC-22:  
    > - มี multi-field toolbar สำหรับ search (ticketNumber/summary) และกรอง category, status, IT priority, assignment ได้อย่างถูกต้อง  
    > - ออกแบบ responsive layout รองรับทั้ง desktop table และ mobile card list (touch target >= 44px)  
    > - ระบบ pagination และ sortable columns ทำงานได้ลื่นไหล  
    > - Unit/Component tests (`StaffTicketQueue.test.tsx`) ผ่านครบ 11 ข้อ และเทสต์รวมทั้ง Client (50/50) และ Server (71/71) ผ่าน 100% ไม่มี regression ครับ Approved ครับ"*
  - **Partner Response:**
    > *"ขอบคุณค่ะ"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging` (Merged commit on 2026-09-13)

---

### Partner PR #55 — Sprint 3 Staff Ticket Operations, Comments, and Internal Notes
- **PR:** [PR #55](https://github.com/thanapornboont-star/toktickit/pull/55)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Feature Branch:** `sprint3/staff-ticket-operations`
- **Target Branch:** `lab3-staging`
- **Linked Issue:** Closes #45
- **Review Activity:**
  - **My Review Comment:**
    > *- Base branch เข้า `lab3-staging` ถูกต้อง  
    > - โค้ดตรงตามข้อกำหนด Work Item 6 (AC-10, AC-13 ถึง AC-16, BR-12, BR-15, BR-18)  
    > - Backend มี State Machine เช็คสถานะตั๋วอย่างเข้มงวด และบล็อก Requester จาก Internal Notes (403 Forbidden)  
    > - Frontend นำ `StaffTicketDetail` มาแทน placeholder ใน `App.tsx` ครบถ้วน แยกโทนสี Amber สำหรับ Internal Notes ชัดเจน  
    > - Test ผ่าน 100% ทั้ง Server (104 tests) และ Client (58 tests) เอกสารอัปเดตเรียบร้อย  
    > พร้อม merge ครับ*
  - **Partner Response:**
    > *"ขอบคุณมากค่า"*
  - **Review Decision:** Approved by @jiraphat-j
  - **Merge Status:** Merged into partner `lab3-staging` (Merged commit on 2026-09-13)


