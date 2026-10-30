const statusEl = document.getElementById("status");
const summaryEl = document.getElementById("summary");
const extractButton = document.getElementById("extract");
const downloadButton = document.getElementById("download");
let latestExport = null;

function setStatus(message) { statusEl.textContent = message; }

async function activeShopeeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url?.startsWith("https://seller.shopee.co.th/")) {
    throw new Error("กรุณาเปิดหน้า seller.shopee.co.th ก่อน");
  }
  return tab;
}

(async () => {
  try {
    const tab = await activeShopeeTab();
    extractButton.disabled = false;
    setStatus("เชื่อมต่อหน้า Seller Centre แล้ว");
    summaryEl.textContent = "จะอ่านเฉพาะรายการที่แสดงอยู่ในหน้าปัจจุบัน";
  } catch (error) {
    setStatus(error.message);
  }
})();

extractButton.addEventListener("click", async () => {
  extractButton.disabled = true;
  downloadButton.disabled = true;
  try {
    const tab = await activeShopeeTab();
    const response = await chrome.tabs.sendMessage(tab.id, { type: "FIREKEEPER_EXTRACT_VISIBLE_ORDERS" });
    if (!response?.ok) throw new Error(response?.error || "ไม่สามารถอ่านรายการได้");
    latestExport = response.payload;
    const count = latestExport.orders.length;
    setStatus(count ? "อ่านข้อมูลจากหน้าปัจจุบันแล้ว" : "ไม่พบรายการที่อ่านได้อย่างมั่นใจ");
    summaryEl.textContent = `พบ ${count} รายการ · ${latestExport.extraction.pageUrl}`;
    downloadButton.disabled = count === 0;
  } catch (error) {
    setStatus(error.message || "เกิดข้อผิดพลาด");
  } finally {
    extractButton.disabled = false;
  }
});

downloadButton.addEventListener("click", async () => {
  if (!latestExport) return;
  const blob = new Blob([JSON.stringify(latestExport, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({
      url,
      filename: `firekeeper-shopee-orders-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
      saveAs: true
    });
    setStatus("ส่งไฟล์ JSON ไปยัง Downloads แล้ว");
  } catch (error) {
    setStatus("ดาวน์โหลดไม่สำเร็จ: " + error.message);
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
});