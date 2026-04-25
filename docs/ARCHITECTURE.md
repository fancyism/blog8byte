# Blog8byte: Project Context & Architecture Summary

เอกสารนี้สรุปสิ่งที่พูดคุยและตัดสินใจกันมาทั้งหมดตั้งแต่เริ่มต้น จนถึงสถาปัตยกรรมระดับ Production-Ready และแนวทางการออกแบบ UI เพื่อกันลืมครับ

---

## 1. 🎯 เป้าหมายหลัก (Core Objective)
ยกระดับโปรเจกต์ `Blog8byte` จากเว็บธรรมดาให้เป็น **"สถาปัตยกรรมระดับ Production-Ready"** (เทียบเท่าโค้ดที่เขียนโดย Staff Engineer) โดยเน้นความปลอดภัย โค้ดที่สะอาด และการออกแบบระบบที่สเกลได้ง่าย

---

## 2. 🛡️ โครงสร้างพื้นฐานและความปลอดภัย (Infrastructure & Quality Gates)

### 2.1 Security Headers (Shift-Left Security)
- **ทำอะไร:** เพิ่ม Security Headers (HSTS, X-Content-Type-Options, X-Frame-Options) ลงใน `next.config.js` โดยตรง
- **ทำทำไม:** ป้องกันการโจมตีพื้นฐาน (เช่น Clickjacking, MIME Sniffing) ที่ระดับ Infrastructure โดยไม่ต้องเปลืองทรัพยากรตอนรันแอป

### 2.2 Automated Quality Gates
- **เครื่องมือ:** ใช้ `Husky` + `lint-staged`
- **ระบบทำงาน:** ทุกครั้งที่กด `git commit` ระบบจะทำการตรวจสอบ (Linting) และจัดฟอร์แมตโค้ด (Formatting) ให้อัตโนมัติ ถ้าโค้ดพังหรือผิดกฎ จะไม่ยอมให้ Commit เด็ดขาด
- **ผลลัพธ์:** ประวัติ Git จะสะอาดตามาก และมั่นใจได้ว่าโค้ดที่เข้า Repository ได้มาตรฐาน 100%

### 2.3 Agentic Intelligence (Vercel Next Skills)
- **ทำอะไร:** ติดตั้ง `vercel-labs/next-skills` (ผ่าน `npx @vercel/next-skills@latest`) ไว้ที่ระดับ Workspace 
- **ทำทำไม:** เพื่อให้ AI agents (รวมถึงผม) รู้กฎและ Best Practices ล่าสุดของ Next.js 15 เวลามีโปรเจกต์ใหม่ๆ ในโฟลเดอร์นี้ ก็จะได้อานิสงส์ไปด้วย

---

## 3. 🏗️ สถาปัตยกรรมโค้ดและ Patterns (Architecture & Patterns)

### 3.1 Runtime Validation ด้วย Zod
- **เปลี่ยนจาก Type-Safety เป็น Runtime Safety:** ไม่ใช่แค่เช็คตอนเขียนโค้ด แต่ใช้ Zod ตรวจสอบข้อมูล "ตอนรันจริง" 
- **จุดที่ใช้:**
  1. **Environment Variables:** แจ้งเตือนทันทีถ้าลืมใส่ค่า ENV สำคัญๆ
  2. **API Boundaries:** ตรวจสอบข้อมูล (Payload) ที่ส่งเข้ามาใน API ทุกเส้น ถ้าข้อมูลขยะส่งเข้ามา จะถูกเตะออกทันทีก่อนไปถึง Database

### 3.2 HOF (Higher-Order Function) Error Handler
- **ปัญหา:** การเขียน `try-catch` ซ้ำๆ ทุกๆ API Route ทำให้โค้ดรกและผิดหลัก DRY (Don't Repeat Yourself)
- **ทางแก้:** สร้าง HOF wrapper ตัวอย่างเช่น `withErrorHandler` เพื่อรวบรวมการจัดการ Error (เช่น ส่ง Error 500 หรือ 400 กลับไป) ไว้ที่จุดเดียว
- **กฎเหล็กการใช้ JSDoc:** 
  - ทีมระดับท็อปจะไม่เขียน JSDoc พร่ำเพรื่อ
  - เราจะเขียน JSDoc เฉพาะฟังก์ชันส่วนกลางที่ต้องแชร์ให้คนอื่นใช้ (เช่น ไฟล์ใน `src/lib/` หรือ HOF wrapper) เท่านั้น เพื่อลดภาระและให้โค้ดสะอาดที่สุด

---

## 4. 🎨 Design System: "Earth Tone + Editorial"

หลังจากประเมินแนวคิดจาก `awesome-design-md` และดีไซน์สไตล์ **Pirate Wires** เราได้ข้อสรุปว่าเราจะเอาโครงสร้างของเขามาปรับแต่งให้มีเอกลักษณ์ของเราเอง ไม่ก๊อปปี้ 100%

### 4.1 Concept (แนวคิด)
- **Neo-Brutalist / Editorial Minimalist:** ดิบ เท่ อ่านง่าย ฟีลลิ่งเหมือนอ่านนิตยสารกระดาษพรีเมียม
- **Earth Tone Palette:** ไม่ใช้ขาว-ดำแบบแข็งกระด้าง แต่จะใช้สีออร์แกนิก:
  - **พื้นหลัง:** สีครีมกระดาษถนอมสายตา (`#FDFBF7`)
  - **ตัวหนังสือหลัก:** สีถ่านเข้ม Charcoal (`#27272A`)
  - **สีตกแต่ง (Accents):** สีเขียวตุ่น Sage Green (`#849C8A`) และสีส้มดินเผา Terracotta (`#C87965`)

### 4.2 Component Specs (สเปคหน้า UI หลัก)
- **โครงสร้างของ Blog List:** ไม่ตีเป็นกรอบกล่องหนาๆ แต่จะใช้เส้นคั่นบางๆ (Thin dividers)
- **Metadata:** จัดเรียงชื่อผู้เขียน (Author), 👁️ ยอดวิว, และ 💬 คอมเมนต์ เป็นตัวอักษรเล็กๆ สีเทาดูสะอาดตา
- **ลูกเล่น Hover Effect:** วันที่ตีพิมพ์จะถูก **ซ่อนไว้** (Opacity 0) และจะค่อยๆ Fade โผล่ขึ้นมาอย่างนุ่มนวล เมื่อผู้ใช้นำเมาส์ไปชี้ (Hover) ที่แถวของบทความนั้นๆ เพื่อลดความรกของหน้าจอ

---
*อัปเดตล่าสุด: พร้อมสำหรับการนำ Design System นี้ไปเขียนเป็นโค้ดในหน้า `src/app/page.tsx`*
