# Campus Eats - Android Build Guide

Complete guide for building and testing the Campus Eats Android app in debug and release modes.

---

## 🚀 Quick Start

**For daily development (emulator):**
```bash
npm run android:debug
```

**For device testing (real device):**
```bash
npm run android:release
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Clean build artifacts:**
```bash
npm run android:clean
```

---

## 📱 Build Types Explained

### Debug Build
- **Target**: Android Emulator or Device
- **Purpose**: Daily development and testing
- **Characteristics**:
  - No code minification
  - Debuggable
  - Faster build times
  - Metro bundler required for hot reload
  - Larger APK size (~50-80MB)

### Release Build
- **Target**: Real Android Device ONLY
- **Purpose**: Production testing before deployment
- **Characteristics**:
  - ProGuard minification enabled
  - Not debuggable
  - Optimized for performance
  - Self-contained bundle
  - Smaller APK size (~15-25MB)
  - Requires signing key

### Bundle Build (Advanced)
- **Target**: Play Store Submission
- **Purpose**: Official app distribution
- **Format**: `.aab` (Android App Bundle)
- **Note**: Google Play generates optimized APKs from bundles

---

## 🛠️ Debug Builds (Emulator)

### Method 1: React Native CLI (Recommended)

**Start Metro bundler:**
```bash
npm start
```

**In another terminal, build and run:**
```bash
npm run android:debug
```

This is the standard React Native development workflow with hot reloading.

### Method 2: Gradle Wrapper Script

**Build, install, and launch:**
```bash
npm run android:debug:gradle
```

This uses the custom build script at `android/scripts/build-debug.sh` which:
- Cleans previous builds
- Builds debug APK
- Installs on emulator/device
- Launches the app
- Shows APK location and size

### Method 3: Manual Gradle Commands

```bash
cd android

# Clean previous builds
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Install on device/emulator
./gradlew installDebug

# Launch app
adb shell am start -n com.campuseats/.MainActivity
```

**Debug APK location:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📦 Release Builds (Real Device)

### Prerequisites

1. **Connect a real Android device** via USB
2. Enable **USB Debugging** on device (Settings → Developer Options)
3. Verify connection:
```bash
adb devices
# Should show: <device-id>    device
```

### Build Process

**Build release APK:**
```bash
npm run android:release
```

This uses `android/scripts/build-release.sh` which:
- Cleans previous builds
- Builds release APK with ProGuard optimizations
- Shows APK location, size, and installation instructions

**Release APK location:**
```
android/app/build/outputs/apk/release/app-release.apk
```

### Installation

**Option 1: Direct install via ADB**
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Option 2: Transfer to device**
```bash
# Copy to device storage
adb push android/app/build/outputs/apk/release/app-release.apk /sdcard/Download/

# Then manually install from device's file manager
```

**Option 3: Share via other means**
- Email the APK to yourself
- Upload to Google Drive
- Transfer via USB cable

### Launch App

```bash
adb shell am start -n com.campuseats/.MainActivity
```

### ⚠️ Important: Release Build Constraints

**DO NOT install release APKs on emulators!** Here's why:

1. **Architecture mismatch**: Release builds are configured for `arm64-v8a` (real device architecture)
2. **Emulators use**: `x86` or `x86_64` architecture
3. **Result**: Installation fails or crashes on launch

**The Android tooling rule:**
- ✅ Emulator → Debug builds only
- ✅ Real device → Release builds preferred (debug also works)
- ❌ Emulator → Release builds (will fail)

---

## 🎯 Bundle Builds (Advanced/Play Store)

### When to use bundles

- **Submitting to Google Play Store** (required)
- **Testing bundle behavior** before Play Store submission
- **Optimized distribution** (Play generates device-specific APKs)

### Build Bundle

**Create release bundle:**
```bash
npm run android:bundle
```

Or manually:
```bash
cd android
./gradlew bundleRelease
```

**Bundle location:**
```
android/app/build/outputs/bundle/release/app-release.aab
```

### Testing Bundles with bundletool

To test your bundle on an emulator (simulating Play Store behavior):

**Install bundletool:**
```bash
# Option 1: Homebrew (macOS)
brew install bundletool

# Option 2: Download JAR
wget https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar
alias bundletool='java -jar ./bundletool-all.jar'
```

**Generate universal APK from bundle:**
```bash
bundletool build-apks \
  --bundle=android/app/build/outputs/bundle/release/app-release.aab \
  --output=app.apks \
  --mode=universal
```

**Install on emulator:**
```bash
bundletool install-apks --apks=app.apks
```

---

## 🧹 Clean Builds

**Clean all build artifacts:**
```bash
npm run android:clean
```

**Deep clean (nuclear option):**
```bash
cd android
./gradlew clean
rm -rf .gradle
rm -rf app/build
cd ..
rm -rf node_modules
npm install
```

---

## 🔧 Troubleshooting

### Build Errors

**Gradle daemon issues:**
```bash
cd android
./gradlew --stop
./gradlew clean
cd ..
npm run android:debug
```

**Metro bundler cache issues:**
```bash
npm start -- --reset-cache
```

**Node modules issues:**
```bash
rm -rf node_modules
npm install
```

### Installation Errors

**"INSTALL_FAILED_UPDATE_INCOMPATIBLE":**
```bash
# Uninstall existing app first
adb uninstall com.campuseats

# Then reinstall
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Device not detected:**
```bash
# Check connection
adb devices

# Restart ADB server
adb kill-server
adb start-server
adb devices
```

**"Install from unknown sources" required:**
- Go to device Settings → Security
- Enable "Install from unknown sources" or "Install unknown apps"

### Runtime Errors

**App crashes on release build:**
- Check ProGuard rules in `android/app/proguard-rules.pro`
- View crash logs:
```bash
adb logcat | grep -E "CampusEats|AndroidRuntime"
```

**JavaScript errors:**
```bash
# Enable remote debugging
adb reverse tcp:8081 tcp:8081

# View Metro bundler logs
npm start
```

**Native crashes:**
```bash
# Full logcat output
adb logcat > crash.log

# Filter for errors
adb logcat *:E
```

---

## 📋 Build Configuration

### Current Setup

- **Package ID**: `com.campuseats`
- **Version**: `1.0` (versionCode: 1)
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Architecture**: `arm64-v8a` (release builds)
- **ProGuard**: Enabled for release
- **Signing**: Debug keystore (replace for production)

### Key Files

- `android/app/build.gradle` - Build configuration
- `android/app/proguard-rules.pro` - ProGuard rules
- `android/app/debug.keystore` - Debug signing key
- `android/gradle.properties` - Gradle properties
- `android/scripts/` - Custom build scripts

---

## 🎓 Workflow Recommendations

### Daily Development
1. Start emulator
2. Run `npm start` (Metro bundler)
3. Run `npm run android:debug`
4. Make changes → Hot reload automatically

### Before Committing
1. Run `npm run lint`
2. Run `npm test`
3. Test release build on real device
4. Verify no ProGuard issues

### Pre-Release Testing
1. Build release APK: `npm run android:release`
2. Test on multiple real devices
3. Check for crashes and performance issues
4. Verify all features work correctly

### Play Store Submission
1. Update version in `android/app/build.gradle`
2. Generate release bundle: `./gradlew bundleRelease`
3. Test bundle using bundletool (optional)
4. Sign with production key
5. Upload to Play Console

---

## 🚢 Production Deployment Checklist

Before releasing to Play Store:

- [ ] Update `versionCode` and `versionName` in `build.gradle`
- [ ] Replace debug keystore with production signing key
- [ ] Update ProGuard rules if needed
- [ ] Test release build thoroughly on real devices
- [ ] Prepare store listing (screenshots, description, etc.)
- [ ] Build release bundle: `./gradlew bundleRelease`
- [ ] Upload to Play Console
- [ ] Submit for review

---

## 📚 Additional Resources

- [React Native Android Docs](https://reactnative.dev/docs/environment-setup)
- [Android Gradle Plugin](https://developer.android.com/build)
- [ProGuard Rules](https://www.guardsquare.com/manual/configuration/usage)
- [bundletool Documentation](https://developer.android.com/tools/bundletool)
- [Play Console Help](https://support.google.com/googleplay/android-developer)

---

## 💡 Quick Reference

| Task | Command |
|------|---------|
| Debug build (emulator) | `npm run android:debug` |
| Debug build (Gradle) | `npm run android:debug:gradle` |
| Release build (device) | `npm run android:release` |
| Bundle build (Play Store) | `npm run android:bundle` |
| Clean builds | `npm run android:clean` |
| View connected devices | `adb devices` |
| Install APK | `adb install -r path/to/app.apk` |
| Uninstall app | `adb uninstall com.campuseats` |
| View logs | `adb logcat \| grep CampusEats` |
| Start Metro | `npm start` |

---

**Remember**: 
- 🟢 Emulators = DEBUG only
- 🔴 Real devices = RELEASE preferred
- 📦 Play Store = BUNDLE required

Happy building! 🚀
