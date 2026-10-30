(() => {
  if (window.__firekeeperShopeeAgentInstalled) return;
  window.__firekeeperShopeeAgentInstalled = true;

  const ORDER_ID = /\b([A-Z0-9]{10,24})\b/g;
  const MONEY = /(?:฿|THB\s*)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const STATUS_TERMS = ["ที่ต้องจัดส่ง", "กำลังจัดส่ง", "สำเร็จ", "ยกเลิก", "คืนเงิน", "จัดส่งแล้ว", "รอจัดส่ง"];

  function visible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }
  function normalizedText(element) {
    return (element.innerText || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
  }
  function stableFingerprint(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return "visible-" + (hash >>> 0).toString(16).padStart(8, "0");
  }
  function findOrderId(text) {
    const labeled = text.match(/(?:หมายเลขคำสั่งซื้อ|เลขที่คำสั่งซื้อ|Order\s*ID|Order\s*No\.?)[：:\s#-]*([A-Z0-9]{8,24})/i);
    if (labeled && /[A-Z]/i.test(labeled[1]) && /[0-9]/.test(labeled[1])) return labeled[1];
    const matches = [...text.matchAll(ORDER_ID)].map(match => match[1]);
    return matches.find(value => /[A-Z]/.test(value) && /[0-9]/.test(value)) || null;
  }
  function findLabeledOrderTotal(text) {
    const match = text.match(/(?:ยอดรวมคำสั่งซื้อ|ยอดรวมที่ต้องชำระ|ยอดชำระ|Order\s*Total|Total\s*Amount)[^\n฿]{0,40}(?:฿|THB\s*)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
    return match ? Number(match[1].replace(/,/g, "")) : null;
  }
  function isOrderDetailPage(text) {
    const pathSuggestsDetail = /(?:order[_/-]?detail|detail[_/-]?order|orders?\/[^/]+)$/i.test(location.pathname);
    const hasOrderIdLabel = /(?:หมายเลขคำสั่งซื้อ|เลขที่คำสั่งซื้อ|Order\s*ID|Order\s*No\.?)/i.test(text);
    return pathSuggestsDetail || hasOrderIdLabel;
  }
  function parseDate(text) {
    const match = text.match(/(?:วันที่สั่งซื้อ|เวลาที่สั่งซื้อ|Order\s*Date)\s*[:：]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{4}(?:\s+[0-9]{1,2}:[0-9]{2})?)/i);
    return match ? match[1] : null;
  }
  function parseProducts(root) {
    const candidates = [...root.querySelectorAll("div, li, tr, article")]
      .filter(visible)
      .map(element => ({ element, text: normalizedText(element) }))
      .filter(item => item.text.length >= 8 && item.text.length <= 500)
      .filter(item => MONEY.test(item.text) && !STATUS_TERMS.some(term => item.text.trim() === term));
    const products = [];
    const seen = new Set();
    for (const item of candidates.sort((a, b) => a.text.length - b.text.length)) {
      const lines = item.text.split(/\n+/).map(line => line.trim()).filter(Boolean);
      const priceMatch = item.text.match(MONEY);
      if (!priceMatch) continue;
      const fingerprint = item.text.slice(0, 180);
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
      const name = lines.find(line => line.length > 3 && !MONEY.test(line) && !/^(?:จำนวน|Qty|x\s*\d)/i.test(line)) || null;
      if (!name) continue;
      const quantityMatch = item.text.match(/(?:จำนวน|Qty|x)\s*[:：]?\s*(\d{1,3})/i);
      products.push({
        name: name.slice(0, 180),
        quantity: quantityMatch ? Number(quantityMatch[1]) : null,
        observedUnitOrLineAmount: Number(priceMatch[1].replace(/,/g, "")),
        amountMeaning: "UNVERIFIED_VISIBLE_PRODUCT_AMOUNT"
      });
      if (products.length >= 30) break;
    }
    return products;
  }
  function detailOrder() {
    const text = normalizedText(document.body);
    if (!isOrderDetailPage(text)) return null;
    const orderId = findOrderId(text);
    if (!orderId) return null;
    const status = STATUS_TERMS.find(term => text.includes(term)) || null;
    const labeledOrderTotal = findLabeledOrderTotal(text);
    const products = parseProducts(document.body);
    return {
      orderId,
      recordKey: stableFingerprint(text),
      orderStatus: status,
      observedAmount: labeledOrderTotal,
      currency: "THB",
      orderDateText: parseDate(text),
      products,
      amountMeaning: "UNVERIFIED_VISIBLE_AMOUNT",
      validationStatus: "NEEDS_REVIEW"
    };
  }
  function listOrders() {
    const nodes = [...document.querySelectorAll("div, article, li, tr")]
      .filter(visible)
      .map(element => ({ text: normalizedText(element) }))
      .filter(item => item.text.length >= 60 && item.text.length <= 2400)
      .filter(item => MONEY.test(item.text) && STATUS_TERMS.some(term => item.text.includes(term)));
    const selected = new Map();
    for (const item of nodes.sort((a, b) => a.text.length - b.text.length)) {
      const status = STATUS_TERMS.find(term => item.text.includes(term)) || null;
      const orderId = findOrderId(item.text);
      const fingerprint = orderId || stableFingerprint(item.text);
      if (!selected.has(fingerprint)) selected.set(fingerprint, {
        orderId, recordKey: stableFingerprint(item.text), orderStatus: status,
        observedAmount: null,
        currency: "THB", products: [], orderDateText: null,
        amountMeaning: "UNVERIFIED_VISIBLE_AMOUNT", validationStatus: "NEEDS_REVIEW"
      });
    }
    return [...selected.values()];
  }
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "FIREKEEPER_EXTRACT_VISIBLE_ORDERS") return;
    try {
      const detail = detailOrder();
      const orders = detail ? [detail] : listOrders();
      sendResponse({
        ok: true,
        payload: {
          schemaVersion: "firekeeper-commerce-orders.v1",
          platform: "shopee",
          source: "browser_visible_dom",
          extraction: { pageUrl: location.origin + location.pathname, extractedAt: new Date().toISOString(), userInitiated: true },
          scope: "visible_current_page_only",
          pageType: detail ? "order_detail" : "order_list",
          orders
        }
      });
    } catch (_error) {
      sendResponse({ ok: false, error: "อ่านข้อมูลไม่สำเร็จ กรุณาลองใหม่หรือเปลี่ยนหน้า" });
    }
    return true;
  });
})();