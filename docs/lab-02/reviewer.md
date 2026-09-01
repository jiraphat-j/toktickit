# Lab 2 Peer Review Record

**Repository:** [https://github.com/jiraphat-j/toktickit](https://github.com/jiraphat-j/toktickit)  
**Author:** Jiraphat (@[jiraphat-j](https://github.com/jiraphat-j))  
**Peer Reviewer (Partner):** Thanaporn (@[thanapornboont-star](https://github.com/thanapornboont-star))  

---

## 1. Peer Review Summary Table (Reviews on My PRs)

| Issue / PR | Title / Feature | PR Link | Reviewer Comments | Author Responses / Action | Status |
|:---:|---|:---:|---|---|:---:|
| **PR #21 (Issue #12)** | `docs: Lab 2 engineering contract and test plan` | [#21](https://github.com/jiraphat-j/toktickit/pull/21) | "จากที่ดูค่อนข้างครบถ้วนค่ะ" | ตรวจสอบความถูกต้องของ contract ทั้ง 4 ไฟล์ | **Approved & Merged** by @thanapornboont-star |
| **PR #22 (Issue #13)** | `feat: Development Requester schema, seed, and context API` | [#22](https://github.com/jiraphat-j/toktickit/pull/22) | "ตรวจแล้วค่ะ โครงสร้าง schema, migration, seed และ API โดยรวมครบถ้วน และ seed ใช้ upsert ทำให้รันซ้ำได้โดยไม่เกิดข้อมูลซ้ำ LGTM" | "ค้าบขอบคุณครับ" ยืนยันผลการทดสอบ API-01, API-02, API-03 | **Approved & Merged** by @thanapornboont-star |
| **PR #23 (Issue #14)** | `feat: Ticket schema, ticket number, and Create Ticket API` | [#23](https://github.com/jiraphat-j/toktickit/pull/23) | "ตรวจแล้วค่ะ โดยรวม schema, validation, ticket number, requester binding และ idempotency ทำได้ครบ แนะนำเพิ่ม test กรณี concurrent requests ที่ใช้ Idempotency-Key เดียวกัน เพื่อยืนยันว่าไม่เกิด ticket ซ้ำค่า" | เพิ่ม test กรณี concurrent identical idempotency key ใน commit `10da627` และป้องกัน race condition | **Approved & Merged** by @thanapornboont-star |
| **PR #24 (Issue #15)** | `feat: Attachment upload, download, and soft removal API` | [#24](https://github.com/jiraphat-j/toktickit/pull/24) | "โดยรวม Attachment model, upload/download, soft removal, file size/type validation, จำกัด 5 active attachments และ ownership isolation ทำได้ครบค่ะ" | "ขอบคุณครับ" ยืนยันผลการทดสอบ API-11 ถึง API-15 ผ่านครบ 100% | **Approved & Merged** by @thanapornboont-star |
| **PR #25 (Issue #16)** | `feat: Zen Green shell and Development Requester selector UI` | [#25](https://github.com/jiraphat-j/toktickit/pull/25) | "โดยรวม PR นี้ทำ Selector, sessionStorage revalidation, error/retry state และ Zen Green shell ได้ดี ตรง scope หลัก รบกวนแก้ 1. เพิ่ม responsive CSS สำหรับ header/nav/requester profile บน mobile/tablet 2. เพิ่ม :focus-visible สำหรับ nav และปุ่มทุกประเภท พร้อมเพิ่ม keyboard/focus test 3. อัปเดต docs/lab-02/tests.md ให้ UI-01/UI-02 ชี้ไปที่ RequesterSelector.test.tsx และเปลี่ยนสถานะเป็น Pass พร้อมผลรันทดสอบจริง" | ปรับ Responsive Media Queries (AC-28), เพิ่ม `:focus-visible` และ Keyboard Navigation Test (AC-30), และอัปเดต `tests.md` ใน commit `e1dffaa` | **Approved & Merged** by @thanapornboont-star |
| **PR #6 (Issue #17)** | `feat: Create Ticket UI and validation` | [PR Link] | - | - | Planned |
| **PR #7 (Issue #18)** | `feat: My Tickets API and UI` | [PR Link] | - | - | Planned |
| **PR #8 (Issue #19)** | `feat: Ticket Detail and Attachment UI` | [PR Link] | - | - | Planned |
| **PR #9 (Issue #20)** | `test: E2E, visual QA, documentation, and release readiness` | [PR Link] | - | - | Planned |
| **Release PR** | `release: merge lab2-staging to main` | [PR Link] | - | - | Planned |

---

## 2. Peer Review Given to Partner (@thanapornboont-star)

| Partner PR | Title / Feature | Partner PR Link | My Comments Given | Partner Response & Fixes | Status |
|:---:|---|:---:|---|---|:---:|
| **PR #21 (Issue #11)** | `feat: define Lab 2 engineering contract and test plan` | [Partner PR #21](https://github.com/thanapornboont-star/toktickit/pull/21) | "ดีแล้วครับแต่อย่าลืมในส่วนของ ai_use.md, reviewer.md ด้วยนะครับ ถ้าเสร็จแล้วบอกครับ เดี๋ยวผมจะทำการ approveและ merge ให้" | เพิ่มไฟล์ `docs/lab-02/ai-use.md` และ `docs/lab-02/reviewer.md` ใน commit `3a6bc93` | **Approved & Merged** by @jiraphat-j |
| **PR #27 (Issue #13)** | `feat: implement Ticket schema, atomic ticket number, and Create Ticket API` | [Partner PR #27](https://github.com/thanapornboont-star/toktickit/pull/27) | "ตรวจ final code แล้วครับ เหลือจุดเดียวที่อยากให้เช็ก: requestedPriority ใน schema มี default เป็น MEDIUM แต่ API ตอนนี้บังคับให้ client ต้องส่งค่า ถ้า requirement ต้องการใช้ default ควรปรับ validation ให้ไม่บังคับ field นี้ครับ นอกนั้นโดยรวมโอเคครับ" | ปรับ validation ให้ `requestedPriority` เป็น optional โดย default เป็น `MEDIUM` ใน commit `841f25b` | **Approved & Merged** by @jiraphat-j |
| **PR #28 (Issue #14)** | `feat: implement attachment upload, download, and soft removal API` | [Partner PR #28](https://github.com/thanapornboont-star/toktickit/pull/28) | "ตรวจโค้ด Attachment APIs และ Test suite โดยรวมทำได้ดีและถูกต้องตาม spec มากครับ: Storage & Validation: มีการจัดเก็บไฟล์ด้วย UUID (Opaque filename) ในโฟลเดอร์ uploads และจำกัดขนาดไม่เกิน 5 MB (413) รวมถึงกรองประเภทไฟล์ (415) ได้ถูกต้อง Soft-removal & Slot Freeing: การทำ soft-removal มีการเก็บเหตุผล (reason), timestamp และปลดล็อคโควตา active attachment (AC-15) พร้อมทั้ง block การ download ด้วย 404 ได้ถูกต้องตาม BR-22 Ownership Isolation: มีการตรวจ ownership อย่างรัดกุม คืนค่า 404 สำหรับ unowned ticket/attachment" | "ขอบคุณค่า" | **Approved & Merged** by @jiraphat-j |
| **PR #29 (Issue #15)** | `feat: implement Zen Green shell and Development Requester selector UI` | [Partner PR #29](https://github.com/thanapornboont-star/toktickit/pull/29) | "ตรวจเช็ค PR #29 เรียบร้อยแล้วครับ ภาพรวมการทำงานของฟีเจอร์ Requester Selector และ App Shell ทำงานได้ถูกต้อง ครอบคลุมทั้ง Loading state, Error + Retry, Session persistence และ Revalidation ตามเงื่อนไขของ Lab 2 แล้วครับ" | "ขอบคุณค่ะ" | **Approved & Merged** by @jiraphat-j |

---

## 3. Detailed PR Review Logs

### Issue #12 — Lab 2 Engineering Contract and Test Plan
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/21](https://github.com/jiraphat-j/toktickit/pull/21)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:** *"จากที่ดูค่อนข้างครบถ้วนค่ะ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `4cfc3b9` by @thanapornboont-star
  - **Branch Deleted:** `feature/12-lab2-contract`

---

### Issue #13 — Development Requester Schema, Seed, and Context API
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/22](https://github.com/jiraphat-j/toktickit/pull/22)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:** *"ตรวจแล้วค่ะ โครงสร้าง schema, migration, seed และ API โดยรวมครบถ้วน และ seed ใช้ upsert ทำให้รันซ้ำได้โดยไม่เกิดข้อมูลซ้ำ LGTM"*
  - **Reviewer Follow-up:** *"ขออนุญาต approve ให้เลยนะคะ"*
  - **Author Reply:** *"ค้าบขอบคุณครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `e085863` into `lab2-staging` by @thanapornboont-star
  - **Branch Deleted:** `feature/13-dev-requester-context`

---

### Issue #14 — Ticket Schema, Ticket Number, and Create Ticket API
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/23](https://github.com/jiraphat-j/toktickit/pull/23)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:** *"ตรวจแล้วค่ะ โดยรวม schema, validation, ticket number, requester binding และ idempotency ทำได้ครบ แนะนำเพิ่ม test กรณี concurrent requests ที่ใช้ Idempotency-Key เดียวกัน เพื่อยืนยันว่าไม่เกิด ticket ซ้ำค่า"*
  - **Author Action & Commit:** Added concurrent identical idempotency test and graceful race-condition handling in commit [`10da627`](https://github.com/jiraphat-j/toktickit/commit/10da627)
  - **Author Reply:** *"เพิ่ม test สำหรับกรณี concurrent requests ที่ใช้ Idempotency-Key เดียวกันพร้อมกันเรียบร้อยแล้วใน commit 10da627 และเพิ่ม error handling ป้องกัน race condition เพื่อยืนยันว่าจะได้ Ticket เดิมและไม่เกิด ticket ซ้ำอย่างแน่นอนครับ ขอบคุณสำหรับคำแนะนำครับ รบกวนตรวจทานและ Approve / Merge ได้เลยครับ"*
  - **Review Decision:** Approved by @thanapornboont-star (*"Approve แล้วคับ"*)
  - **Merge Action:** Merged commit `10da627` into `lab2-staging` by @thanapornboont-star
  - **Branch Deleted:** `feature/14-create-ticket-api`

---

### Issue #15 — Attachment Upload, Download, and Soft Removal API
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/24](https://github.com/jiraphat-j/toktickit/pull/24)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:** *"โดยรวม Attachment model, upload/download, soft removal, file size/type validation, จำกัด 5 active attachments และ ownership isolation ทำได้ครบค่ะ"*
  - **Author Reply:** *"ขอบคุณครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `4e03915` into `lab2-staging` by @thanapornboont-star
  - **Branch Deleted:** `feature/15-attachments-api`

---

### Issue #16 — Zen Green Shell and Development Requester Selector UI
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/25](https://github.com/jiraphat-j/toktickit/pull/25)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"โดยรวม PR นี้ทำ Selector, sessionStorage revalidation, error/retry state และ Zen Green shell ได้ดี ตรง scope หลัก  
    > รบกวนแก้ 1. เพิ่ม responsive CSS สำหรับ header/nav/requester profile บน mobile/tablet เพราะตอนนี้ยังไม่มี media query และเสี่ยงเกิด horizontal overflow ซึ่งขัดกับ AC-28  
    > 2. เพิ่ม :focus-visible สำหรับ nav และปุ่มทุกประเภท พร้อมเพิ่ม keyboard/focus test เพื่อให้ครอบคลุม AC-30  
    > 3. อัปเดต docs/lab-02/tests.md ให้ UI-01/UI-02 ชี้ไปที่ RequesterSelector.test.tsx และเปลี่ยนสถานะเป็น Pass พร้อมผลรันทดสอบจริงได้ไหมคะ"*
  - **Author Action & Commit:** Added responsive media queries (AC-28), `:focus-visible` styles, automated keyboard navigation and focus test (AC-30), and updated `tests.md` with UI-01 and UI-02 Pass status in commit [`e1dffaa`](https://github.com/jiraphat-j/toktickit/commit/e1dffaa)
  - **Author Reply:**
    > *"แก้ไขตามคำแนะนำเรียบร้อยแล้วใน commit e1dffaa ครับ:  
    > 1. **Responsive CSS (AC-28):** เพิ่ม media query สำหรับ tablet (<= 768px) และ mobile (<= 480px) ให้ header/nav/profile stack เป็นแนวตั้งอย่างเป็นระเบียบ ไม่เกิด horizontal scrollbar  
    > 2. **Accessibility & Keyboard Test (AC-30):** เพิ่ม `:focus-visible` สำหรับ buttons, nav items และ form controls พร้อมทั้งเพิ่ม automated test ใน `RequesterSelector.test.tsx` ทดสอบ keyboard tab navigation, focus outline และการ submit ด้วยปุ่ม Enter  
    > 3. **Update tests.md:** อัปเดตไฟล์ `docs/lab-02/tests.md` ให้ UI-01 และ UI-02 มีสถานะเป็น **Pass** และบันทึกผลการรันจริง (8/8 tests ผ่านครบ 100%) เรียบร้อยแล้วครับ  
    >   
    > ขอบคุณสำหรับคำแนะนำมากๆ ครับ รบกวนตรวจทานและ Approve / Merge ได้เลยครับ"*
  - **Review Decision:** Approved by @thanapornboont-star (*"Approve เรียบร้อยค่ะ"*)
  - **Merge Action:** Merged commit `374873c` into `lab2-staging` by @thanapornboont-star
  - **Author Follow-up:** *"ขอบคุณครับ"*
  - **Branch Status:** Merged into `lab2-staging`

---

### Partner Review: Issue #11 — Lab 2 Engineering Contract and Test Plan (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/21](https://github.com/thanapornboont-star/toktickit/pull/21)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Comment:** *"ดีแล้วครับแต่อย่าลืมในส่วนของ ai_use.md, reviewer.md ด้วยนะครับ ถ้าเสร็จแล้วบอกครับ เดี๋ยวผมจะทำการ approveและ merge ให้"*
  - **Partner Reply:** *"โอเคค่ะ ขอบคุณมากสำหรับคำแนะนำค่ะ"*
  - **Partner Fix:** Added `docs/lab-02/ai-use.md` and `docs/lab-02/reviewer.md` in commit `3a6bc93`
  - **Partner Follow-up:** *"เพิ่มไฟล์ docs/lab-02/ai-use.md และ docs/lab-02/reviewer.md ใน commit ล่าสุดเรียบร้อยแล้ว รบกวนตรวจทานและ Approve / Merge ได้เลยค่ะ"*
  - **My Reply & Approval:** *"ได้ครับ"* ➔ Approved with comment *"เรียบร้อยแล้วครับ"*
  - **Merge Action:** Merged commit `07d1568` into `lab2-staging` by @jiraphat-j

---

### Partner Review: Issue #13 — Ticket Schema, Ticket Number, and Create Ticket API (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/27](https://github.com/thanapornboont-star/toktickit/pull/27)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Comment:** *"ตรวจ final code แล้วครับ เหลือจุดเดียวที่อยากให้เช็ก: requestedPriority ใน schema มี default เป็น MEDIUM แต่ API ตอนนี้บังคับให้ client ต้องส่งค่า ถ้า requirement ต้องการใช้ default ควรปรับ validation ให้ไม่บังคับ field นี้ครับ นอกนั้นโดยรวมโอเคครับ"*
  - **Partner Reply:** *"ขอเวลาในการตรวจสอบสักครู่นะคับ"*
  - **Partner Fix:** Modified validation in `tickets.ts` and added automated test in commit `841f25b`
  - **Partner Follow-up:** *"แก้ไข validation ใน server/src/routes/tickets.ts ให้ requestedPriority เป็น optional โดยมีค่าเริ่มต้น (default) เป็น MEDIUM ตาม schema และเพิ่ม automated test รองรับเรียบร้อยแล้วใน commit ล่าสุด ขอบคุณสำหรับคำแนะนำคับ"*
  - **My Approval:** Approved by @jiraphat-j (*"เรียบร้อยแล้วครับ"*)
  - **Merge Action:** Merged by @jiraphat-j into partner `lab2-staging`

---

### Partner Review: Issue #14 — Attachment Upload, Download, and Soft Removal API (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/28](https://github.com/thanapornboont-star/toktickit/pull/28)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Comment:** *"ตรวจโค้ด Attachment APIs และ Test suite โดยรวมทำได้ดีและถูกต้องตาม spec มากครับ: Storage & Validation: มีการจัดเก็บไฟล์ด้วย UUID (Opaque filename) ในโฟลเดอร์ uploads และจำกัดขนาดไม่เกิน 5 MB (413) รวมถึงกรองประเภทไฟล์ (415) ได้ถูกต้อง Soft-removal & Slot Freeing: การทำ soft-removal มีการเก็บเหตุผล (reason), timestamp และปลดล็อคโควตา active attachment (AC-15) พร้อมทั้ง block การ download ด้วย 404 ได้ถูกต้องตาม BR-22 Ownership Isolation: มีการตรวจ ownership อย่างรัดกุม คืนค่า 404 สำหรับ unowned ticket/attachment"*
  - **Partner Reply:** *"ขอบคุณค่า"*
  - **My Approval:** Approved by @jiraphat-j
  - **Merge Action:** Merged commit `a876d76` into partner `lab2-staging` by @jiraphat-j

---

### Partner Review: Issue #15 — Zen Green Shell and Development Requester Selector UI (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/29](https://github.com/thanapornboont-star/toktickit/pull/29)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Comment & Approval:** *"ตรวจเช็ค PR #29 เรียบร้อยแล้วครับ ภาพรวมการทำงานของฟีเจอร์ Requester Selector และ App Shell ทำงานได้ถูกต้อง ครอบคลุมทั้ง Loading state, Error + Retry, Session persistence และ Revalidation ตามเงื่อนไขของ Lab 2 แล้วครับ"*
  - **Partner Reply:** *"ขอบคุณค่ะ"*
  - **Merge Action:** Merged commit `cd8d12c` into partner `lab2-staging` by @jiraphat-j
