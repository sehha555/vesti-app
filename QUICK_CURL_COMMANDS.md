# Daily Outfit Plans API - 快速 Curl 命令清單

## 📌 環境變數設定（.env 或命令列）

在執行任何命令前，先設定以下環境變數：

```bash
# 基本配置（必填）
export BASE_URL="http://localhost:3003"
export SUPABASE_URL="https://your-project.supabase.co"
export ANON_KEY="your-anon-key"
export TEST_DATE="2025-12-26"

# 測試帳號（必填，必須先在 Supabase 建立且確認電子郵件）
export USER_A_EMAIL="a@test.com"
export USER_A_PASSWORD="Passw0rd!"
export USER_B_EMAIL="b@test.com"
export USER_B_PASSWORD="Passw0rd!"
```

**驗證環境變數已設定：**
```bash
echo "BASE_URL: $BASE_URL"
echo "SUPABASE_URL: $SUPABASE_URL"
echo "TEST_DATE: $TEST_DATE"
```

---

## 步驟 0: 啟動開發伺服器

```bash
# 在一個終端視窗中執行
cd apps/web
npm run dev
# 確認運行在 http://localhost:3003
```

---

## 步驟 0.5: 登入並獲取 JWT Token

### 獲取 User A 的 JWT Token

通過 Supabase auth API 進行密碼登入：

```bash
curl -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${USER_A_EMAIL}\",
    \"password\": \"${USER_A_PASSWORD}\"
  }"
```

完整範例（包含提取 token）：

```bash
# 一行命令：取得 User A token 並保存到環境變數
export USER_A_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${USER_A_PASSWORD}\"}" \
  | jq -r '.access_token')

# 驗證 token（應顯示長字串）
echo "User A Token: ${USER_A_TOKEN:0:50}..."
```

### 獲取 User B 的 JWT Token

同樣的方式登入 User B：

```bash
export USER_B_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_B_EMAIL}\",\"password\":\"${USER_B_PASSWORD}\"}" \
  | jq -r '.access_token')

# 驗證 token
echo "User B Token: ${USER_B_TOKEN:0:50}..."
```

### 一鍵取得兩個 Token

複製整段到終端執行：

```bash
# 取得 User A Token
echo "正在登入 User A..."
export USER_A_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${USER_A_PASSWORD}\"}" \
  | jq -r '.access_token')
echo "✅ User A Token 已取得"

# 取得 User B Token
echo "正在登入 User B..."
export USER_B_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_B_EMAIL}\",\"password\":\"${USER_B_PASSWORD}\"}" \
  | jq -r '.access_token')
echo "✅ User B Token 已取得"

# 驗證兩個 token
echo ""
echo "驗證 Token："
echo "User A: ${USER_A_TOKEN:0:30}..."
echo "User B: ${USER_B_TOKEN:0:30}..."
```

---

## 如何使用 JWT Token 呼叫 API

所有 API 呼叫都需要在 Header 中帶入 token：

```bash
curl -X GET/POST \
  "${BASE_URL}/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{ ... }'
```

**重點：**
- Token 有效期通常 1 小時
- 若遇到 401，表示 token 已過期，需重新登入
- Token 是 JWT 格式（可在 jwt.io 解碼查看內容）

---

## Test 1️⃣: 未登入不可存取（應返回 401）

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X GET \
  "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}"

# 預期輸出：
# {"ok":false,"message":"Unauthorized"}
# HTTP Status: 401
```

---

## Test 2️⃣: User A 保存計畫（應返回 200）

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${BASE_URL}/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'${TEST_DATE}'",
    "outfitId": 1,
    "layoutSlots": {
      "top_inner": {
        "item_id": "t1",
        "name": "白T恤",
        "imageUrl": "https://example.com/t1.jpg"
      },
      "bottom": {
        "item_id": "b1",
        "name": "牛仔褲",
        "imageUrl": "https://example.com/b1.jpg"
      }
    },
    "occasion": "work",
    "weather": {
      "tempC": 18,
      "condition": "rain"
    }
  }' | jq .

# 預期輸出：
# {
#   "ok": true,
#   "saved": true
# }
# HTTP Status: 200
```

---

## Test 3️⃣: User A 讀取自己的計畫（應返回 200 + 資料）

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X GET \
  "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" | jq .

# 預期輸出：
# {
#   "ok": true,
#   "date": "2025-12-26",
#   "outfits": [
#     {
#       "outfitId": 1,
#       "layoutSlots": { ... }
#     }
#   ]
# }
# HTTP Status: 200
```

---

## Test 4️⃣: User B 無法讀取 User A 的計畫（應返回 200 + 空陣列）

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X GET \
  "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}" \
  -H "Authorization: Bearer ${USER_B_TOKEN}" | jq .

# 預期輸出：
# {
#   "ok": true,
#   "date": "2025-12-26",
#   "outfits": []  # ← 空陣列（RLS 防護）
# }
# HTTP Status: 200

# ❌ 錯誤的輸出（RLS 失敗）：
# {
#   "ok": true,
#   "date": "2025-12-26",
#   "outfits": [
#     {
#       "outfitId": 1,  # ← 不應該看到 User A 的數據！
#       ...
#     }
#   ]
# }
```

---

## Test 5️⃣: 重複選定更新記錄（應返回 200，無重複）

### Step A: User A 再次選定不同的 outfit

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  "${BASE_URL}/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "'${TEST_DATE}'",
    "outfitId": 2,
    "layoutSlots": {
      "top_inner": {
        "item_id": "t2",
        "name": "黑色上衣",
        "imageUrl": "https://example.com/t2.jpg"
      },
      "bottom": {
        "item_id": "b2",
        "name": "運動褲",
        "imageUrl": "https://example.com/b2.jpg"
      }
    },
    "occasion": "casual",
    "weather": {
      "tempC": 20,
      "condition": "sunny"
    }
  }' | jq .

# 預期輸出：
# {
#   "ok": true,
#   "saved": true
# }
# HTTP Status: 200
```

### Step B: 驗證只有一筆記錄被更新

```bash
curl -w "\nHTTP Status: %{http_code}\n" \
  -X GET \
  "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" | jq .

# 預期輸出：
# {
#   "ok": true,
#   "date": "2025-12-26",
#   "outfits": [
#     {
#       "outfitId": 2,  # ← 已更新（不是 1+2 = 2筆記錄）
#       "layoutSlots": { ... }
#     }
#   ]
# }
# HTTP Status: 200
```

---

## 🛠️ 輔助命令

### 檢查 Supabase RLS 配置（SQL Editor）

在 Supabase Console → SQL Editor 執行：

```sql
-- 檢查表是否存在且 RLS 啟用
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'daily_outfit_plans';

-- 檢查 RLS 政策
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'daily_outfit_plans'
ORDER BY policyname;

-- 檢查唯一約束
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'daily_outfit_plans';

-- 查看 daily_outfit_plans 中的所有記錄（admin 用）
SELECT * FROM public.daily_outfit_plans;

-- 查看特定日期的記錄
SELECT * FROM public.daily_outfit_plans
WHERE date = '2025-12-26'
ORDER BY created_at DESC;
```

### 模擬 User A 查詢（使用 RLS）

```sql
-- 以 user_A 的身份查詢（模擬 RLS）
-- 注意：需在 Supabase 使用 authenticated 角色

SELECT * FROM public.daily_outfit_plans
WHERE auth.uid() = user_id
AND date = '2025-12-26';
```

### 清空測試數據（開發環境用）

```sql
-- ⚠️ 警告：此操作會刪除所有測試數據
DELETE FROM public.daily_outfit_plans;

-- 或只刪除特定日期
DELETE FROM public.daily_outfit_plans
WHERE date = '2025-12-26';
```

---

## 📝 快速複製粘貼指南

### 一鍵設定環境變數

```bash
# 複製整段到終端
export BASE_URL="http://localhost:3003"
export SUPABASE_URL="https://your-project.supabase.co"
export ANON_KEY="your-anon-key"
export TEST_DATE="2025-12-26"
export USER_A_EMAIL="a@test.com"
export USER_A_PASSWORD="Passw0rd!"
export USER_B_EMAIL="b@test.com"
export USER_B_PASSWORD="Passw0rd!"

# 驗證環境變數已設定
echo $BASE_URL
```

### 一鍵取得兩個 Token

```bash
# 取得 User A Token
export USER_A_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${USER_A_PASSWORD}\"}" | jq -r '.access_token')

# 取得 User B Token
export USER_B_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_B_EMAIL}\",\"password\":\"${USER_B_PASSWORD}\"}" | jq -r '.access_token')

# 驗證 Token（應顯示長字串）
echo "User A Token: ${USER_A_TOKEN:0:50}..."
echo "User B Token: ${USER_B_TOKEN:0:50}..."
```

---

## 🎯 快速驗證程序（複製全部執行）

```bash
#!/bin/bash

# 設定環境變數
export BASE_URL="http://localhost:3003"
export SUPABASE_URL="https://your-project.supabase.co"
export TEST_DATE="2025-12-26"
export USER_A_EMAIL="a@test.com"
export USER_A_PASSWORD="Passw0rd!"

# 取得 Token
export USER_A_TOKEN=$(curl -s -X POST \
  "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${USER_A_EMAIL}\",\"password\":\"${USER_A_PASSWORD}\"}" | jq -r '.access_token')

echo "✓ User A Token 已取得"

# Test 1: 未登入（應 401）
echo ""
echo "Test 1: 未登入查詢..."
curl -s "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}" | jq .

# Test 2: 保存計畫（應 200）
echo ""
echo "Test 2: User A 保存計畫..."
curl -s -X POST "${BASE_URL}/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"date":"'${TEST_DATE}'","outfitId":1,"layoutSlots":{},"occasion":"work"}' | jq .

# Test 3: 讀取自己的計畫（應 200 + 資料）
echo ""
echo "Test 3: User A 讀取自己的計畫..."
curl -s "${BASE_URL}/api/reco/daily-outfits/save?date=${TEST_DATE}" \
  -H "Authorization: Bearer ${USER_A_TOKEN}" | jq .

echo ""
echo "✅ 驗證完成！檢查上面的輸出是否符合預期。"
```

---

## ❓ 常見問題

**Q: Token 顯示 invalid_grant**
A: 檢查帳號密碼是否正確，帳號是否已確認電子郵件

**Q: 收到 "Unauthorized" (401)**
A: Token 可能已過期（有效期 1 小時），重新取得新 Token

**Q: User B 仍能看到 User A 的數據**
A: RLS 政策未正確應用，檢查 SQL Editor 中的政策設定

**Q: curl 命令太長不想複製**
A: 改用 `Postman`、`Insomnia` 或前端 JavaScript 測試

---

**最後更新**：2025-12-26
