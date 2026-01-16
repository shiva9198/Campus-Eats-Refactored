#!/bin/bash

# Script to automatically fetch ngrok URL and update mobile config

echo "Fetching ngrok URL from API..."

# Fetch ngrok URL from local API
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Error: Could not fetch ngrok URL. Is ngrok running?"
    echo "Start ngrok with: ngrok http 8000"
    exit 1
fi

echo "✅ Found ngrok URL: $NGROK_URL"

# Update mobile config
CONFIG_FILE="mobile/src/config.ts"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Error: Config file not found at $CONFIG_FILE"
    exit 1
fi

# Backup original
cp "$CONFIG_FILE" "${CONFIG_FILE}.backup"

# Update the PROD_API_URL line
sed -i.tmp "s|const PROD_API_URL = 'https://[^']*';|const PROD_API_URL = '$NGROK_URL';|g" "$CONFIG_FILE"
rm "${CONFIG_FILE}.tmp"

echo "✅ Updated $CONFIG_FILE with new URL"

# Show the change
echo ""
echo "Updated line:"
grep "PROD_API_URL" "$CONFIG_FILE"

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "Next steps:"
echo "1. Rebuild APK: cd mobile/android && ./gradlew assembleRelease"
echo "2. APK will be at: mobile/android/app/build/outputs/apk/release/"
