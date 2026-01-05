---
description: Build and run debug APK on Android emulator
---

# Android Debug Build Workflow

Use this workflow for daily development and testing on the Android emulator.

## Prerequisites

1. Ensure Android emulator is running:
```bash
adb devices
```

2. Ensure Metro bundler is running (in separate terminal):
```bash
npm start
```

## Quick Build (Recommended)

// turbo
1. Build and install debug APK using React Native CLI:
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile
npm run android:debug
```

## Full Gradle Build

// turbo
2. Build using Gradle wrapper script (includes clean):
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile
npm run android:debug:gradle
```

## Manual Steps (Alternative)

3. If you prefer manual control:
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile/android
./gradlew clean
./gradlew assembleDebug
./gradlew installDebug
adb shell am start -n com.campuseats/.MainActivity
```

## Troubleshooting

**App not launching?**
```bash
adb logcat | grep -i campuseats
```

**Build errors?**
```bash
cd android
./gradlew clean
cd ..
npm run android:debug
```

**Metro bundler issues?**
```bash
npm start -- --reset-cache
```
