#!/bin/bash

# Campus Eats - Debug Build Script
# Purpose: Build and install debug APK on emulator/device
# Usage: ./android/scripts/build-debug.sh

set -e

echo "🏗️  Campus Eats - Debug Build"
echo "================================"
echo ""

# Navigate to android directory
cd "$(dirname "$0")/.."

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building debug APK..."
./gradlew assembleDebug

echo ""
echo "📲 Installing on emulator/device..."
./gradlew installDebug

echo ""
echo "🚀 Launching Campus Eats..."
adb shell am start -n com.campuseats/.MainActivity

echo ""
echo "✅ Debug build complete!"
echo ""

# Show APK location and size
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "📍 APK Location: $APK_PATH"
    echo "📊 APK Size: $APK_SIZE"
else
    echo "⚠️  APK not found at expected location"
fi

echo ""
echo "💡 Tip: Use 'adb logcat' to view app logs"
