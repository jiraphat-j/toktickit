# Lab 3 Peer Review Record

**Repository:** [https://github.com/jiraphat-j/toktickit](https://github.com/jiraphat-j/toktickit)  
**Author:** Jiraphat (@[jiraphat-j](https://github.com/jiraphat-j))  
**Peer Reviewer (Partner):** Thanaporn (@[thanapornboont-star](https://github.com/thanapornboont-star))  

---

## 1. Peer Review Summary Table (Reviews on My PRs)

| Issue / PR | Title / Feature | PR Link | Reviewer Comments | Author Responses / Action | Status |
|:---:|---|:---:|---|---|:---:|
| **PR #43 (Issue #32)** | `docs: Sprint 3 engineering contract and specification` | [#43](https://github.com/jiraphat-j/toktickit/pull/43) | "โดยรวม Engineering Specification, API Contract, UI Specification, RBAC, Status Transition Matrix และ Acceptance Criteria ครอบคลุม requirement ของ Lab 3 ได้ดีค่ะ และauthentication/session, requester isolation, Internal Notes protection และ admin safeguards ระบุไว้ชัดเจนและสอดคล้องกันทั้งหมดค่ะ" | ตรวจสอบความถูกต้องและสอดคล้องกันของเอกสารสัญญาทั้ง 5 ไฟล์ ครอบคลุมทุก Acceptance Criteria และเริ่มงาน Test DD ใน Issue #33 | **Approved & Merged** by @thanapornboont-star |
| **PR #44 (Issue #33)** | `docs: Test DD and acceptance traceability plan` | [#44](https://github.com/jiraphat-j/toktickit/pull/44) | "โดยรวม tests.md ทำได้ละเอียดดีครับ... มี 2 จุดที่อยากให้แก้ก่อน Approve: 1. ใน docs/lab-03/reviewer.md ส่วน Detailed PR Review Logs ของ Issue #33 รบกวนเปลี่ยนเป็นลิงก์ PR #44 2. AC-04 ระบุว่าหลัง Logout ต้องป้องกัน browser back-navigation รบกวนเพิ่ม E2E test สำหรับ Logout → Browser Back" | แก้ไขเรียบร้อยทั้ง 2 จุด: 1. อัปเดตลิงก์ PR #44 ใน docs/lab-03/reviewer.md 2. เพิ่ม E2E test scenario (E2E-01b) ใน tests.md ตรวจสอบ Logout ➔ Browser Back Navigation ว่าถูก redirect ไปที่ /login และบล็อกการดูข้อมูล session เดิม | **Approved & Merged** by @thanapornboont-star |
| **PR #45 (Issue #34)** | `feat: Database migration, User model, and seed data` | [#45](https://github.com/jiraphat-j/toktickit/pull/45) | "โดยรวม User Model, Role, migration, seed และ migration-seed tests วางโครงสร้างได้ดี โดยเฉพาะการใช้ bcrypt, idempotent upsert และการเพิ่ม Ticket/User relations" | ตรวจสอบความถูกต้องและรัน test migration-seed ผ่าน 100% เรียบร้อยครับ | **Approved & Merged** by @thanapornboont-star (Merge commit `8d5884a`) |
| **PR #46 (Issue #35)** | `feat: Authentication, password lifecycle, and session management` | [#46](https://github.com/jiraphat-j/toktickit/pull/46) | "Auth API, password lifecycle, session cookie และ test coverage ออกมาดีค่ะ แต่มี blocker ที่ควรแก้ก่อน Approve: 1. handleLoginSuccess() ตอนนี้ set แค่ currentUser แต่ render flow ยังเช็ก !currentRequester ก่อน currentUser 2. revalidateSession() ยังผูกกับ getStoredRequesterId() 3. PR นี้ยังมี flow ของ Dev Selector ค้างอยู่ตาม BR-24 ถ้าตั้งใจคง compatibility ชั่วคราวให้ระบุ scope ให้ชัดเจน 4. Test AUTH-07 ยังไม่มี case session หมดอายุจริง" | แก้ไขเรียบร้อยครบทั้ง 4 จุด: 1. ปรับ render flow ให้ currentUser มี priority สูงสุดเข้า authenticated shell ทันที 2. ให้ session cookie/server identity เป็น source of truth ในการ revalidate เสมอ 3. แยก scope ของ legacy dev selector ไว้อย่างชัดเจนพร้อมระบุว่าจะ retire ถาวรใน Step 5 (Issue #36) 4. เพิ่ม helper expireAllSessions() และ test case สำหรับ expired session ใน AUTH-07 พร้อมเพิ่ม component test App.auth.test.tsx | **Approved & Merged** by @thanapornboont-star (Merge commit `fc9dd58`) |
| **PR (Issue #36)** | `feat: RBAC and authenticated Requester regression` | [PR Link] | - | - | Ready for PR |
| **PR (Issue #37)** | `feat: IT Staff Ticket Queue and filtering` | [PR Link] | - | - | Planned |
| **PR (Issue #38)** | `feat: IT Staff Ticket Detail, claiming, and communication workflow` | [PR Link] | - | - | Planned |
| **PR (Issue #39)** | `feat: Administrator User Management and safeguards` | [PR Link] | - | - | Planned |
| **PR (Issue #40)** | `test: Cross-feature UI shell, visual QA, and screenshots` | [PR Link] | - | - | Planned |
| **PR (Issue #41)** | `test: E2E scenarios and complete regression suite` | [PR Link] | - | - | Planned |
| **PR (Issue #42)** | `docs: Lab 3 documentation completion and submission evidence` | [PR Link] | - | - | Planned |
| **Release PR** | `release: merge lab3-staging to main` | [PR Link] | - | - | Planned |

---

## 2. Peer Review Given to Partner (@thanapornboont-star)

| Partner PR | Title / Feature | Partner PR Link | My Comments Given | Partner Response & Fixes | Status |
|:---:|---|:---:|---|---|:---:|
| **PR #50 (Step 1)** | `docs: establish Sprint 3 contract, specifications, and test blueprint…` | [#50](https://github.com/thanapornboont-star/toktickit/pull/50) | "ตรวจ PR #50 เรียบร้อยครับ เป็นการวางโครง Contract และ Test Blueprint ของ Lab 3 ที่ละเอียดและครอบคลุมมาก ทั้งการแยก Scope 3 บทบาท, Business Rules และ State Machine ของตั๋ว รวมถึง Schema และ Test Matrix ที่เตรียมไว้" | "ขอบคุณค่ะ" | **Approved & Merged** |
| **PR #51 (Step 3)** | `feat: migrate identity to User model and seed Lab 3 roles and data` | [#51](https://github.com/thanapornboont-star/toktickit/pull/51) | "ตรวจ PR #51 เรียบร้อยครับ ตัว migration ทำได้ยอดเยี่ยมมาก มีการย้ายข้อมูลจาก DevRequester เข้า User table โดยคง id เดิมและ sync sequence ให้ครบถ้วน ทำให้ข้อมูลเดิมไม่สูญหายและไม่เกิด regression กับเทสต์เดิมของ Lab 1-2 เลยครับ ตัว seed ก็ครอบคลุมทั้ง 3 role และรันซ้ำได้ปลอดภัย" | "ขอบคุณค่ะ" | **Approved & Merged** |
| **PR #52 (Step 4)** | `Sprint3/auth account entry` | [#52](https://github.com/thanapornboont-star/toktickit/pull/52) | "ตรวจ PR #52 เรียบร้อยครับ ระบบ Authentication และ First Password Change ทำได้รัดกุมมาก: มีการใช้ bcrypt และ session token ใน DB พร้อม expiration check, การล็อกอินตอบ error แบบ generic (401) ป้องกัน user enumeration และแยกเคสบัญชีถูกปิดใช้งาน (403) ถูกต้องตาม BR-01, BR-02, หน้า ChangePassword มี interactive checklist ตรวจสอบกฎรหัสผ่านแบบเรียลไทม์ และระบบใน App.tsx ดักไม่ให้เข้าหน้าอื่นก่อนเปลี่ยนรหัสผ่านได้สมบูรณ์, เทสต์ทั้งฝั่ง Server และ Client ผ่านครบ 100% โดยไม่กระทบโค้ดเดิม" | "ขอบคุณมากค่ะ โชคดีจังไม่ต้องแก้" | **Approved & Merged** |
| **PR #53 (Step 5)** | `feat(sprint3/wi4): RBAC enforcement, requester continuity, public comments, indicate-resolved` | [#53](https://github.com/thanapornboont-star/toktickit/pull/53) | "ตรวจ PR #53 เรียบร้อยครับ การวาง Authorization Boundary และการเชื่อมต่อ Requester Continuity ทำได้สมบูรณ์มาก: การบังคับตัวตนผ่าน Bearer token และการตัดสิทธิ์ field ที่ client พยายาม spoof (requesterId, ownerId, status) เป็นไปตาม BR-07 และ BR-10 ครบถ้วน, การตอบกลับด้วย 404 Not Found เมื่อ Requester เข้าถึงตั๋วคนอื่น ช่วยป้องกัน information disclosure ได้ถูกต้องตาม BR-09, ฟังก์ชัน Public Comments และ Problem Appears Resolved ทำงานได้ตาม AC-08, AC-09, Middleware authenticateSessionOrDev ช่วยให้โค้ดของเดิมใน Lab 2 ยังทำงานได้ครบถ้วนโดยไม่เกิด regression, เทสต์ทั้ง Server (53/53) และ Client (39/39) ผ่านครบ 100% เอกสาร tests.md และ reviewer.md อัปเดตเรียบร้อยครับ Approved ครับ" | "ขอบคุณอีกครั้งค่ะ" | **Approved & Merged** |
| **PR #54 (Step 6)** | `feat(sprint3/wi5): StaffTicketQueue component, search/filter toolbar, and tests` | [#54](https://github.com/thanapornboont-star/toktickit/pull/54) | "ตรวจ PR #54 เรียบร้อยครับ ตัว StaffTicketQueue ทำได้สมบูรณ์และครบถ้วนตาม AC-12/AC-22: มี toolbar ค้นหาด้วย ticketNumber/summary, filter แยกหมวดหมู่/สถานะ/ความสำคัญ, responsive layout สำหรับ desktop table และ mobile card list, และมี automated tests ผ่านครบทั้ง 11 ข้อ ไม่พบ regression กับเทสต์เดิมครับ Approved ครับ" | "ขอบคุณค่ะ" | **Approved & Merged** by @jiraphat-j |

---

## 3. Detailed PR Review Logs (Reviews on My PRs)

### Issue #32 — Sprint 3 Engineering Contract and Specification
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/43](https://github.com/jiraphat-j/toktickit/pull/43)
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
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/44](https://github.com/jiraphat-j/toktickit/pull/44)
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
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/45](https://github.com/jiraphat-j/toktickit/pull/45)
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
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/46](https://github.com/jiraphat-j/toktickit/pull/46)
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
- **PR:** [Link to PR on lab3-staging]
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
    > *Pending peer review from @thanapornboont-star*
  - **Author Response:**
    > *Pending peer review*
  - **Review Decision:** In Progress / Pending PR Review
  - **Merge Action:** Pending merge


---

## 4. Detailed Review Logs Given to Partner (@thanapornboont-star)

### Partner PR #50 — Sprint 3 Contract, Specifications, and Test Blueprint
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/50](https://github.com/thanapornboont-star/toktickit/pull/50)
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
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/51](https://github.com/thanapornboont-star/toktickit/pull/51)
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
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/52](https://github.com/thanapornboont-star/toktickit/pull/52)
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
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/53](https://github.com/thanapornboont-star/toktickit/pull/53)
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
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/54](https://github.com/thanapornboont-star/toktickit/pull/54)
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


