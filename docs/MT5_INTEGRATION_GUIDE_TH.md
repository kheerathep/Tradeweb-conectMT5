# คู่มือการติดตั้งและใช้งาน MT5 Expert Advisor (TradingJournalSync.mq5)

คู่มือนี้จะอธิบายขั้นตอนการติดตั้งและตั้งค่า Expert Advisor (EA) สำหรับ **MetaTrader 5** เพื่อเชื่อมต่อข้อมูลประวัติการเทรดและสถานะพอร์ตเข้าสู่ระบบ **TradeJournal** แบบ Real-Time อัตโนมัติ

---

## 1. สิ่งที่ต้องเตรียมก่อนเริ่มใช้งาน
1. โปรแกรม **MetaTrader 5 (MT5)** บนเครื่องคอมพิวเตอร์ของคุณ
2. บัญชีผู้ใช้งานบนระบบ **TradeJournal Web**
3. ไฟล์ EA: `TradingJournalSync.mq5` (อยู่ในโฟลเดอร์ `d:\tradeweb\mt5\Experts\TradingJournalSync.mq5`)

---

## 2. ขั้นตอนการขอ Integration Token จากระบบ
1. ล็อกอินเข้าสู่ระบบ TradeJournal Web
2. ไปที่เมนู **MT5 Sync** (`/mt5-connections`)
3. เลือกบัญชีเทรดที่ต้องการเชื่อมต่อ (เช่น Main Trading Account หรือ FTMO)
4. คลิกปุ่ม **"Initialize Connection & Generate EA Token"** หรือ **"Rotate / Re-issue Token"**
5. ระบบจะแสดงรหัส Token ที่ขึ้นต้นด้วย `tj_` เช่น:
   ```
   tj_2676cdc88c774b8057b52420eb963c67d91ee0bcd2787d6f
   ```
6. กดปุ่ม **Copy** เพื่อคัดลอก Token เตรียมไว้

---

## 3. ขั้นตอนการติดตั้งไฟล์ EA ลงใน MetaTrader 5
1. เปิดโปรแกรม **MetaTrader 5**
2. ไปที่เมนูบาร์ด้านบน เลือก **File** -> **Open Data Folder**
3. เข้าไปที่โฟลเดอร์:
   ```
   MQL5\Experts\
   ```
4. คัดลอกไฟล์ `TradingJournalSync.mq5` ไปวางในโฟลเดอร์ `Experts`
5. กลับมาที่หน้าต่าง MT5 ในแผง **Navigator** (กด Ctrl+N หากไม่แสดง)
6. คลิกขวาที่หัวข้อ **Expert Advisors** แล้วกด **Refresh** จะเห็นชื่อ `TradingJournalSync` ปรากฏขึ้นมา

---

## 4. การตั้งค่าสิทธิ์ WebRequest ใน MetaTrader 5 (สำคัญมาก)
MetaTrader 5 มีระบบความปลอดภัยป้องกันไม่ให้ EA ส่งข้อมูลออกนอกเครื่องโดยไม่ได้รับอนุญาต คุณจำเป็นต้องอนุญาต URL ของ Backend ก่อน:

1. ใน MT5 ไปที่เมนู **Tools** -> **Options** (หรือกด `Ctrl+O`)
2. เลือกแท็บ **Expert Advisors**
3. ติ๊กถูกที่ช่อง **"Allow WebRequest for listed URL"**
4. ดับเบิลคลิกที่รายการด้านล่างเพื่อเพิ่ม URL:
   * สำหรับการทดสอบในเครื่อง Localhost:
     ```
     http://localhost:8080
     ```
   * สำหรับการใช้งานบนเซิร์ฟเวอร์จริง (Production Domain):
     ```
     https://api.yourjournaldomain.com
     ```
5. ติ๊กถูกที่ **"Allow algorithmic trading"** (AutoTrading)
6. กดปุ่ม **OK**

---

## 5. การเปิดใช้งาน EA บนกราฟ
1. เปิดกราฟคู่เงินใดก็ได้ใน MT5 (แนะนำ 1 กราฟ เช่น EURUSD หรือ XAUUSD กรอบเวลาใดก็ได้)
2. ลากไฟล์ `TradingJournalSync` จากแผง Navigator มาวางบนกราฟ
3. จะมีหน้าต่างตั้งค่าเปิดขึ้นมา ไปที่แท็บ **Inputs**:
   * **InpApiUrl**: ใส่ URL ของ Backend (ค่าเริ่มต้น `http://localhost:8080`)
   * **InpApiToken**: วาง Token `tj_...` ที่คัดลอกมาจากขั้นตอนที่ 2
   * **InpSyncIntervalSeconds**: ความถี่ในการตรวจสอบการซิงค์ (ค่าเริ่มต้น 10 วินาที)
   * **InpHeartbeatMinutes**: ความถี่ในการส่ง Heartbeat อัปเดต Balance/Equity (ค่าเริ่มต้น 5 นาที)
   * **InpInitialLookbackDays**: จำนวนวันย้อนหลังในการซิงค์ครั้งแรก (ค่าเริ่มต้น 90 วัน)
4. ไปที่แท็บ **Common**:
   * ติ๊กถูกที่ **"Allow Algo Trading"**
5. กดปุ่ม **OK**
6. ตรวจสอบปุ่ม **Algo Trading** บนแถบเครื่องมือหลักของ MT5 ว่าเป็น **สีเขียว (Play)**

---

## 6. การตรวจสอบสถานะการทำงาน
* เปิดแท็บ **Experts** ที่หน้าต่าง Toolbox ด้านล่าง (กด `Ctrl+T`)
* เมื่อ EA ทำงานสำเร็จ คุณจะเห็นข้อความ Log ดังนี้:
  ```
  [TradeJournal] Initializing TradingJournalSync v1.0.0...
  [TradeJournal] Restored checkpoint from GlobalVariable: 2026.10.12 10:30:00
  [TradeJournal] Batch sent successfully (2 deals). Response: {"status":"SUCCESS", ...}
  ```
* ในหน้าเว็บ TradeJournal เมนู **MT5 Sync** สถานะจะเปลี่ยนเป็น **"Connected" (ไฟเขียวกะพริบ)** พร้อมยอดบาลานซ์และจำนวน Deals ที่ซิงค์สำเร็จ

---

## 7. การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)

| ปัญหา / Error Code | สาเหตุ | วิธีแก้ไข |
|---|---|---|
| **Error 4060** ในแท็บ Experts | WebRequest URL ยังไม่ได้รับอนุญาตใน MT5 | ไปที่ `Tools -> Options -> Expert Advisors` เพิ่ม URL `http://localhost:8080` ในช่อง Allow WebRequest |
| **HTTP 401 Unauthorized** | Token ไม่ถูกต้อง หรือถูก Revoke/สลับใหม่แล้ว | สร้าง Token ใหม่ในหน้าเว็บ แล้วนำมากรอกในช่อง `InpApiToken` ของ EA |
| **Connection Status: Pending** | EA ยังไม่ได้เริ่มส่งข้อมูล หรือปิด Algo Trading ไว้ | ตรวจสอบว่าปุ่ม Algo Trading บน MT5 เป็นสีเขียว และตรวจดู Log ในแท็บ Experts |
| **ต้องการซิงค์ประวัติย้อนหลังใหม่ทั้งหมด** | Checkpoint ปัจจุบันบันทึกเวลาล่าสุดไว้แล้ว | ใน MT5 กดปุ่ม `F3` (Global Variables) แล้วลบคีย์ `TJ_CKPT_<เลขพอร์ต>` ออก จากนั้นเปิดปิด EA ใหม่อีกครั้ง |
