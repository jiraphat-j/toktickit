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
| **PR #3 (Issue #NN)** | `feat: Ticket schema, ticket number, and Create Ticket API` | [PR Link] | - | - | Planned |
| **PR #4 (Issue #NN)** | `feat: Attachment upload, download, and soft removal API` | [PR Link] | - | - | Planned |
| **PR #5 (Issue #NN)** | `feat: Zen Green shell and Development Requester selector UI` | [PR Link] | - | - | Planned |
| **PR #6 (Issue #NN)** | `feat: Create Ticket UI and validation` | [PR Link] | - | - | Planned |
| **PR #7 (Issue #NN)** | `feat: My Tickets API and UI` | [PR Link] | - | - | Planned |
| **PR #8 (Issue #NN)** | `feat: Ticket Detail and Attachment UI` | [PR Link] | - | - | Planned |
| **PR #9 (Issue #NN)** | `test: E2E, visual QA, documentation, and release readiness` | [PR Link] | - | - | Planned |
| **Release PR** | `release: merge lab2-staging to main` | [PR Link] | - | - | Planned |

---

## 2. Peer Review Given to Partner (@thanapornboont-star)

| Partner PR | Title / Feature | Partner PR Link | My Comments Given | Partner Response & Fixes | Status |
|:---:|---|:---:|---|---|:---:|
| **PR #21 (Issue #11)** | `feat: define Lab 2 engineering contract and test plan` | [Partner PR #21](https://github.com/thanapornboont-star/toktickit/pull/21) | "ดีแล้วครับแต่อย่าลืมในส่วนของ ai_use.md, reviewer.md ด้วยนะครับ ถ้าเสร็จแล้วบอกครับ เดี๋ยวผมจะทำการ approveและ merge ให้" | เพิ่มไฟล์ `docs/lab-02/ai-use.md` และ `docs/lab-02/reviewer.md` ใน commit `3a6bc93` | **Approved & Merged** by @jiraphat-j |

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
