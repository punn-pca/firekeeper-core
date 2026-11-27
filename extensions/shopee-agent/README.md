# FIREKEEPER Shopee Local Agent

Status: experimental MVP (visible-page extraction only).

## Install in Chrome

1. Download or clone this repository.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Select **Load unpacked** and choose this directory.
5. Open and sign in to Shopee Seller Centre yourself.
6. Navigate to the order list, then open the FIREKEEPER extension and choose **คัดลอกรายการที่มองเห็น**.
7. Review the result and choose **ดาวน์โหลด JSON**.
8. In FIREKEEPER, open **คำสั่งซื้อ Shopee** from the navigation drawer or visit `/shopee`.
9. Select the exported JSON and choose **นำเข้า FIREKEEPER**. The server stores the records only under the signed-in user's account.

## Scope and safety

- Runs only on `https://seller.shopee.co.th/*`.
- Extraction is user-initiated and limited to visible DOM content on the current page.
- It does not read passwords, OTPs, cookies, local storage, hidden application state, or private network endpoints.
- It does not click order actions, modify orders, bypass CAPTCHA, or automate login.
- It deliberately omits buyer names, addresses, phone numbers, and chat contents.
- It does not claim complete extraction. Unknown or ambiguous fields are marked for review.
- Pagination is manual in this MVP: navigate to the next Seller Centre page and extract again.
- The JSON export is local. Automatic upload into FIREKEEPER Core is not enabled until the authenticated Workspace import endpoint and UI are implemented and tested.

## Known limitations

Shopee changes its Seller Centre markup. The extractor uses conservative visible-text heuristics and may return zero or partial records when the page structure changes. Validate exported records against the Seller Centre before using them for business decisions.

## Development

This folder is a standalone Manifest V3 extension and does not add dependencies to the FIREKEEPER Core runtime. No PCA stages, governance rules, or existing Core services are modified.


## FIREKEEPER import
The Core import endpoint accepts only the versioned visible-page export schema, requires a non-guest authenticated account, validates each order, limits imports to 100 records per request, and stores records under `users/{uid}/commerce_orders`. Repeated imports use deterministic user-scoped document keys. Amounts remain unverified and must not be treated as settled revenue.
