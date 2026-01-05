#!/bin/bash

# Campus Eats - Release Build Script
# Purpose: Build release APK for device testing
# Usage: ./android/scripts/build-release.sh

set -e

echo "🏗️  Campus Eats - Release Build"
echo "================================"
echo ""

# Navigate to android directory
cd "$(dirname "$0")/.."

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building release APK..."
./gradlew assembleRelease

echo ""
echo "✅ Release build complete!"
echo ""

# Show APK location and size
APK_PATH="app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo "📍 APK Location: $APK_PATH"
    echo "📊 APK Size: $APK_SIZE"
    echo ""
    echo "📱 Installation Instructions:"
    echo "   1. Transfer APK to a REAL device (not emulator)"
    echo "   2. Install using: adb install -r $APK_PATH"
    echo "   3. Or copy to device and install manually"
    echo ""
    echo "⚠️  IMPORTANT: Release APKs are for REAL DEVICES only!"
    echo "   Do NOT install on emulator (missing ABIs)"
else
    echo "⚠️  APK not found at expected location"
fi

echo ""
echo "💡 Next Steps:"
echo "   • Test on a real Android device"
echo "   • For Play Store: Use './gradlew bundleRelease' instead"
