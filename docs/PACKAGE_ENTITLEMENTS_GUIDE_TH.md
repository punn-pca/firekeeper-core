# คู่มือการตั้งค่าสิทธิ์ตามแพ็กเกจ FIREKEEPER

## ไฟล์ที่เกี่ยวข้อง

| งาน | ไฟล์ |
|---|---|
| สิทธิ์และขีดจำกัดจริง | `src/config/plans.ts` |
| ข้อความหน้าแรก | `src/components/LandingPage.tsx` |
| หน้ารายละเอียดแพ็กเกจ | `src/components/PlansPage.tsx` |
| สิทธิ์ Admin | `src/server/middleware/auth.ts` |
| ราคาและ Checkout | `src/server.ts` และ `STRIPE_PRICE_*` |

`src/config/plans.ts` คือแหล่งกำหนดสิทธิ์หลัก การแก้ข้อความหน้าเว็บอย่างเดียวไม่เปลี่ยนสิทธิ์จริง

## ค่าที่กำหนดต่อแพ็กเกจ

```ts
{
  id,
  name,
  monthlyPriceThb,
  dailyAnalysisLimit,
  maxMembers,
  retentionDays,
  features
}
```

- `dailyAnalysisLimit`: จำนวนการวิเคราะห์ต่อวัน; `null` = Fair Use
- `maxMembers`: จำนวนสมาชิกสูงสุด
- `retentionDays`: ระยะเวลาเก็บข้อมูล
- `features`: รายการฟีเจอร์ที่เปิดใช้

## สิทธิ์มาตรฐาน

| แพ็กเกจ | ราคา | วิเคราะห์/วัน | สมาชิก | เก็บข้อมูล | ฟีเจอร์เด่น |
|---|---:|---:|---:|---:|---|
| Free | ฟรี | 20 | 1 | 7 วัน | วิเคราะห์พื้นฐาน, Evidence, Audit เบื้องต้น |
| Starter | 490 บาท/เดือน | Fair Use | 1 | 30 วัน | BYOK, หลายโมเดล, Export |
| Professional | 990 บาท/เดือน | Fair Use | 1 | 365 วัน | ประวัติระยะยาว, Export ขั้นสูง |
| Team | 4,900 บาท/เดือน | Fair Use | 5 | 90 วัน | Workspace, Approval Workflow |
| Business | 19,000 บาท/เดือน | Fair Use | 20 | 365 วัน | Admin Policy, Governance Dashboard |
| Enterprise | ติดต่อทีมขาย | Fair Use | ไม่จำกัด | ตามสัญญา | SSO, SIEM, API, กฎเฉพาะองค์กร |

## Feature Key

```text
basic_analysis, byok, multi_model, evidence_lineage,
audit_log, long_term_history, advanced_export, workspace,
approval_workflow, admin_policy, sso, siem, api_access
```

## วิธีแก้สิทธิ์

เพิ่มหรือลบ Feature ใน `features` ของแพ็กเกจ เช่น:

```ts
features: [
  ...common,
  'byok',
  'multi_model',
  'audit_log',
  'approval_workflow'
]
```

จำกัดจำนวนการวิเคราะห์ด้วย:

```ts
dailyAnalysisLimit: 20
```

อย่าเพิ่ม Feature Key ใหม่โดยไม่เพิ่มจุดตรวจสิทธิ์ใน API และหน้าเว็บ

## Admin สำหรับทดสอบ

ตั้งค่าที่ `src/server/middleware/auth.ts` โดยใช้ UID, Email ที่ยืนยันแล้ว หรือ Cloud Run variable:

```text
ADMIN_UID=<Firebase UID>
```

Admin ได้สิทธิ์เทียบเท่า Enterprise โดยไม่ต้องชำระเงิน การตรวจที่ Server เป็นตัวตัดสินจริง

ห้ามเปิด `OFFLINE_ONLY=true` หรือ `OFFLINE_MODE=true` บน Production เพราะผู้ใช้ทุกคนอาจได้สิทธิ์ทดสอบ

## เมื่อเปลี่ยนราคา/ชื่อแพ็กเกจ

แก้ให้ตรงกันที่:

1. `src/config/plans.ts`
2. `src/components/LandingPage.tsx`
3. `src/components/PlansPage.tsx`
4. Stripe Price ID และ `STRIPE_PRICE_*` หากเป็นแพ็กเกจชำระเงิน

ห้ามใช้ Price ID ของ Test Mode กับ Live Mode หรือคนละ Stripe Account

## Checklist ก่อน Deploy

- [ ] สิทธิ์ใน `plans.ts` ตรงกับข้อความโฆษณา
- [ ] API ตรวจสิทธิ์จาก Server ไม่เชื่อ Client
- [ ] Free ถูกจำกัดตามโควตา
- [ ] Team/Business จำกัดจำนวนสมาชิก
- [ ] Approval และ Admin Policy จำกัดตามแพ็กเกจ
- [ ] Admin ทดสอบได้ แต่ผู้ใช้ทั่วไปไม่ได้สิทธิ์
- [ ] Stripe Price ID อยู่ในโหมดเดียวกับระบบ
- [ ] ทดสอบ Checkout และ Webhook
- [ ] ออกจากระบบและเข้าสู่ระบบใหม่หลัง Deploy

## หลักการ

สิทธิ์จริงใน Server → ข้อความบนหน้าเว็บ → ราคาและสถานะใน Stripe ต้องตรงกันทั้งหมด
