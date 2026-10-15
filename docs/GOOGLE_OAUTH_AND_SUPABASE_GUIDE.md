# คู่มือการตั้งค่า Google Cloud Login และ Supabase Database (TradeWeb)

คู่มือนี้สรุปขั้นตอนทีละสเต็ปอย่างละเอียดสำหรับ:
1. **Google Login (Google OAuth 2.0)** ผ่าน Google Cloud Console
2. **Supabase Database (Cloud PostgreSQL)** เพื่อให้คนอื่นใช้งานและแชร์ Database ร่วมกันได้

---

## ส่วนที่ 1: การตั้งค่า Google Cloud Login (Google OAuth 2.0)

### ขั้นตอนที่ 1.1: เข้า Google Cloud Console และสร้างโปรเจกต์
1. เข้าไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. ล็อกอินด้วยบัญชี Google ของคุณ
3. คลิกแถบเลือกโปรเจกต์ที่มุมซ้ายบน -> คลิก **"NEW PROJECT"** (หรือเลือกโปรเจกต์เดิมที่มีอยู่)
4. ตั้งชื่อโปรเจกต์ เช่น `tradeweb-journal` แล้วคลิก **"CREATE"**

---

### ขั้นตอนที่ 1.2: ตั้งค่า OAuth consent screen (หน้ายินยอมสิทธิ์)
1. ไปที่เมนูด้านซ้าย เลือก **APIs & Services** -> **OAuth consent screen** (หรือค้นหาที่ช่อง Search)
2. เลือก User Type:
   - เลือก **External** (เพื่อให้คนทั่วไปหรือบัญชี Gmail ใดๆ ล็อกอินได้)
   - คลิก **CREATE**
3. กรอกข้อมูลแอปพลิเคชัน:
   - **App name**: `TradeWeb Journal`
   - **User support email**: เลือกอีเมลของคุณ
   - **Developer contact information**: กรอกอีเมลของคุณ
   - คลิก **SAVE AND CONTINUE**
4. หน้า **Scopes**:
   - คลิก **ADD OR REMOVE SCOPES**
   - ติ๊กเลือก 3 ตัวพื้นฐาน:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - คลิก **UPDATE** แล้วคลิก **SAVE AND CONTINUE**
5. หน้า **Test users** (สำคัญช่วงพัฒนายังไม่กด Publish):
   - คลิก **+ ADD USERS** แล้วใส่อีเมล Gmail ของคุณและทีมงานที่ต้องการทดสอบล็อกอิน
   - คลิก **SAVE AND CONTINUE** แล้วคลิก **BACK TO DASHBOARD**

---

### ขั้นตอนที่ 1.3: สร้าง OAuth Client ID
1. ไปที่แท็บ **Credentials** (เมนูด้านซ้าย)
2. คลิกปุ่ม **+ CREATE CREDENTIALS** (ด้านบน) -> เลือก **OAuth client ID**
3. ในช่อง **Application type**: เลือก **Web application**
4. ในช่อง **Name**: ตั้งชื่อ เช่น `TradeWeb Web Client`
5. ในส่วน **Authorized JavaScript origins** (สำคัญมาก):
   คลิก **+ ADD URI** แล้วเพิ่ม:
   - `http://localhost:5173` (สำหรับ Vite Frontend ตอนรันเครื่อง)
   - `http://localhost:8080` (สำหรับ Backend)
   - *(หากนำเว็บขึ้นโฮสต์จริง เช่น Vercel/Netlify ให้เพิ่ม URL เช่น `https://your-domain.com` ด้วย)*
6. ในส่วน **Authorized redirect URIs**:
   คลิก **+ ADD URI** แล้วเพิ่ม:
   - `http://localhost:5173`
   - `http://localhost:8080/login/oauth2/code/google`
7. คลิก **CREATE**
8. หน้าต่างจะแสดง **Your Client ID** (รูปแบบ `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`)
   ให้ **Copy Client ID** นี้เก็บไว้ (Client Secret ไม่จำเป็นต้องใช้สำหรับ Google Identity Services Token Verification แต่เก็บไว้ได้)

---

### ขั้นตอนที่ 1.4: นำ Client ID ไปใส่ในโปรเจกต์
1. ในฝั่ง **Frontend**:
   เปิดไฟล์ `frontend/.env` (หรือสร้างจาก `.env.example`):
   ```env
   VITE_API_BASE_URL=http://localhost:8080/api/v1
   VITE_GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
2. ในฝั่ง **Backend**:
   ในไฟล์ `.env` ที่ root หรือรัน backend:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com
   ```
3. รีสตาร์ท frontend (`npm run dev`) ปุ่ม Google Login จะแสดงและพร้อมใช้งานทันที!

---

## ส่วนที่ 2: การเชื่อมต่อ Database กับ Supabase (Cloud PostgreSQL)

เพื่อให้ทุกคนเข้าถึง Database ก้อนเดียวกันจากทุกที่ในโลกผ่านระบบ Cloud ฟรี 24 ชั่วโมง

### ขั้นตอนที่ 2.1: สมัครและสร้าง Project บน Supabase
1. เข้าไปที่ [supabase.com](https://supabase.com) แล้วล็อกอินด้วย GitHub หรือ Email
2. คลิก **"New Project"**
3. กรอกข้อมูล:
   - **Name**: `tradeweb-db`
   - **Database Password**: ตั้งรหัสผ่านที่จำได้และปลอดภัย **(ต้องจำรหัสนี้นะครับ ใช้เชื่อมต่อ JDBC)**
   - **Region**: เลือกภูมิภาคใกล้ไทย เช่น `Singapore (ap-southeast-1)`
4. คลิก **"Create new project"** แล้วรอประมาณ 1-2 นาทีให้ระบบเซ็ตอัป Database ให้เสร็จ

---

### ขั้นตอนที่ 2.2: รัน SQL Schema ลงใน Supabase (เสร็จใน 1 คลิก)
1. ในหน้า Dashboard โปรเจกต์ Supabase ของคุณ ที่เมนูด้านซ้าย คลิกไอคอน **SQL Editor**
2. คลิกปุ่ม **"New query"** (หรือเครื่องหมาย `+`)
3. เปิดไฟล์ [`supabase_schema.sql`](file:///d:/tradeweb/supabase_schema.sql) ที่เตรียมไว้ในโฟลเดอร์โปรเจกต์นี้
4. Copy โค้ดทั้งหมดในไฟล์ `supabase_schema.sql` มาวางในกล่อง SQL Editor
5. คลิกปุ่ม **"Run"** (เขียวขวาล่างหรือลัด Ctrl+Enter)
6. เมื่อรันสำเร็จ จะขึ้น `Success. No rows returned`
7. ไปที่แท็บ **Table Editor** ที่เมนูด้านซ้าย จะเห็นตารางทั้ง 10 ตารางสร้างเสร็จสมบูรณ์ทันที:
   - `users`
   - `trading_accounts`
   - `mt5_integrations`
   - `trade_strategies`
   - `trades`
   - `mt5_deals`
   - `trade_tags`
   - `trade_attachments`
   - `sync_batches`
   - `import_jobs`

---

### ขั้นตอนที่ 2.3: เอา Connection String มาใส่ในโปรเจกต์ TradeWeb
1. ในหน้า Supabase Dashboard ไปที่รูปฟันเฟือง **Project Settings** (มุมล่างซ้าย)
2. คลิกหัวข้อ **Database**
3. เลื่อนลงมาที่หัวข้อ **Connection string**
4. เลือกแท็บ **URI** หรือ **JDBC**:
   - ถ้าดูแบบ **URI / Direct Connection**:
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - ถ้าเครือข่ายอินเทอร์เน็ตของเครื่องคุณไม่รองรับ IPv6 แนะนำให้เลือกแท็บ **Connection Pooling (Session mode port 5432 หรือ Transaction mode port 6543)**:
     `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
5. นำข้อมูลมาใส่ในไฟล์ `.env` ของ TradeWeb:
   ```env
   # สลับให้ Spring Boot ใช้โปรไฟล์ Supabase แทน MySQL ในเครื่อง
   SPRING_PROFILES_ACTIVE=supabase

   # ใส่ URL Supabase (อย่าลืมเปลี่ยน YOUR_PASSWORD และ YOUR_PROJECT_REF)
   SUPABASE_DB_URL=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
   SUPABASE_DB_USER=postgres
   SUPABASE_DB_PASSWORD=รหัสผ่านดาต้าเบสที่คุณตั้งตอนสร้าง
   ```
   *(หรือถ้าใช้ Pooler Host: `jdbc:postgresql://aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require` และ USER คือ `postgres.YOUR_PROJECT_REF`)*

---

### ขั้นตอนที่ 2.4: การแชร์ให้คนอื่นในทีมใช้ร่วมกัน
1. **ให้เพื่อน/ทีมเข้าดู Dashboard Supabase**:
   - ไปที่ **Project Settings** -> **Members** -> คลิก **Invite** ใส่อีเมลเพื่อน
2. **ให้เพื่อนรัน Backend ต่อเข้า DB กลาง**:
   - ส่งค่าใน `.env` ข้างต้นให้เพื่อนใส่ในเครื่องของเขา
   - ทุกคนที่รัน TradeWeb จะบันทึกเทรด ดูสถิติ และซิงก์ MT5 เข้าก้อนเดียวกันแบบ Realtime ทันที!
