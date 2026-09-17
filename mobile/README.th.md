# FIRE KEEPER Android Mobile Application (ฉบับภาษาไทย)

**ภาษาไทย** | [English Version](README.md)

แอปพลิเคชันมือถืออย่างเป็นทางการสำหรับระบบ **FIRE KEEPER — Executive Decision Intelligence & AI Governance Platform** ([firekeeper.site](https://firekeeper.site)) พัฒนาขึ้นเพื่อนำพลังของ **PUNN Predictive Cognitive Architecture (PCA v3.0)** มาสู่สมาร์ทโฟนระบบปฏิบัติการ Android อย่างเต็มประสิทธิภาพ

---

## 1. สถาปัตยกรรมและฟีเจอร์สำคัญ (Architecture & Features)

- **100% Web Parity (ความสมบูรณ์แบบเทียบเท่าหน้าเว็บ):**
  - ทำงานผ่าน Native Android WebView ประสิทธิภาพสูง พร้อมเปิดใช้งาน Hardware Acceleration
  - รองรับฟังก์ชันการวิเคราะห์การตัดสินใจแบบ 12 ขั้นตอน (12-Stage PCA Pipeline), การตรวจสอบหลักฐาน (Evidence Trace), และการคำนวณความน่าเชื่อถืออย่างครบถ้วน
- **ระบบยืนยันตัวตนในตัวแอป (In-App Native OAuth Dialog):**
  - พัฒนาระบบ `onCreateWindow` บน Native WebChromeClient ของ Android ให้เปิดหน้าต่าง Popup แบบ In-App Dialog โดยตรง
  - รองรับการเข้าสู่ระบบด้วย Google (Google Sign-In) ภายในแอปพลิเคชัน โดยไม่เด้งออกไปยังเบราว์เซอร์ภายนอก และสามารถส่ง Firebase Auth Token กลับเข้าสู่ระบบได้ 100%
- **แถบเมนูนำทางแบบตรึงด้านบน (Sticky Minimal Header):**
  - ตรึงเฉพาะแถบเมนูด้านบน (โลโก้เปลวไฟ, เมนู Drawer, ปุ่มแชร์, และโปรไฟล์ผู้ใช้)
  - เนื้อหาการสนทนาและการวิเคราะห์สามารถเลื่อนได้อย่างเป็นธรรมชาติ ไม่มีการบังเนื้อหา
- **รองรับแถบสถานะของเครื่องอย่างสมบูรณ์ (Native Status Bar):**
  - แถบสถานะด้านบนใช้สี `#060a16` กลมกลืนกับธีมของระบบ
  - แสดงผลนาฬิกาเครื่อง, แบตเตอรี่, สัญญาณ Wi-Fi/5G สีขาวคมชัด ไม่ทับซ้อนกับเนื้อหา
- **ระบบป้องกันคีย์บอร์ดบังช่องพิมพ์ (Smart Keyboard Avoidance):**
  - กำหนดค่า `android:windowSoftInputMode="adjustResize"` ร่วมกับ `StatusBar.translucent = false` เพื่อให้ Android OS ย่อขนาดหน้าต่างแอปอัตโนมัติเมื่อคีย์บอร์ดเปิดขึ้น
  - รองรับการเลื่อนตำแหน่งช่องพิมพ์ให้อยู่กึ่งกลางหน้าจอ (`scrollIntoView({ block: 'center' })`) แบบ Multi-Delay คลุมช่วงเวลาแอนิเมชันของคีย์บอร์ดทุกรุ่น
  - เชื่อมต่อ `window.visualViewport` เพื่อปรับขนาดหน้าจอตามคีย์บอร์ดเสมือนแบบเรียลไทม์
- **ระบบพิมพ์ลื่นไหล ไร้การกระตุก (Typing Latency Optimization):**
  - ปรับปรุงการบันทึกแบบร่าง (Draft Prompt) ด้วยเทคนิค Debounce (400ms) ป้องกันการเขียน `localStorage` ซ้ำๆ ทุกตัวอักษรบน UI Thread
  - รองรับ CSS `touch-manipulation` ลดดีเลย์การสัมผัสบนหน้าจอสัมผัส
- **รองรับการทำงานทั้งโหมดออนไลน์และออฟไลน์ (Offline & Local Bundle):**
  - เมื่อไม่มีสัญญาณอินเทอร์เน็ต แอปพลิเคชันสามารถสลับไปใช้งานไฟล์ Web Bundle ภายในเครื่อง (`file:///android_asset/web/index.html`) ได้ทันที

---

## 2. โครงสร้างโฟลเดอร์ (Directory Structure)

```text
mobile/
├── android/                   # โปรเจกต์ Native Android Studio (Gradle, Kotlin/Java, Manifest)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/        # JavaScript Bundle (index.android.bundle) และ Web Assets (web/)
│   │   │   ├── java/          # Native Activity และ WebChromeClient (MainActivity.kt, In-App Popup)
│   │   │   └── AndroidManifest.xml # กำหนดสิทธิ์ Permission และ windowSoftInputMode
│   │   └── build.gradle       # การตั้งค่าบิลด์ของ Native Module
│   └── build.gradle           # การตั้งค่าโปรเจกต์ระดับ Root
├── assets/                    # รูปภาพไอคอนแอป, สแปลชสกรีน, และโลโก้
├── src/
│   ├── screens/
│   │   └── WebFirekeeperScreen.tsx # หน้าจอหลักที่ควบคุม WebView, Keyboard, Status Bar, และ Auth
│   ├── components/            # คอมโพเนนต์เสริม
│   └── api/                   # ตัวเชื่อมต่อ API ภายในแอป
├── App.tsx                    # จุดเริ่มต้นระดับบนสุดของ React Native
├── app.json                   # การตั้งค่าโปรเจกต์ Expo
├── package.json               # Dependencies และ Scripts ของฝั่ง Mobile
├── serve-apk.js               # เซิร์ฟเวอร์ Node.js สำหรับแจกจ่าย APK ภายในระบบ
├── README.md                  # เอกสารคู่มือฉบับภาษาอังกฤษ
└── README.th.md               # เอกสารคู่มือฉบับภาษาไทย (ไฟล์นี้)
```

---

## 3. สิ่งที่จำเป็นต้องมีสำหรับสภาพแวดล้อมการพัฒนา (Prerequisites)

- **Node.js:** เวอร์ชัน 20.x ขึ้นไป
- **Java Development Kit (JDK):** เวอร์ชัน 17 (แนะนำ OpenJDK หรือ Android Studio Embedded JBR)
- **Android Studio & Android SDK:**
  - Android SDK Platform 34 (API Level 34)
  - Android SDK Build-Tools 34.0.0 หรือใหม่กว่า
  - Android NDK (หากจำเป็นต้องคอมไพล์ C++ modules)
- **ตัวแปรสภาพแวดล้อม (Environment Variables):**
  - `ANDROID_HOME`: ชี้ไปยังโฟลเดอร์ Android SDK (เช่น `C:\Users\<User>\AppData\Local\Android\Sdk`)
  - `JAVA_HOME`: ชี้ไปยังโฟลเดอร์ JDK 17 (เช่น `C:\Program Files\Android\Android Studio\jbr`)

---

## 4. ขั้นตอนการติดตั้งและคอมไพล์ APK (Build Instructions)

### ขั้นตอนที่ 1: ติดตั้ง Dependencies
```bash
cd mobile
npm install
```

### ขั้นตอนที่ 2: สร้างและซิงค์ Web Assets (จากโปรเจกต์หลัก)
หากมีการแก้ไขไฟล์ฝั่งเว็บ (`src/` ของโปรเจกต์หลัก) ให้รันบิลด์ก่อน:
```bash
# จาก root ของ firekeeper-core
npm run build

# คัดลอกผลลัพธ์ dist ไปยัง assets ของ mobile
rm -rf mobile/android/app/src/main/assets/web/*
cp -r dist/* mobile/android/app/src/main/assets/web/
```

### ขั้นตอนที่ 3: Export Embedded JavaScript Bundle
สร้างไฟล์ `index.android.bundle` สำหรับ React Native:
```bash
npx expo export:embed --platform android --dev false --entry-file index.ts --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

### ขั้นตอนที่ 4: คอมไพล์ Standalone Debug APK
```bash
cd android
./gradlew assembleDebug
```
เมื่อคอมไพล์สำเร็จ ไฟล์ติดตั้ง APK จะอยู่ที่:
```text
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 5. การแจกจ่ายและติดตั้ง APK (Distribution & Installation)

1. **ดาวน์โหลดผ่าน GitHub Releases:**
   - ไฟล์ติดตั้งอย่างเป็นทางการเผยแพร่อยู่ที่ [GitHub Releases: v1.0.0-mobile](https://github.com/punn-pca/firekeeper-core/releases/tag/v1.0.0-mobile)
   - ไฟล์: `firekeeper-standalone.apk` (~171 MB)
2. **รันเซิร์ฟเวอร์ดาวน์โหลดภายในเครื่อง (Local Server):**
   ```bash
   node serve-apk.js
   ```
   ตัวเซิร์ฟเวอร์จะเปิดพอร์ต `8080` พร้อมหน้าเว็บดาวน์โหลดที่แสดงขนาดไฟล์และคำแนะนำการติดตั้ง
3. **การเปิดให้ดาวน์โหลดผ่านอินเทอร์เน็ตสาธารณะ (Cloudflare Tunnel):**
   ```bash
   cloudflared tunnel --url http://localhost:8080
   ```

---

## 6. คำแนะนำการติดตั้งบนอุปกรณ์ Android

1. เมื่อดาวน์โหลดไฟล์ `.apk` แล้ว ระบบอาจแสดงข้อความเตือนความปลอดภัย ให้เลือก **"ดาวน์โหลดต่อไป" (Download anyway)**
2. แตะเปิดไฟล์เพื่อทำการ **"ติดตั้ง" (Install)**
3. หากระบบแจ้งเตือนว่าไม่สามารถติดตั้งแอปจากแหล่งที่ไม่รู้จักได้ ให้เข้าไปที่การตั้งค่าแล้วเปิด **"อนุญาตจากแหล่งที่มานี้" (Allow from this source)**
4. เมื่อติดตั้งเสร็จ สามารถเปิดแอปพลิเคชันและเริ่มใช้งานได้ทันที
