# CrashGuard 🚨
### Real-Time Vehicle Crash Detection & Rescue Notification System
**B-Tech IoT Project | Arduino/ESP32 + MPU6050 + GPS + SIM800L GSM**

---

## Overview

CrashGuard is a mobile application that pairs with an IoT hardware module to provide real-time crash detection and emergency SOS alerts. When an impact is detected above a configured G-force threshold, the app triggers a 30-second countdown. If not cancelled by the driver, it automatically sends SOS notifications to emergency contacts.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 54 + expo-router |
| Language | TypeScript |
| Database | Firebase Realtime Database |
| Maps | react-native-maps (Google Maps) |
| Notifications | expo-notifications |
| Animation | react-native-reanimated |
| Storage | AsyncStorage |

---

## App Screens

| Screen | Route | Description |
|--------|-------|-------------|
| Dashboard | `/` | Live device status, G-force, battery, GPS & GSM |
| Alert | `/alert` | Full-screen crash alert with countdown timer |
| History | `/history` | All past crash events with outcome color codes |
| Live Map | `/map` | Full-screen GPS map with dark theme |
| Settings | `/settings` | Contacts, threshold, countdown, mock mode |

---

## Firebase Realtime DB Schema

```
/device
  /status
    online: boolean
    lastSeen: timestamp
    gpsFix: boolean
    gsmSignal: number (0–4)
    gforce: number
    battery: number
  /gps
    lat: number
    lon: number
    updatedAt: timestamp
  /config
    threshold: number      (default: 2.5)
    countdown: number      (default: 30)
  /contacts: ["+91XXXXXXXXXX", ...]
  /crashEvent
    active: boolean
    gforce: number
    lat: number
    lon: number
    triggeredAt: timestamp
  /cancelAlert: boolean

/events/{eventId}
  timestamp: string (ISO)
  gforce: number
  lat: number
  lon: number
  outcome: "sos_sent" | "cancelled" | "normal"
```

---

## Setup Instructions

### 1. Clone / Copy Project

```bash
cd your-project-folder
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project → Enable **Realtime Database**
3. Set database rules (for development):
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
4. Go to Project Settings → Add Web App → Copy config
5. Edit the `.env` file in the project root:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Maps SDK for Android**
3. Create an API key and add it to `.env`

### 5. Run on Expo Go (Development)

```bash
npm start
# Scan QR with Expo Go app on Android
```

> ⚠️ Note: `react-native-maps` requires a dev build to work fully. Use the APK build for production testing.

---

## Building the APK

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Login to Expo

```bash
eas login
```

### Link Project (run once)

```bash
eas init
```
> This generates a project ID — copy it and paste into `app.json` → `extra.eas.projectId`

### Build APK (Free, No Play Store Needed)

```bash
npm run build:apk
```

This triggers a cloud build on Expo's servers. Takes ~10–15 minutes.

### Download & Install

After the build completes, EAS provides a download link. Install the `.apk` file directly on your Android phone.

### Production Release APK

```bash
npm run build:apk:release
```

---

## Hardware Integration (ESP32/Arduino)

The hardware module writes data to Firebase via WiFi. Example Arduino code (pseudocode):

```cpp
// Write to Firebase path /device/status
FirebaseJson json;
json.set("online", true);
json.set("lastSeen", millis());
json.set("gpsFix", gps.location.isValid());
json.set("gsmSignal", getGSMSignal());
json.set("gforce", mpu.getAccelMagnitude());
json.set("battery", getBatteryPercent());
Firebase.RTDB.setJSON(&fbdo, "/device/status", &json);

// Trigger crash event
if (gforce > threshold) {
  FirebaseJson crashJson;
  crashJson.set("active", true);
  crashJson.set("gforce", gforce);
  crashJson.set("lat", gps.location.lat());
  crashJson.set("lon", gps.location.lng());
  crashJson.set("triggeredAt", millis());
  Firebase.RTDB.setJSON(&fbdo, "/device/crashEvent", &crashJson);
}
```

---

## Demo / Mock Mode

Enable **Demo Mode** in Settings to simulate crash events every 30 seconds without real hardware. Useful for presentations and testing.

---

## Project Structure

```
crashguard/
├── app/
│   ├── _layout.tsx          # Root layout + Firebase listener + notification setup
│   ├── alert.tsx            # Full-screen crash alert modal
│   └── (tabs)/
│       ├── _layout.tsx      # Bottom tab navigator
│       ├── index.tsx        # Dashboard screen
│       ├── history.tsx      # Event log screen
│       ├── map.tsx          # Live map screen
│       └── settings.tsx     # Settings screen
├── components/
│   ├── StatusCard.tsx       # Reusable status card
│   ├── CountdownRing.tsx    # Animated SVG countdown
│   ├── ContactItem.tsx      # Contact row with edit/delete
│   └── EventCard.tsx        # History event card
├── hooks/
│   ├── useFirebase.ts       # All Firebase helpers & listeners
│   └── useCrashAlert.ts     # Crash detection + navigation
├── constants/
│   ├── colors.ts            # App color tokens
│   └── firebaseConfig.ts    # Firebase initialization
├── assets/                  # Icons & images
├── app.json                 # Expo config
├── eas.json                 # EAS build profiles
├── babel.config.js
├── metro.config.js
├── tsconfig.json
└── .env                     # Environment variables (DO NOT COMMIT)
```

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0f0f0f` | App background |
| Card | `#1a1a1a` | Card backgrounds |
| Primary | `#E24B4A` | Crash red, alerts |
| Safe | `#4CAF50` | Safe status, OK |
| Warning | `#EF9F27` | Amber / caution |

---

## License

MIT — Free for educational and academic use.

---

*CrashGuard — Keeping roads safer with IoT & AI-assisted detection.*
