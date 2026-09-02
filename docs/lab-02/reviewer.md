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
| **PR #26 (Issue #17)** | `feat: Create Ticket UI and validation` | [#26](https://github.com/jiraphat-j/toktickit/pull/26) | "ตรวจ PR แล้วครับ โดยรวม Create Ticket UI, form validation, loading/busy state และ error handling ทำได้ครบและสอดคล้องกับ spec ค่ะ มีการเชื่อมต่อ API และส่ง requester/idempotency headers ได้ถูกต้อง รวมถึงรองรับ attachment validation ด้วยค่ะ" | ยืนยันการเชื่อมต่อ API, error handling และ attachment validation | **Approved & Merged** by @thanapornboont-star |
| **PR #27 (Issue #18)** | `feat: My Tickets API and UI` | [#27](https://github.com/jiraphat-j/toktickit/pull/27) | "ตรวจ PR แล้วครับ โดยรวม My Tickets API, search, filtering, pagination, ownership isolation และ responsive UI ทำได้ดีค่ะ แต่ช่วยตรวจใน MyTickets.tsx ตอนนี้ UI มี sorting สำหรับ Ticket Number และ Created Date แต่ยังไม่มี Last Updated ทั้งที่ API/spec รองรับการ sort ด้วย updatedAt ด้วยรบกวนเพิ่ม column/header หรือ UI action สำหรับ sorting by Last Updated ให้ครบตาม requirement และTest coverage ยังไม่ครอบคลุม currentStatus filter และ updatedAt sorting..." | เพิ่มคอลัมน์/sorting สำหรับ `updatedAt` ใน UI และเพิ่ม automated tests สำหรับ `currentStatus` filter และ `updatedAt` sorting ใน commit `4c0bcb9` | **Approved & Merged** by @thanapornboont-star |
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
| **PR #30 (Issue #16)** | `feat: implement Create Ticket UI, form validation, and attachment upload` | [Partner PR #30](https://github.com/thanapornboont-star/toktickit/pull/30) | "ตรวจเช็ค PR #30 เรียบร้อยครับ... มีเพียงข้อปรับปรุงเล็กน้อยเกี่ยวกับ CSS และเอกสารที่อยากรบกวนให้ช่วย Commit เพิ่มเติม... CSS Classes ที่ขาดหายใน App.css (.zen-card, .zen-field-readonly, .text-primary-green, ...)" | เพิ่ม CSS Classes ที่เกี่ยวข้องทั้งหมดใน `client/src/App.css` ใน commit `3616863` | **Approved & Merged** by @jiraphat-j |
| **PR #31 (Issue #17)** | `feat: implement My Tickets API, query controls, sorting, pagination, and UI` | [Partner PR #31](https://github.com/thanapornboont-star/toktickit/pull/31) | "ตรวจ PR ให้แล้วนะ โค้ดส่วนใหญ่ทำมาโอเคเลย ทั้ง backend API ที่ทำพวก search, filter, pagination แล้วก็หน้า UI MyTickets... มีจุดตกหล่นเรื่องเอกสารกับสไตล์นิดหน่อย: 1. ใน tests.md เทสต์ API-06 กับ API-07 ยังเป็น Planned 2. ใน reviewer.md ช่อง status PR #31 ยังเว้นว่าง 3. ใน MyTickets.tsx ปุ่ม View ใช้ btn-outline-primary แนะนำเปลี่ยนเป็นโทน Zen Green" | แก้ไขสถานะเทสต์ใน `tests.md` และปรับสีปุ่มใน `MyTickets.tsx` ใน commit `4113623` | **Approved & Merged** by @jiraphat-j |

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

### Issue #17 — Create Ticket UI and validation
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/26](https://github.com/jiraphat-j/toktickit/pull/26)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:** *"ตรวจ PR แล้วครับ โดยรวม Create Ticket UI, form validation, loading/busy state และ error handling ทำได้ครบและสอดคล้องกับ spec ค่ะ มีการเชื่อมต่อ API และส่ง requester/idempotency headers ได้ถูกต้อง รวมถึงรองรับ attachment validation ด้วยค่ะ"*
  - **Author Reply:**
    > *"> ตรวจ PR แล้วครับ โดยรวม Create Ticket UI, form validation, loading/busy state และ error handling ทำได้ครบและสอดคล้องกับ spec ค่ะ มีการเชื่อมต่อ API และส่ง requester/idempotency headers ได้ถูกต้อง รวมถึงรองรับ attachment validation ด้วยค่ะ  
    >   
    > ขอบคุณครับ"*
  - **Review Decision:** Approved by @thanapornboont-star
  - **Merge Action:** Merged commit `0fa4b7c` into `lab2-staging` by @thanapornboont-star
  - **Branch Deleted:** `feature/17-create-ticket-ui`

---

### Issue #18 — My Tickets API and UI
- **PR:** [https://github.com/jiraphat-j/toktickit/pull/27](https://github.com/jiraphat-j/toktickit/pull/27)
- **Author:** @jiraphat-j
- **Reviewer:** @thanapornboont-star
- **Review Activity:**
  - **Reviewer Comment:**
    > *"ตรวจ PR แล้วครับ โดยรวม My Tickets API, search, filtering, pagination, ownership isolation และ responsive UI ทำได้ดีค่ะ แต่ช่วยตรวจใน MyTickets.tsx ตอนนี้ UI มี sorting สำหรับ Ticket Number และ Created Date แต่ยังไม่มี Last Updated ทั้งที่ API/spec รองรับการ sort ด้วย updatedAt ด้วยรบกวนเพิ่ม column/header หรือ UI action สำหรับ sorting by Last Updated ให้ครบตาม requirement และTest coverage ยังไม่ครอบคลุม currentStatus filter และ updatedAt sorting โดย API-07/UI-06 ตอนนี้ทดสอบ search, category/priority, ticketNumber sorting และ pagination เป็นหลัก รบกวนเพิ่ม automated tests ให้ครอบคลุมสองกรณีนี้ และอัปเดต tests.md ให้ด้วยค่ะ"*
  - **Author Action & Commit:** Added `Last Updated` sortable column and mobile card field, extended test coverage for `currentStatus` filter and `updatedAt` sorting (API-07 and UI-06), and updated `tests.md` with new test run logs in commit [`4c0bcb9`](https://github.com/jiraphat-j/toktickit/commit/4c0bcb9)
  - **Author Reply:**
    > *"แก้ไขตามคำแนะนำเรียบร้อยแล้วใน commit 4c0bcb9 ครับ:  
    > 1. **Last Updated Sorting & Column (UI-06, AC-26):**  
    >    - เพิ่มคอลัมน์ `Last Updated` ใน `MyTickets.tsx` บน Table Layout ให้สามารถคลิก Sort สลับ `ASC` / `DESC` ตาม `updatedAt` ได้อย่างสมบูรณ์  
    >    - เพิ่มการแสดงผล `Updated: {date}` ใน Mobile Card Layout สำหรับหน้าจอขนาดเล็ก  
    > 2. **Automated Test Coverage (API-07, UI-06):**  
    >    - เพิ่ม Server tests ใน `my-tickets.api.test.ts` ครอบคลุมการกรอง `currentStatus=NEW` (AC-17) และการจัดเรียง `updatedAt` ทั้ง `ASC` และ `DESC` (AC-26) (ผ่านครบ 14/14 tests, รวม server ทั้งหมด 37/37 tests)  
    >    - เพิ่ม Client tests ใน `MyTickets.test.tsx` ครอบคลุมการเลือก filter Status และการคลิก toggle sort header ของ `Last Updated` (ผ่านครบ 8/8 tests, รวม client ทั้งหมด 29/29 tests)  
    > 3. **Update tests.md:**  
    >    - อัปเดตไฟล์ `docs/lab-02/tests.md` บันทึกผลการรันจริงล่าสุดเรียบร้อยครับ  
    >   
    > ขอบคุณสำหรับคำแนะนำมากๆ ครับ รบกวนตรวจทานและ Approve / Merge ได้เลยครับ"*
  - **Review Decision:** Approved by @thanapornboont-star (*"Approve จากการแก้ไขเรียบร้อยแล้วค่ะ"*)
  - **Merge Action:** Merged commit `ef77f6c` into `lab2-staging` by @thanapornboont-star
  - **Branch Deleted:** `feature/18-my-tickets`

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

---

### Partner Review: Issue #16 — Create Ticket UI, form validation, and attachment upload (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/30](https://github.com/thanapornboont-star/toktickit/pull/30)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจเช็ค PR #30 เรียบร้อยครับ  
    > รอบนี้โค้ดจัด Format ได้สะอาดมาก การทำ Form Validation, Real-time Character Counter, การเก็บค่าฟอร์มเดิมไว้เวลามี Error, และ Busy State ทำออกมาได้สมบูรณ์และถูกต้องตาม Spec ทุกจุดเลยครับ  
    > มีเพียงข้อปรับปรุงเล็กน้อยเกี่ยวกับ CSS และเอกสารที่อยากรบกวนให้ช่วย Commit เพิ่มเติมก่อน Approve & Merge ครับ:  
    > 1. CSS Classes ที่ขาดหายใน `client/src/App.css`  
    >    - ใน `CreateTicket.tsx` มีการเรียกใช้ `.zen-card`, `.zen-field-readonly`, `.text-primary-green`, `.success-header`, `.success-icon` แต่ใน `App.css` ยังไม่มีการประกาศคลาสเหล่านี้ ทำให้กล่องการ์ดและสีพื้นหลังของช่อง Read-only  อาจยังไม่แสดงผลครับ"*
  - **Partner Response:** *"รับทราบเดี๋ยวรีบแก้ไขให้ค่ะ"*
  - **Partner Fix Commit:** Committed `3616863` (`fix: add missing Zen Green CSS utility classes and update reviewer record (#16)`)
  - **Partner Follow-up Reply:** *"เพิ่ม CSS Classes ที่เกี่ยวข้องทั้งหมด (.zen-card, .zen-field-readonly, .text-primary-green, .success-header, .success-icon, .success-card, .ticket-confirmation-details) ใน client/src/App.css เรียบร้อยแล้วใน commit ล่าสุด ขอบคุณมากค่ะ"*
  - **My Approval:** Approved by @jiraphat-j
  - **Merge Action:** Merged commit `3616863` into partner `lab2-staging` by @jiraphat-j

---

### Partner Review: Issue #17 — My Tickets API, query controls, sorting, pagination, and UI (Partner Repo)
- **PR:** [https://github.com/thanapornboont-star/toktickit/pull/31](https://github.com/thanapornboont-star/toktickit/pull/31)
- **Author:** @thanapornboont-star
- **Reviewer:** @jiraphat-j
- **Review Activity:**
  - **My Review Comment:**
    > *"ตรวจ PR ให้แล้วนะ โค้ดส่วนใหญ่ทำมาโอเคเลย ทั้ง backend API ที่ทำพวก search, filter, pagination แล้วก็หน้า UI MyTickets ทำงานได้ครบตามสเปก เทสต์ที่เขียนก็ครอบคลุมดี  
    >   
    > มีจุดตกหล่นเรื่องเอกสารกับสไตล์นิดหน่อย อยากให้ช่วยแก้ก่อน merge:  
    > 1. ใน `docs/lab-02/tests.md` เห็นมีเทสต์ API-06 กับ API-07 ที่รันผ่านใน `my-tickets.api.test.ts` แล้ว แต่ในตารางสถานะยังเป็น `Planned` อยู่ รบกวนแก้เป็น `Pass` ให้หน่อย เดี๋ยวคะแนน traceability จะหาย  
    > 2. ใน `docs/lab-02/reviewer.md` ตรงตารางแถว PR #31 ช่อง status ยังเว้นว่างอยู่ ฝากเติมเป็น `Pending review` ด้วย  
    > 3. ใน `MyTickets.tsx` ปุ่ม View ตอนนี้ใช้ `btn-outline-primary` มันจะขึ้นเป็นสีฟ้าของ bootstrap แนะนำเปลี่ยนเป็น `btn-outline-success` หรือ `btn-outline-secondary` จะได้เข้ากับโทนสีเขียว Zen Green  
    >   
    > ถ้าแก้ commit แล้วบอกนะ เดี๋ยวเข้ามา approve และกด merge เข้า lab2-staging ให้"*
  - **Partner Response:** *"จะรีบแก้ไขค่ะ"*
  - **Partner Fix Commit:** Committed `4113623` updating `tests.md`, `reviewer.md`, and button style to Zen Green
  - **Partner Follow-up Reply:** *"แก้ไขเรียบร้อยแล้วค่ะ"*
  - **My Follow-up & Approval:**
    > *"ตรวจ commit ล่าสุดแล้ว แก้ไขเรื่องสถานะเทสต์ใน tests.md และปรับสีปุ่มใน MyTickets.tsx ครบถ้วนแล้วครับ โค้ดโดยรวมและการทำงานถูกต้องตาม spec ทั้งหมด เดี๋ยวทำการ merge เข้าให้ครับ"*  
    ➔ Approved by @jiraphat-j
  - **Merge Action:** Merged commit `3ed1737` into partner `lab2-staging` by @jiraphat-j


