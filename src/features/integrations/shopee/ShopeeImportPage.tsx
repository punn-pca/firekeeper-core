import React, { useCallback, useEffect, useState } from 'react';
import { auth } from '../../../lib/firebase';
import { getApiEndpoint } from '../../../config/env';
import { summarizeShopeeOrders } from './shopeeAnalytics';

type OrderRecord = {
  id: string;
  orderId: string | null;
  orderStatus: string;
  observedAmount: number | null;
  currency: string;
  importedAt: string;
  validationStatus: string;
  orderDateText?: string | null;
  products?: Array<{ name: string; quantity: number | null; observedUnitOrLineAmount: number | null }>;
};

export function ShopeeImportPage({ onGoToChat }: { onGoToChat: () => void }) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const request = useCallback(async (path: string, init: RequestInit = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('กรุณาเข้าสู่ระบบ FIREKEEPER ก่อนนำเข้าข้อมูล');
    const token = await user.getIdToken();
    return fetch(getApiEndpoint(path), {
      ...init,
      headers: {
        Authorization: 'Bearer ' + token,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request('/api/integrations/shopee/orders');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'โหลดรายการไม่สำเร็จ');
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error: any) {
      setMessage(error.message || 'ไม่สามารถโหลดรายการได้');
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { void refresh(); }, [refresh]);

  const analytics = summarizeShopeeOrders(orders);

  const importFile = async () => {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error('ไฟล์ใหญ่เกิน 2 MB');
      const parsed = JSON.parse(await file.text());
      const response = await request('/api/integrations/shopee/import', {
        method: 'POST',
        body: JSON.stringify(parsed),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'นำเข้าข้อมูลไม่สำเร็จ');
      setMessage('นำเข้าสำเร็จ ' + data.importedCount + ' รายการ · รายการที่อ่านได้ยังต้องตรวจสอบ');
      setFile(null);
      await refresh();
    } catch (error: any) {
      setMessage(error instanceof SyntaxError ? 'ไฟล์ JSON ไม่ถูกต้อง' : (error.message || 'นำเข้าไม่สำเร็จ'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-amber-400">Commerce Connector</p>
          <h1 className="mt-1 text-2xl font-semibold">Shopee Orders</h1>
          <p className="mt-1 text-sm text-slate-400">นำเข้าข้อมูลที่ Local Agent อ่านจากหน้า Seller Centre</p>
        </div>
        <button onClick={onGoToChat} className="rounded-lg border border-slate-600 px-3 py-2 text-sm">กลับไป FIREKEEPER</button>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
        <h2 className="font-medium">นำเข้าไฟล์จาก Shopee Local Agent</h2>
        <p className="text-sm text-slate-400">เลือก JSON ที่ดาวน์โหลดจาก Extension ระบบจะตรวจสอบโครงสร้างก่อนบันทึกใน Workspace ของบัญชีที่เข้าสู่ระบบ</p>
        <input
          type="file"
          accept="application/json,.json"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-400 file:px-3 file:py-2 file:font-semibold file:text-slate-950"
        />
        <button disabled={!file || busy} onClick={() => void importFile()} className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-40">
          {busy ? 'กำลังนำเข้า…' : 'นำเข้า FIREKEEPER'}
        </button>
        {message && <p role="status" className="text-sm text-amber-200">{message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">ออเดอร์ที่นำเข้า</p><p className="mt-1 text-2xl font-semibold">{analytics.orderCount.toLocaleString("th-TH")}</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-xs text-slate-400">ยอดเงินที่อ่านพบ*</p><p className="mt-1 text-2xl font-semibold">{analytics.observedAmountTotal.toLocaleString("th-TH")} ฿</p><p className="mt-1 text-xs text-slate-500">พบตัวเลขใน {analytics.observedAmountCount} / {analytics.orderCount} ออเดอร์</p></div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 sm:col-span-2"><p className="text-xs text-slate-400">สถานะที่อ่านพบ</p><div className="mt-2 flex flex-wrap gap-2">{analytics.statusCounts.length ? analytics.statusCounts.map((item) => <span key={item.status} className="rounded-full border border-slate-700 px-3 py-1 text-xs">{item.status} · {item.count}</span>) : <span className="text-sm text-slate-500">ยังไม่มีข้อมูล</span>}</div></div>
      </div>
      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><h2 className="mb-3 font-medium">สินค้าที่พบในออเดอร์บ่อย</h2>{analytics.topProducts.length ? <ol className="space-y-2">{analytics.topProducts.map((item, index) => <li key={item.name} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate"><span className="mr-2 text-slate-500">{index + 1}.</span>{item.name}</span><span className="shrink-0 text-slate-400">{item.appearances} ครั้ง</span></li>)}</ol> : <p className="text-sm text-slate-500">ยังไม่มีข้อมูลสินค้า</p>}<p className="mt-3 text-xs text-slate-500">นับจากชื่อสินค้าที่ Local Agent อ่านได้เท่านั้น ไม่ใช่จำนวนชิ้นที่ขาย</p></div>

      <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-medium">รายการที่นำเข้าแล้ว</h2>
          <button onClick={() => void refresh()} className="text-sm text-amber-300">Refresh</button>
        </div>
        {loading ? <p className="text-sm text-slate-400">กำลังโหลด…</p> : orders.length === 0 ? (
          <p className="text-sm text-slate-400">ยังไม่มีข้อมูลคำสั่งซื้อ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-xs text-slate-400"><tr><th className="py-2">Order ID</th><th>วันที่สั่งซื้อ</th><th>สถานะ</th><th>สินค้า</th><th>จำนวนเงินที่พบ</th><th>นำเข้าเมื่อ</th></tr></thead>
              <tbody>{orders.map((order) => (
                <tr key={order.id} className="border-t border-slate-800">
                  <td className="py-3 font-mono text-xs">{order.orderId || order.id.slice(0, 16)}</td>
                  <td>{order.orderDateText || '—'}</td>
                  <td>{order.orderStatus}</td>
                  <td>{order.products?.length || 0} รายการ</td>
                  <td>{order.observedAmount == null ? '—' : order.observedAmount.toLocaleString('th-TH') + ' บาท*'}</td>
                  <td className="text-xs text-slate-400">{order.importedAt ? new Date(order.importedAt).toLocaleString('th-TH') : '—'}</td>
                </tr>
              ))}</tbody>
            </table>
            <p className="mt-3 text-xs text-slate-500">*วันที่และจำนวนเงินเป็นข้อความที่อ่านจากหน้าเว็บ ส่วนชื่อสินค้า/จำนวนอาจไม่ครบถ้วน ต้องตรวจสอบกับ Shopee ก่อนนำไปใช้ตัดสินใจ</p>
          </div>
        )}
      </div>
    </section>
  );
}
