#!/bin/bash
BASE_URL="http://localhost:8000"

echo "1. Authenticating as Admin..."
TOKEN_RESP=$(curl -s -X POST "$BASE_URL/token" -H "Content-Type: application/x-www-form-urlencoded" -d "username=admin&password=admin123")
TOKEN=$(echo $TOKEN_RESP | grep -o '"access_token": "[^"]*' | cut -d'"' -f4)
echo "Token: $TOKEN"

if [ -z "$TOKEN" ]; then
    echo "❌ Auth Failed"
    exit 1
fi

echo -e "\n2. Testing Image Upload..."
# Create a dummy image file
echo "fake image content" > test_image.png
UPLOAD_RESP=$(curl -s -X POST "$BASE_URL/upload/image" -F "file=@test_image.png")
echo "Upload Resp: $UPLOAD_RESP"

if [[ $UPLOAD_RESP == *"url"* ]]; then
    echo "✅ Upload Success"
else
    echo "❌ Upload Failed"
fi
rm test_image.png

echo -e "\n3. Testing Settings (Shop Status)..."
# Save Setting
curl -s -X POST "$BASE_URL/admin/settings" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"key": "shop_status", "value": "closed", "category": "shop"}'
echo ""
# Get Settings
GET_SETTINGS=$(curl -s -X GET "$BASE_URL/admin/settings" -H "Authorization: Bearer $TOKEN")
echo "Settings: $GET_SETTINGS"

if [[ $GET_SETTINGS == *"closed"* ]]; then
    echo "✅ Settings Persistence Success"
else
    echo "❌ Settings Failed"
fi

echo -e "\n4. Testing Stats..."
STATS=$(curl -s -X GET "$BASE_URL/admin/stats" -H "Authorization: Bearer $TOKEN")
echo "Stats: $STATS"

if [[ $STATS == *"counts"* ]]; then
    echo "✅ Stats Success"
else
    echo "❌ Stats Failed"
fi

echo -e "\n✅ Verification Complete"
