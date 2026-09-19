# FIRE KEEPER Android Mobile App

Official mobile application for **FIRE KEEPER — Executive Decision Intelligence & AI Governance Platform** ([firekeeper.site](https://firekeeper.site)).

---

## Architecture & Features
- **100% Web Parity:** High-performance Android WebView rendering the full PUNN Predictive Cognitive Architecture (PCA v3.0) frontend.
- **In-App Native OAuth Dialog:** Custom `onCreateWindow` handler in native Android WebChromeClient supporting Google Sign-In popups in-app without opening external browsers.
- **Sticky Menu Navigation:** Header menu (Flame logo, drawer, share, user profile) is pinned at the top under the system clock.
- **Native Status Bar:** Seamless `#060a16` status bar with safe-area insets keeping phone clock, battery, and 5G indicators clear and unobscured.
- **Camera & File Uploads:** Full Android permissions for document and image attachments.

---

## Directory Structure
```
mobile/
├── android/          # Native Android Studio project (Gradle, Kotlin/Java, Manifest)
├── assets/           # App icons, splash screens, logos
├── src/
│   ├── screens/      # WebFirekeeperScreen, ChatScreen, HomeScreen, etc.
│   ├── components/   # Native modals and helper components
│   └── api/          # Base API client
├── App.tsx           # Main application root
├── app.json          # Expo project configuration
└── package.json      # Mobile dependencies
```

---

## Development & Build Instructions

### Prerequisites
- Node.js 20+
- Java Development Kit (JDK 17)
- Android Studio with Android SDK 34 / Build-Tools

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Export Embedded Bundle
```bash
npx expo export:embed --entry-file index.ts --platform android --dev false --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
```

### 3. Build Standalone Debug APK
```bash
cd android
./gradlew assembleDebug
```
The output APK will be generated at:
`android/app/build/outputs/apk/debug/app-debug.apk`
