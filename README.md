# Daily To-Do & Productivity Tracker Mobile Application

A complete, offline-first, professional mobile application developed with **React Native** and **Expo**. Designed for consistency, habit tracking, and in-depth historical productivity analytics.

---

## 📱 Features Overview

- **Offline-First Architecture**: No backend, cloud database, or external APIs. 100% of user tasks, daily occurrences, analytics, and settings remain on the device.
- **First-Time Access Gate**: Secure personal gate requiring the required passcode (`SatyamMishraToDoApp2026`). Once unlocked, credentials are saved securely in **Expo SecureStore**, with an optional **App Lock** toggle in Settings.
- **Dynamic Home Dashboard**: Live greeting, date, circular SVG progress dial, real-time pending & overdue task counts, and Quick Add task action.
- **Complete Task CRUD**: Manage tasks with categories (`Personal`, `Education`, `Work`, `Health & Fitness`, `Other`), priorities (`Low`, `Medium`, `High`), custom times, and descriptions.
- **Daily Recurring Task System**: Independent daily occurrences for recurring tasks (`daily`, `weekdays`, `weekly`, `custom weekdays`). Historical records and streak data are preserved across calendar days and app restarts.
- **Smart Local Notifications**: Native Android notification channels, task-specific reminders scheduled at exact times, automatic cancellation upon completion, and configurable daily summary alerts.
- **Productivity Analytics & Interactive Graphs**:
  - **Line Graph**: Daily completion rate % with 7-day, 30-day, and 90-day views. Tap points for detailed inspection.
  - **Bar Graph**: Completed vs. Pending volume comparison across days and weeks.
  - **Dot Graph**: Habit consistency heatmap grid with 30-day and 90-day views.
  - **Streaks & Metrics**: Current streak, all-time record streak, most/least productive weekday, and average completion rate.
- **Task History**: Calendar day navigation to audit past performance without data disappearing at midnight.
- **Backup & Settings**: Dynamic Light/Dark/System theme switching, JSON/CSV export and import with native sharing, and database reset.

---

## 🛠 Technology Stack

- **Framework**: React Native 0.88
- **Environment**: Expo SDK 58
- **Language**: JavaScript (ES6+)
- **Database**: `expo-sqlite` (WAL mode, Foreign Keys, atomic transactions)
- **Local Notifications**: `expo-notifications` (Android channels, offline triggers)
- **Credential Storage**: `expo-secure-store`
- **Navigation**: `@react-navigation/native` & `@react-navigation/bottom-tabs`
- **Charts & Graphs**: `react-native-svg` (zero-dependency interactive vector charts)
- **Icons**: `@expo/vector-icons` (Feather, MaterialCommunityIcons)
- **Export / Sharing**: `expo-file-system`, `expo-sharing`, `expo-document-picker`

---

## 🔐 First-Time Login System

When launched for the first time, the application presents the Access Gate.
- **Required Code**: `SatyamMishraToDoApp2026`
- On successful validation, authentication is persisted in `Expo SecureStore`. Subsequent launches navigate directly to the dashboard.
- An optional **App Lock** feature can be activated in **Settings** to require passcode entry whenever the app is reopened.

---

## 🚀 Getting Started & Installation

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **npm** or **yarn**
- **Expo Go** application on your Android phone, or Android Studio Emulator

### 2. Install Dependencies
```bash
cd ToDoApp
npm install
```

### 3. Start Development Server
```bash
npx expo start
```
- Press `a` to launch directly in an Android Emulator or connected device via USB.
- Or scan the displayed QR code with the **Expo Go** app on your Android device.

---

## 📦 Generating an Installable Android APK

### Option A: Cloud Build with EAS (Recommended, No Android Studio needed)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to your Expo account:
   ```bash
   eas login
   ```
3. Configure the build profile:
   ```bash
   eas build:configure
   ```
4. Build a standalone Android APK:
   ```bash
   eas build --platform android --profile preview
   ```
   EAS will generate a direct download link for the `.apk` file that can be installed directly on any Android device.

### Option B: Local Android Build (Requires Android Studio & JDK 17)
1. Generate the native Android project:
   ```bash
   npx expo prebuild --platform android
   ```
2. Build the debug or release APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```
3. The generated APK will be located at:
   `android/app/build/outputs/apk/release/app-release.apk`

