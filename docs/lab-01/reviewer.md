# Lab 1 — Peer Review Record

**Author:** นายจิรภัทร เจริญพิพัฒธาดา — 67070507217 — GitHub: @jiraphat-j  
**Peer reviewer:** นางสาวธนภรณ์ บุณฑริกมาศ — 67070507204 — GitHub: @thanapornboont-star  

---

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|----|--------|------------------|
| [#5](https://github.com/jiraphat-j/toktickit/pull/5) | feature/1-project-foundation | Approved |
| [#6](https://github.com/jiraphat-j/toktickit/pull/6) | feature/2-health-check | Approved |
| [#7](https://github.com/jiraphat-j/toktickit/pull/7) | feature/3-category-seed | Approved |
|    | feature/4-category-list |  |

### Reviewer comments & responses (PR I authored)

#### PR #5 (`feature/1-project-foundation`)
* **Reviewer comment I received:**  
  "README.md ครบถ้วนและเป็นมืออาชีพ — มีการระบุ Tech Stack, Prerequisites, ขั้นตอนการตั้งค่า .env, การรัน Migration/Seed และคำสั่งรัน Dev Server / Tests ไว้อย่างชัดเจน มีการอธิบายโครงสร้างโฟลเดอร์ (Repository Structure) ช่วยให้คนในทีมและอาจารย์ตรวจงานได้ง่าย เอกสาร Lab (docs/lab-01/) มีโครงสร้างชัดเจน ai_use.md บันทึก Prompt และ Reflection ได้ตรงตามเงื่อนไขของรายวิชา มีการระบุขอบเขตการทำงานของ AI อย่างเหมาะสม reviewer.md ลงข้อมูล Author และ Peer Reviewer ครบถ้วน tests.md มีการระบุสถานะของ Test แต่ละข้อชัดเจน"
* **How I responded:**  
  "ขอบคุณครับ ผมจะทำการรีวิวอีกรอบแล้วค่อย merge เข้าครับ"

#### PR #6 (`feature/2-health-check`)
* **Reviewer comment I received:**  
  "ดีหมดคับ (กดให้แล้วคับ)"
* **How I responded:**  
  "ขอบคุณครับ! ให้ผม merge เลยไหม"

#### PR #7 (`feature/3-category-seed`)
* **Reviewer comment I received:**  
  "โดยรวมโครงสร้างของ Category model, migration และ seed ตรงตาม requirement ของ Issue 3คับ ดีมากคับ"
* **How I responded:**  
  "ขอบคุณครับ"

---

## Pull Requests I reviewed for my partner
| PR | Branch | My verdict |
|----|--------|------------|
| [#5](https://github.com/thanapornboont-star/toktickit/pull/5) | feature/1-project-foundation | Approved |
| [#6](https://github.com/thanapornboont-star/toktickit/pull/6) | feature/2-health-check | Approved |
| [#7](https://github.com/thanapornboont-star/toktickit/pull/7) | feature/3-category-seed | Approved |

### My comments & partner's responses (PR I reviewed)

#### PR #5 (`feature/1-project-foundation`)
* **My comment:**  
  "เช็คตาม acceptance criteria ครบแล้วครับ"
* **Partner's response:**  
  "ขอบคุณจ้า"

#### PR #6 (`feature/2-health-check`)
* **My comment:**  
  "เช็คตาม acceptance criteria ของ Issue 2 ส่วนใหญ่ครบแล้วครับ 👍 (health endpoint คืนค่าถูกต้อง, checkSystem() เรียก API จริง, มี Supertest ผ่าน) 2 จุดที่อยากให้พิจารณาก่อน merge: 1. checkSystem() ใน api.ts ยังไม่ครอบ fetch() ด้วย try/catch — ถ้า backendปิดสนิท (connection refused) จะโยน error ดิบของ browser แทนข้อความที่อ่านง่าย ลองเพิ่ม try/catch แล้ว throw ข้อความที่กำหนดไว้แทนได้ไหม? 2. tests.md บอกว่า UI-02/UI-03 (Online/Offline display) ยัง Pending สำหรับ Issue 4 — อยากเช็คว่านี่ตั้งใจ defer จริง เพราะ App.tsx ดูเหมือนมีโค้ดแสดงผล success/error state พร้อมอยู่แล้ว นอกนั้นโอเคหมดครับ ai_use.md กับ reviewer.md ทำได้ดีมาก"  
  *(หลังเพื่อนแก้ไข)*: "เรียบร้อยดีแล้วครับ ไปกันต่อออ!"
* **Partner's response:**  
  "ขอบคุณคับ เดี๋ยวแก้ไขคับ"  
  *(หลังแก้ไขเสร็จ)*: "แก้ไขเรียบร้อยแล้วคับ ช่วยตรวจให้อีกทีแล้วapprove ให้หน่อยคับ"

#### PR #7 (`feature/3-category-seed`)
* **My comment:**  
  "เช็คตาม acceptance criteria ของ Issue 3 ครบแล้วครับ Category model, migration, และ seed script (upsert) ถูกต้องตรงสเปคทั้งหมดผ่านครับ เยี่ยมครับ สวยครับ"
* **Partner's response:**  
  "เริ่ดคับ"