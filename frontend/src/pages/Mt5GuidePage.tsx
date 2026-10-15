import React from 'react';
import {
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

export const Mt5GuidePage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Badge variant="brand" size="md">คู่มือภาษาไทย</Badge>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-2">
          คู่มือการติดตั้งและใช้งาน MT5 Expert Advisor (Auto-Sync)
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
          ขั้นตอนการตั้งค่า Expert Advisor ใน MetaTrader 5 เพื่อเชื่อมต่อและซิงค์ข้อมูลประวัติการเทรดอัตโนมัติมายังระบบ Trading Journal
        </p>
      </div>

      {/* Important Architecture Note */}
      <Card className="p-4 sm:p-5 border-blue-500/30 bg-blue-950/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm text-slate-300">
            <span className="font-bold text-white">หลักการทำงานและความปลอดภัย:</span>
            <p className="text-slate-300 leading-relaxed">
              EA ทำหน้าที่ <strong>อ่านเฉพาะประวัติ Deals ที่ปิดแล้ว (Read-Only)</strong> เพื่อส่งมายัง Web Journal เท่านั้น <strong>ไม่มีฟังก์ชันส่งคำสั่งซื้อขาย หรือแก้ไข Order ใดๆ ทั้งสิ้น</strong> และระบบจะไม่ถาม Broker Password หรือ Investor Password ของคุณเด็ดขาด
            </p>
          </div>
        </div>
      </Card>

      {/* Step by Step Guide */}
      <div className="space-y-4">
        {/* Step 1 */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              1
            </span>
            <h2 className="text-base font-bold text-white">นำไฟล์ EA ไปวางในโฟลเดอร์ MT5</h2>
          </div>
          <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-300">
            <p>1. เปิดโปรแกรม MetaTrader 5 บนคอมพิวเตอร์ของคุณ</p>
            <p>
              2. ไปที่เมนู <strong className="text-white">File → Open Data Folder</strong>
            </p>
            <p>
              3. เข้าไปยังโฟลเดอร์ <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded">MQL5 \ Experts</code>
            </p>
            <p>
              4. คัดลอกไฟล์ <strong className="text-white">TradingJournalSync.mq5</strong> วางลงในโฟลเดอร์นี้
            </p>
          </div>
        </Card>

        {/* Step 2 */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              2
            </span>
            <h2 className="text-base font-bold text-white">Compile ไฟล์ใน MetaEditor</h2>
          </div>
          <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-300">
            <p>1. ใน MT5 ให้กดปุ่ม <strong className="text-white">F4</strong> เพื่อเปิดโปรแกรม MetaEditor</p>
            <p>
              2. ในหน้าต่าง Navigator ด้านซ้าย ดับเบิลคลิกเปิดไฟล์ <code className="text-slate-200 bg-slate-900 px-1.5 py-0.5 rounded">Experts \ TradingJournalSync.mq5</code>
            </p>
            <p>
              3. กดปุ่ม <strong className="text-emerald-400">Compile (F7)</strong> และสังเกตด้านล่างต้องขึ้นว่า <code className="text-emerald-400">0 errors, 0 warnings</code>
            </p>
          </div>
        </Card>

        {/* Step 3 */}
        <Card className="p-5 space-y-3 border-amber-500/30 bg-amber-950/10">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0">
              3
            </span>
            <h2 className="text-base font-bold text-white">อนุญาต WebRequest URL (สำคัญมาก!)</h2>
          </div>
          <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-300">
            <p className="text-amber-200/90 font-medium">
              หากไม่ตั้งค่าขั้นตอนนี้ MT5 จะบล็อกการเชื่อมต่ออินเทอร์เน็ตของ EA และขึ้น Error 4060
            </p>
            <p>1. ที่ MT5 ไปที่เมนู <strong className="text-white">Tools → Options</strong> (หรือกด Ctrl+O)</p>
            <p>2. เลือกแท็บ <strong className="text-white">Expert Advisors</strong></p>
            <p>3. ติ๊กถูกที่ <strong className="text-white">"Allow WebRequest for listed URL"</strong></p>
            <p>4. ดับเบิลคลิกที่ช่องสีเขียว <strong className="text-white">add new URL</strong> แล้วใส่ URL ของระบบ เช่น:</p>
            <div className="bg-slate-900 p-2.5 rounded border border-slate-800 font-mono text-xs text-blue-400 select-all">
              http://localhost:8080
            </div>
            <p className="text-slate-400 text-xs">(หรือใส่โดเมน Production ที่คุณใช้งาน)</p>
          </div>
        </Card>

        {/* Step 4 */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              4
            </span>
            <h2 className="text-base font-bold text-white">แนบ EA เข้ากับกราฟและระบุ Token</h2>
          </div>
          <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-300">
            <p>1. ใน MT5 เปิดกราฟคู่เงินใดก็ได้ขึ้นมา 1 กราฟ (เช่น EURUSD หรือ XAUUSD)</p>
            <p>2. ลาก <strong className="text-white">TradingJournalSync</strong> จากหน้าต่าง Navigator มาวางลงบนกราฟ</p>
            <p>3. ในหน้าต่างการตั้งค่า แท็บ <strong className="text-white">Inputs</strong>:</p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-300">
              <li>
                <strong className="text-white">BackendApiUrl:</strong> ตรวจสอบว่าตรงกับ URL ของคุณ
              </li>
              <li>
                <strong className="text-white">IntegrationToken:</strong> นำ Token ที่ได้จากหน้า MT5 Connections มาวาง
              </li>
              <li>
                <strong className="text-white">InitialImportDays:</strong> จำนวนวันที่ต้องการดึงย้อนหลัง (ค่าเริ่มต้น 30 วัน)
              </li>
              <li>
                <strong className="text-white">SyncIntervalSeconds:</strong> ความถี่ในการซิงค์ข้อมูล (ค่าเริ่มต้น 30 วินาที)
              </li>
            </ul>
            <p>4. ในแท็บ <strong className="text-white">Common</strong> ติ๊กถูกที่ <strong className="text-white">"Allow Algo Trading"</strong> แล้วกด OK</p>
            <p>5. ตรวจสอบว่าปุ่ม <strong className="text-white">Algo Trading</strong> บนแถบเครื่องมือหลักของ MT5 เป็นสีเขียวแล้ว</p>
          </div>
        </Card>

        {/* Step 5 */}
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              5
            </span>
            <h2 className="text-base font-bold text-white">ตรวจสอบการทำงานบน Web Dashboard</h2>
          </div>
          <div className="pl-8 space-y-2 text-xs sm:text-sm text-slate-300">
            <p>1. กลับมาที่หน้าเว็บ <strong className="text-white">MT5 Sync</strong></p>
            <p>
              2. สถานะการเชื่อมต่อจะเปลี่ยนเป็น <span className="text-emerald-400 font-semibold">CONNECTED</span> ภายใน 30 วินาที
            </p>
            <p>3. ตรวจสอบจำนวน Deals ที่ถูกดึงเข้ามาในหน้า Trades</p>
            <p>
              4. เปิด MT5 ทิ้งไว้เมื่อต้องการให้ระบบซิงค์ออเดอร์ใหม่ๆ ทันทีที่ปิดออเดอร์
            </p>
          </div>
        </Card>
      </div>

      {/* Troubleshooting Section */}
      <Card className="p-5 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400" />
          <span>การแก้ไขปัญหาที่พบบ่อย (Troubleshooting)</span>
        </h2>
        <div className="space-y-3 text-xs sm:text-sm text-slate-300 divide-y divide-surface-border">
          <div className="pt-2">
            <strong className="text-white">Q: EA แจ้ง Error 4060 ในแถบ Experts Log?</strong>
            <p className="text-slate-400 mt-1">
              เกิดจากยังไม่ได้เพิ่ม URL ใน Tools → Options → Expert Advisors → Allow WebRequest กรุณาเพิ่ม URL และกด OK
            </p>
          </div>
          <div className="pt-3">
            <strong className="text-white">Q: ขึ้น Unauthorized (401) ใน Logs?</strong>
            <p className="text-slate-400 mt-1">
              Token ไม่ถูกต้องหรือถูก Revoke แล้ว ให้เข้าไปที่หน้า MT5 Sync กด Rotate Token และนำค่าใหม่มาใส่ใน EA
            </p>
          </div>
          <div className="pt-3">
            <strong className="text-white">Q: หากปิดคอมพิวเตอร์หรือปิด MT5 ข้อมูลจะหายหรือไม่?</strong>
            <p className="text-slate-400 mt-1">
              ข้อมูลที่ซิงค์เข้า Database แล้วจะไม่หาย และเมื่อคุณเปิด MT5 อีกครั้ง EA จะตรวจจับ Checkpoint ล่าสุดและดึงเฉพาะข้อมูลช่วงที่ขาดหายไปมาซ่อมแซมให้โดยอัตโนมัติ
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
