#!/bin/bash

# ======================================================
# Saved Outfits API 測試腳本
# ======================================================
# 使用方式：bash test-api.sh
# ======================================================

API_URL="http://localhost:3000/api/saved-outfits"
TEST_USER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"

echo "======================================================="
echo "📋 Saved Outfits API 測試"
echo "======================================================="
echo ""

# ======================================================
# 測試 1: POST - 儲存新穿搭
# ======================================================
echo "🔵 測試 1: 儲存新穿搭"
echo "---"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "outfitData": {
      "imageUrl": "https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400",
      "styleName": "測試穿搭 - Casual Comfort",
      "description": "測試用的休閒穿搭",
      "heroImageUrl": "https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400",
      "items": [
        {
          "id": "test-item-1",
          "name": "白色T恤",
          "imageUrl": "https://example.com/tshirt.jpg"
        },
        {
          "id": "test-item-2",
          "name": "牛仔褲",
          "imageUrl": "https://example.com/jeans.jpg"
        }
      ]
    },
    "weather": {
      "temp_c": 25,
      "condition": "Clear",
      "description": "晴朗",
      "humidity": 60,
      "feels_like": 26,
      "locationName": "台北市"
    },
    "occasion": "casual",
    "outfitType": "saved",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 2: POST - 重複儲存（應該返回 200）
# ======================================================
echo "🔵 測試 2: 重複儲存相同穿搭（應該返回 200）"
echo "---"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "outfitData": {
      "imageUrl": "https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400",
      "styleName": "測試穿搭 - Casual Comfort",
      "description": "測試用的休閒穿搭",
      "heroImageUrl": "https://images.unsplash.com/photo-1762343287340-8aa94082e98b?w=400"
    },
    "occasion": "casual",
    "outfitType": "saved"
  }' \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 3: POST - 缺少必要欄位（應該返回 400）
# ======================================================
echo "🔵 測試 3: 缺少必要欄位（應該返回 400 錯誤）"
echo "---"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "outfitData": {
      "description": "沒有 imageUrl 和 styleName"
    }
  }' \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 4: GET - 取得所有穿搭
# ======================================================
echo "🔵 測試 4: 取得使用者的所有穿搭"
echo "---"

curl -X GET "$API_URL?userId=$TEST_USER_ID&outfitType=saved&limit=10" \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 5: GET - 缺少 userId（應該返回 400）
# ======================================================
echo "🔵 測試 5: 缺少 userId（應該返回 400 錯誤）"
echo "---"

curl -X GET "$API_URL?limit=10" \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 6: POST - 儲存第二套穿搭（不同的 styleName）
# ======================================================
echo "🔵 測試 6: 儲存第二套穿搭"
echo "---"

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$TEST_USER_ID'",
    "outfitData": {
      "imageUrl": "https://images.unsplash.com/photo-1704775990327-90f7c43436fc?w=400",
      "styleName": "測試穿搭 - Business Elegant",
      "description": "測試用的商務穿搭",
      "heroImageUrl": "https://images.unsplash.com/photo-1704775990327-90f7c43436fc?w=400",
      "items": [
        {
          "id": "test-item-3",
          "name": "襯衫",
          "imageUrl": "https://example.com/shirt.jpg"
        },
        {
          "id": "test-item-4",
          "name": "西裝褲",
          "imageUrl": "https://example.com/pants.jpg"
        }
      ]
    },
    "weather": {
      "temp_c": 22,
      "condition": "Cloudy",
      "description": "多雲",
      "humidity": 70,
      "feels_like": 23,
      "locationName": "台北市"
    },
    "occasion": "work",
    "outfitType": "saved",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }' \
  | jq '.'

echo ""
echo ""

# ======================================================
# 測試 7: GET - 根據場合篩選
# ======================================================
echo "🔵 測試 7: 根據場合篩選（occasion=work）"
echo "---"

curl -X GET "$API_URL?userId=$TEST_USER_ID&outfitType=saved&occasion=work" \
  | jq '.'

echo ""
echo "======================================================="
echo "✅ 測試完成"
echo "======================================================="
