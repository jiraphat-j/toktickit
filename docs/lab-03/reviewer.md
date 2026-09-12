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
| **PR #45 (Issue #34)** | `feat: User data model, requester migration, and seed data` | [#45](https://github.com/jiraphat-j/toktickit/pull/45) | "โดยรวม User Model, Role, migration, seed และ migration-seed tests วางโครงสร้างได้ดี โดยเฉพาะการใช้ bcrypt, idempotent upsert และการเพิ่ม Ticket/User relations" | "ขอบคุณมากครับ หากเรียบร้อยแล้วกด merge ได้เลยครับ" | **Approved & Merged** by @thanapornboont-star |
| **PR (Issue #35)** | `feat: Authentication, password lifecycle, and session management` | [Link to PR on lab3-staging] | Pending Peer Review | - | Under Development |
| **PR (Issue #36)** | `feat: RBAC and authenticated Requester regression` | [PR Link] | - | - | Planned |
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
- **PR:** [Link to PR on lab3-staging]
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *[Pending Peer Review Comment]*
  - **Author Response:**
    > *[Pending Author Response]*
  - **Review Decision:** Pending Review
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
