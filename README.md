# DXF Sheet Nesting Calculator

โปรแกรมนี้เป็นเว็บแอปแบบไฟล์เดียวสำหรับช่วยประเมินจำนวนแผ่นที่ต้องใช้จากไฟล์ `.dxf` หลายไฟล์

## Version 3

- Project Manager สำหรับ Local/Online พร้อมค้นหา Load, Soft Delete และ Restore
- Project ID และ revision ป้องกันชื่อซ้ำและลดการเขียนทับจากหลายอุปกรณ์
- Online save บีบอัด GZIP ก่อนส่งไป Apps Script และเก็บประวัติเวอร์ชันในชีต `Versions`
- Nesting แสดง progress, ยกเลิกได้ และตรวจ overlap/ขอบแผ่นก่อนเปิด Export
- รองรับ Kerf, ทิศทางลาย และล็อกการหมุนรายชิ้น
- PDF รองรับภาษาไทย พร้อมข้อมูลลูกค้า กำหนดส่ง ผู้รับผิดชอบ หมายเหตุ และ BOM
- ติดตั้งเป็น PWA บนมือถือและเปิด app shell แบบออฟไลน์ได้

## วิธีใช้

1. เปิดไฟล์ `index.html` ด้วย Chrome, Edge หรือ Firefox (`nicenesting.html` จะส่งต่อมาหน้านี้)
2. กดเลือกไฟล์ DXF ได้หลายไฟล์พร้อมกัน
3. ใส่ขนาดแผ่น เช่น `1220 x 2440`
4. ตั้งระยะห่างชิ้นงานและขอบแผ่น
5. ปรับจำนวนของแต่ละไฟล์
6. เลือกวิธีจัดวาง เช่น ชิ้นใหญ่ก่อน หรือสุ่มหลายรอบ
7. กด `คำนวณ Nesting`
8. ดูจำนวนแผ่น, preview แต่ละแผ่น, และ export CSV, DXF หรือ PDF ได้

ก่อนคำนวณสามารถระบุวัสดุและความหนาได้ ข้อมูลนี้จะถูกบันทึกไปกับงาน Local/Online และแสดงใน PDF สำหรับสั่งผลิต

หมายเหตุ: ถ้าชื่อไฟล์มีจำนวน เช่น `__2`, `_2pcs`, หรือ `-2pcs` โปรแกรมจะตั้งจำนวนเริ่มต้นให้ตามชื่อไฟล์อัตโนมัติ

## Export

- Export CSV: รายการตำแหน่งชิ้นงาน
- Export DXF: ส่งออก geometry เดิมของชิ้นงานที่อ่านได้ เช่น กรอบ, รูวงกลม, เส้นด้านใน และ polyline ภายใน
- Export DXF เลือกได้ว่าจะรวมทุกแผ่นในไฟล์เดียว หรือแยกไฟล์ตามแผ่น
- Export PDF: รายงานสรุปสำหรับพิมพ์สั่งงาน พร้อมหน้า layout ของแต่ละแผ่น
- Export PDF แสดงวัสดุและความหนาทั้งหน้าสรุปและหน้า layout ทุกแผ่น

## บันทึกงานใน Browser Storage

ใช้ได้ทันทีโดยไม่ต้องตั้งค่า Google หรืออัปโหลดขึ้น server

- `Save Local`: บันทึกงานปัจจุบันไว้ใน IndexedDB ของ browser
- `Load Local`: เลือกงานเก่าที่บันทึกไว้ แล้วโหลดกลับมาคำนวณต่อ
- `Delete Local`: ลบงานที่บันทึกไว้

ข้อมูลที่เก็บประกอบด้วย settings, รายการไฟล์, จำนวนชิ้น, DXF ต้นฉบับ และผลคำนวณที่เปิดกลับมาได้

ข้อควรระวัง: ข้อมูลอยู่ใน browser/เครื่องนั้น ๆ หากล้าง browser data หรือเปลี่ยนเครื่อง งานจะไม่ตามไปด้วย

## Nesting

- มีโหมดสุ่มหลายรอบสำหรับหา layout ที่แน่นขึ้น โดยปรับจำนวนรอบได้จากช่อง `จำนวนรอบสุ่ม`
- โปรแกรมจะลองหลายลำดับอัตโนมัติแล้วเลือกผลที่ดีที่สุด
- Preview จะหมุนชื่อชิ้นงานเป็นแนวตั้งเมื่อชิ้นงานหน้าแคบและสูง เพื่อให้อ่านชื่อได้ง่ายขึ้น
- โปรแกรมจะพยายามอ่าน outline ปิดจาก `LWPOLYLINE` หรือประกอบจากเส้น `LINE` เพื่อใช้กันชนตามรูปทรงจริงมากขึ้น
- ชิ้นงานที่มีเว้าแบบ rectilinear/L-shape สามารถให้ชิ้นเล็กแทรกในช่องเว้าได้เมื่อ outline ปิดอ่านได้

## ข้อจำกัด

- การคำนวณยังไม่ใช่ true-shape nesting เชิงอุตสาหกรรมเต็มรูปแบบ แต่มี shape-aware collision จาก outline ปิดเพื่อช่วยใช้พื้นที่เว้า
- รองรับ geometry หลัก เช่น LINE, LWPOLYLINE, POLYLINE, VERTEX, CIRCLE, ARC, SPLINE, ELLIPSE
- เหมาะสำหรับประเมินจำนวนแผ่นและเตรียมไฟล์สั่งงาน หากต้องการคำนวณชนรูปทรงจริงระดับอุตสาหกรรม ควรต่อยอดเป็น polygon nesting

## Online ด้วย Google Sheet

ระบบออนไลน์ใช้ Google Apps Script เป็น API, ใช้ Google Sheet เป็นฐานข้อมูลรายการงาน และใช้ Google Drive เก็บ DXF ต้นฉบับในรูปแบบไฟล์งาน JSON จึงไม่ติดข้อจำกัดขนาดข้อความต่อเซลล์

### 1. สร้างฐานข้อมูลและ API

1. เข้า [Google Apps Script](https://script.google.com) แล้วสร้างโปรเจกต์ใหม่
2. นำโค้ดจาก `google-apps-script/Code.gs` ไปวางในไฟล์ `Code.gs` (ไฟล์นี้จัดรูปแบบให้ต่ำกว่า 100 บรรทัดเพื่อคัดลอกได้ครบ)
3. เปิด Project Settings และเลือก Show `appsscript.json` manifest file in editor
4. นำเนื้อหาจาก `google-apps-script/appsscript.json` ไปแทนไฟล์ manifest
5. เลือกฟังก์ชัน `setupNiceNesting` แล้วกด Run หนึ่งครั้ง จากนั้นอนุญาตสิทธิ์ Google Sheet และ Drive
6. เปิด Execution log แล้วเก็บค่า `spreadsheetUrl`, `driveFolderUrl` และ `apiSecret`
7. กด Deploy > New deployment > Web app
8. ตั้ง Execute as เป็น `Me` และ Who has access เป็น `Anyone`
9. กด Deploy แล้วคัดลอก Web app URL ที่ลงท้ายด้วย `/exec`

### 2. เชื่อมเว็บ Nice nesting

1. เปิดเว็บแล้วกรอก `Apps Script Web App URL`
2. กรอก `รหัสเชื่อมต่อ` ด้วยค่า `apiSecret` จากขั้นตอน setup
3. ใช้ `Save Online`, `Load Online` และ `Delete Online`

ระบบอ่านรายการงานทั้งหมดจาก Google Sheet โดยไม่จำกัด 100 แถว เมื่อมีมากกว่า 30 งาน โปรแกรมจะให้ค้นหาด้วยชื่อ วัสดุ หรือวันที่ก่อนเลือก Load/Delete

ก่อน Save ระบบจะแสดงประวัติงานล่าสุดและตรวจชื่อซ้ำ ทุกงานมี `Project ID` ถาวร: การ Save งานเดิมจะอัปเดตแถวและไฟล์เดิม ส่วนการเลือก DXF ชุดใหม่หรือกด Clear จะสร้าง Project ID ใหม่เพื่อไม่ให้เขียนทับงานเก่าโดยไม่ตั้งใจ

URL และรหัสจะถูกจำไว้ใน browser เครื่องนั้น ไม่ถูกเขียนลงในไฟล์ HTML

เมื่อแก้โค้ด Apps Script ภายหลัง ให้ Deploy > Manage deployments > Edit > New version เพื่อให้ Web app ใช้โค้ดล่าสุด

เมื่ออัปเดตเวอร์ชันที่มีข้อมูลวัสดุ ให้ deploy Apps Script เป็น New version เพื่อเพิ่มคอลัมน์ `material` และ `thicknessMm` ใน Google Sheet โดยข้อมูลเดิมยังใช้งานได้

เมื่ออัปเดต Apps Script ให้แทนที่ไฟล์ `Code.gs` ทั้งไฟล์ ไม่ควรคัดลอกเฉพาะบางฟังก์ชัน เพราะตัวแปรหรือ helper อาจไม่ครบ จากนั้น deploy เป็น New version โดย URL `/exec` เดิมยังใช้ต่อได้

หลัง deploy Version 3 การเรียกใช้งานครั้งแรกจะเพิ่มคอลัมน์ revision/ข้อมูลสั่งผลิตในชีต `Jobs` และสร้างชีต `Versions` อัตโนมัติเมื่อมีการอัปเดตงานเดิม ไม่ต้องรัน setup ใหม่

### 3. Deploy หน้าเว็บไป GitHub Pages

1. สร้าง repository ใหม่ เช่น `nice-nesting`
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้
3. ไปที่ repository Settings > Pages
4. Source: Deploy from a branch
5. Branch: `main`, folder: `/root`
6. เปิด URL ที่ GitHub Pages ให้มา เช่น `https://YOUR_GITHUB_USERNAME.github.io/nice-nesting/`

การเชื่อม Google Sheet ใช้งานได้ทั้งหน้าเว็บ GitHub Pages และไฟล์ local แต่แนะนำ GitHub Pages เพื่อให้เปิดจากหลายเครื่องได้สะดวก
