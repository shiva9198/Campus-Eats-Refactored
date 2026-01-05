---
description: Build release APK and install on physical Android device
---

# Android Release Build Workflow

Use this workflow for testing the production-ready release build on a real Android device.

## Prerequisites

1. Connect a physical Android device via USB
2. Enable USB debugging on device
3. Verify connection:
```bash
adb devices
```

## Build Release APK

// turbo
1. Build the release APK:
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile
npm run android:release
```

## Install on Device

2. After build completes, install on connected device:
```bash
cd /Users/shiva/Documents/github_projects/Campus-Eats-Clone/mobile/android
adb install -r app/build/outputs/apk/release/app-release.apk
```

3. Launch the app manually on device or use:
```bash
adb shell am start -n com.campuseats/.MainActivity
```

## Transfer APK to Device

Alternative: Transfer APK file to device storage and install manually:

```bash
# Copy to device
adb push app/build/outputs/apk/release/app-release.apk /sdcard/Download/

# Then install using device's file manager
```

## Important Notes

⚠️ **DO NOT install release APKs on emulators** - they are built for real device architectures only (arm64-v8a).

✅ **Release builds include:**
- ProGuard code minification
- Production optimizations
- Real performance characteristics

## Troubleshooting

**APK not installing?**
- Make sure device has "Install from unknown sources" enabled
- Uninstall previous version: `adb uninstall com.campuseats`

**Crash on launch?**
- Check ProGuard rules in `android/app/proguard-rules.pro`
- View crash logs: `adb logcat | grep -i campuseats`
