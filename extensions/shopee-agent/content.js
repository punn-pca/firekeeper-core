(() => {
  if (window.__firekeeperShopeeAgentInstalled) return;
  window.__firekeeperShopeeAgentInstalled = true;

  const ORDER_ID = /\b([A-Z0-9]{10,24})\b/g;
  const MONEY = /(?:฿|THB\s*)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i;
  const STATUS_TERMS = ["ที่ต้องจัดส่ง", "กำลังจัดส่ง", "สำเร็จ", "ยกเลิก", "คืนเงิน", "จัดส่งแล้ว", "รอจัดส่ง"];

  function visible(element) {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" &&
      rect.width > 0 && rect.height > 0;
  }

  function normalizedText(element) {
    return (element.innerText || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
  }

  function findOrderId(text) {
    const matches = [...text.matchAll(ORDER_ID)].map(match => match[1]);
    return matches.find(value => /[A-Z]/.test(value) && /[0-9]/.test(value)) || null;
  }

  function candidateBlocks() {
    const nodes = [...document.querySelectorAll("div, article, li, tr")]
      .filter(visible)
      .map(element => ({ text: normalizedText(element) }))
      .filter(item => item.text.length >= 60 && item.text.length <= 2400)
      .filter(item => MONEY.test(item.text) && STATUS_TERMS.some(term => item.text.includes(term)));

    const selected = new Map();
    for (const item of nodes.sort((a, b) => a.text.length - b.text.length)) {
      const status = STATUS_TERMS.find(term => item.text.includes(term)) || null;
      const amount = item.text.match(MONEY)?.[1]?.replace(/,/g, "") || "";
      const orderId = findOrderId(item.text);
      const fingerprint = orderId || [status, amount, item.text.length].join("|");
      if (!selected.has(fingerprint)) selected.set(fingerprint, { orderId, text: item.text });
    }
    return [...selected.values()];
  }

  function parseOrder(candidate) {
    const money = candidate.text.match(MONEY);
    const status = STATUS_TERMS.find(term => candidate.text.includes(term)) || null;
    return {
      orderId: candidate.orderId,
      orderStatus: status,
      observedAmount: money ? Number(money[1].replace(/,/g, "")) : null,
      currency: "THB",
      amountMeaning: "UNVERIFIED_VISIBLE_AMOUNT",
      validationStatus: "NEEDS_REVIEW"
    };
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type !== "FIREKEEPER_EXTRACT_VISIBLE_ORDERS") return;
    try {
      const orders = candidateBlocks().map(parseOrder);
      sendResponse({
        ok: true,
        payload: {
          schemaVersion: "firekeeper-commerce-orders.v1",
          platform: "shopee",
          source: "browser_visible_dom",
          extraction: {
            pageUrl: location.origin + location.pathname,
            extractedAt: new Date().toISOString(),
            userInitiated: true
          },
          scope: "visible_current_page_only",
          orders
        }
      });
    } catch (_error) {
      sendResponse({ ok: false, error: "อ่านข้อมูลไม่สำเร็จ กรุณาลองใหม่หรือเปลี่ยนหน้า" });
    }
    return true;
  });
})();