#!/bin/bash

# Campus Eats - Bundle Build Script (Advanced)
# Purpose: Build release bundle and test with bundletool on emulator
# Usage: ./android/scripts/build-bundle.sh

set -e

echo "🏗️  Campus Eats - Bundle Build (Advanced)"
echo "=========================================="
echo ""

# Navigate to android directory
cd "$(dirname "$0")/.."

echo "📦 Cleaning previous builds..."
./gradlew clean

echo ""
echo "🔨 Building release bundle..."
./gradlew bundleRelease

echo ""
BUNDLE_PATH="app/build/outputs/bundle/release/app-release.aab"

if [ ! -f "$BUNDLE_PATH" ]; then
    echo "❌ Bundle not found at $BUNDLE_PATH"
    exit 1
fi

BUNDLE_SIZE=$(du -h "$BUNDLE_PATH" | cut -f1)
echo "✅ Bundle created successfully!"
echo "📍 Bundle Location: $BUNDLE_PATH"
echo "📊 Bundle Size: $BUNDLE_SIZE"
echo ""

# Check if bundletool is available
if command -v bundletool &> /dev/null; then
    echo "🔧 bundletool found! Generating universal APK..."
    
    APKS_PATH="app/build/outputs/bundle/release/app.apks"
    
    bundletool build-apks \
        --bundle="$BUNDLE_PATH" \
        --output="$APKS_PATH" \
        --mode=universal \
        --overwrite
    
    echo ""
    echo "📲 Installing on emulator/device..."
    bundletool install-apks --apks="$APKS_PATH"
    
    echo ""
    echo "🚀 Launching Campus Eats..."
    adb shell am start -n com.campuseats/.MainActivity
    
    echo ""
    echo "✅ Bundle installed successfully!"
else
    echo "⚠️  bundletool not found!"
    echo ""
    echo "📚 Installation options:"
    echo ""
    echo "Option 1 - Download JAR (Recommended):"
    echo "  wget https://github.com/google/bundletool/releases/latest/download/bundletool-all.jar"
    echo "  alias bundletool='java -jar ./bundletool-all.jar'"
    echo ""
    echo "Option 2 - Install via Homebrew (macOS):"
    echo "  brew install bundletool"
    echo ""
    echo "Then run this script again."
    echo ""
    echo "📦 Bundle ready at: $BUNDLE_PATH"
fi

echo ""
echo "💡 Note: Bundles (.aab) are for Play Store submission"
echo "   Use bundletool only for testing bundle behavior on emulator"
