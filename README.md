# FocusTimerX

> A minimalist, calm, and reliable cross-platform focus timer with real-time multi-device synchronization, daily goals, and streaks.

[![Live Website](https://img.shields.io/badge/Web_App-Live_Online-emerald?style=for-the-badge&logo=googlechrome)](https://xmrcrypt1c.github.io/FocusTimerX/)
[![Download Android APK](https://img.shields.io/badge/Android_APK-1--Click_Download-rose?style=for-the-badge&logo=android)](https://github.com/xMrCrypt1c/FocusTimerX/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages_Deployed-blue?style=for-the-badge&logo=github)](https://xmrcrypt1c.github.io/FocusTimerX/)

### 🚀 Quick Links
- 🌐 **Live Web Application**: [https://xmrcrypt1c.github.io/FocusTimerX/](https://xmrcrypt1c.github.io/FocusTimerX/)
- 📱 **Download Android APK**: [https://github.com/xMrCrypt1c/FocusTimerX/releases](https://github.com/xMrCrypt1c/FocusTimerX/releases)

---

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4.
- **PWA**: `vite-plugin-pwa` with automatic service worker registration, offline caching, and Web App Manifest.
- **Cross-Platform Sync**: Cloud Firestore real-time listeners (`onSnapshot`) with timestamp-based clock calculation (`targetEndTimestamp - Date.now()`). Timers never drift or stop in background tabs or locked mobile screens.
- **Authentication**: Firebase Authentication with Google Sign-In and seamless anonymous fallback.
- **Audio & Haptics**: Procedural Solfeggio 528Hz bell tone synthesized with Web Audio API (zero audio download latency or missing assets).
- **Mobile Hardware**: Screen Wake Lock API to keep phone displays awake during deep focus sessions.

---

## 1. Firebase Configuration

The app is already pre-configured with Cloud Firestore and Authentication via `firebase-applet-config.json`.

If you wish to deploy with your own custom Firebase project:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** in production mode.
3. Enable **Authentication** with the **Google** and **Anonymous** sign-in providers.
4. Replace the values in `firebase-applet-config.json` (or `.env`):
   ```json
   {
     "projectId": "your-project-id",
     "appId": "your-app-id",
     "apiKey": "your-api-key",
     "authDomain": "your-project-id.firebaseapp.com",
     "firestoreDatabaseId": "(default)",
     "storageBucket": "your-project-id.firebasestorage.app",
     "messagingSenderId": "your-sender-id"
   }
   ```
5. Deploy the security rules using the Firebase CLI:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 2. Deploying to Firebase Hosting

You can deploy FocusTimerX with free SSL and worldwide CDN via Firebase Hosting:

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Login to Firebase**:
   ```bash
   firebase login
   ```
3. **Build the production bundle**:
   ```bash
   npm run build
   ```
4. **Deploy**:
   ```bash
   firebase deploy --only hosting
   ```

Your app will be live at `https://<your-project-id>.web.app`.

---

## 3. Installing the PWA on Android & Desktop

FocusTimerX fulfills all Progressive Web App criteria (Manifest, Service Worker, maskable icons, offline support).

### On Android (Chrome / Edge / Brave):
1. Navigate to the deployed app URL in Google Chrome on your Android device.
2. An **"Install App"** button will appear in the top bar. Tap it.
3. Alternatively, tap the browser menu (three dots in upper right) and tap **"Install app"** or **"Add to Home screen"**.
4. FocusTimerX will install as a standalone app with its own home screen icon, splash screen, and full-screen window without browser bars.

### On Desktop (Chrome / Edge):
1. Look for the install badge in the browser URL bar or click the **"Install App"** button in the header.
2. FocusTimerX opens in its own window and docks to your taskbar/dock.

### On iOS (Safari):
1. Open the app in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.

---

## 4. Wrapping with Capacitor for Native Android APK

FocusTimerX is structured to be wrapped with [Capacitor](https://capacitorjs.com/) to build a native Android APK:

### Step 1: Install Capacitor dependencies
```bash
npm install @capacitor/core
npm install -D @capacitor/cli @capacitor/android
```

### Step 2: Initialize Capacitor
```bash
npx cap init FocusTimerX com.focustimerx.app --web-dir=dist
```

### Step 3: Add Android Platform
```bash
npm run build
npx cap add android
```

### Step 4: Configure `capacitor.config.json`
```json
{
  "appId": "com.focustimerx.app",
  "appName": "FocusTimerX",
  "webDir": "dist",
  "server": {
    "androidScheme": "https"
  }
}
```

### Step 5: Sync Assets & Open in Android Studio
```bash
npm run build
npx cap sync android
npx cap open android
```

### Step 6: Build Signed APK / AAB in Android Studio
1. In Android Studio, select **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
2. Or configure a signing key under **Build > Generate Signed Bundle / APK** for Google Play distribution.

---

## Timer Precision & Multi-Device Sync

FocusTimerX uses **Timestamp Target Invariance**:
- Rather than a ticking countdown, Firestore records:
  - `targetEndTimestamp`: Scheduled finish time in epoch milliseconds.
  - `status`: `'idle' | 'running' | 'paused'`.
  - `remainingMs`: Preserved duration when paused.
- Every connected device computes the displayed clock as `targetEndTimestamp - Date.now()`.
- If you start a 25-minute timer on your laptop, opening your Android phone instantly shows the exact synchronized second remaining without any drift or lag.

---

## License
Apache-2.0
