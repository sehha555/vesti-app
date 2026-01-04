# Daily Outfit Plans API 手動驗證指南

## 📋 環境準備

### 1. 建立測試帳號（Supabase Console）
進入 Supabase Dashboard → Authentication → Users
```
User A:
  Email: a@test.com
  Password: Passw0rd!
  Status: Confirmed (勾選 Email confirmed)

User B:
  Email: b@test.com
  Password: Passw0rd!
  Status: Confirmed (勾選 Email confirmed)
```

### 2. 設定環境變數
在專案根目錄建立 `.env.test.local`:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# 測試伺服器
TEST_BASE_URL="http://localhost:3003"

# 測試帳號
USER_A_EMAIL="a@test.com"
USER_A_PASSWORD="Passw0rd!"
USER_B_EMAIL="b@test.com"
USER_B_PASSWORD="Passw0rd!"

# 測試日期
TEST_DATE="2025-12-26"
```

### 3. 啟動開發伺服器
```bash
npm run dev
# 或
cd apps/web && npm run dev
```

確認服務器運行在 http://localhost:3003

---

## 🧪 Test 1: 未登入不可存取

### 方式 A: 使用 curl
```bash
curl -X GET \
  "http://localhost:3003/api/reco/daily-outfits/save?date=2025-12-26" \
  -H "Content-Type: application/json"
```

### 預期結果
```json
HTTP/1.1 401 Unauthorized
{
  "ok": false,
  "message": "Unauthorized"
}
```

### 驗證檢查
- [x] HTTP Status = 401
- [x] 無法獲得任何用戶的穿搭計畫

---

## 🧪 Test 2: User A 登入並保存計畫

### Step 1: 獲取 User A 的 access token

#### 方式 A: 使用 curl
```bash
curl -X POST \
  "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "a@test.com",
    "password": "Passw0rd!"
  }'
```

#### 方式 B: 使用 JavaScript/Node.js
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'a@test.com',
  password: 'Passw0rd!'
});

const accessToken = data.session.access_token;
console.log('User A Token:', accessToken);
```

**取得的 token 格式：**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "...": "..."
}
```

### Step 2: 使用 token 保存穿搭計畫

#### 方式 A: 使用 curl
```bash
curl -X POST \
  "http://localhost:3003/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer YOUR_USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-26",
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
  }'
```

#### 方式 B: 使用 JavaScript/Fetch
```javascript
const response = await fetch('http://localhost:3003/api/reco/daily-outfits/save', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    date: '2025-12-26',
    outfitId: 1,
    layoutSlots: { /* ... */ },
    occasion: 'work',
    weather: { tempC: 18, condition: 'rain' }
  })
});

const result = await response.json();
console.log(result); // { ok: true, saved: true }
```

### 預期結果
```json
HTTP/1.1 200 OK
{
  "ok": true,
  "saved": true
}
```

### 驗證檢查
- [x] HTTP Status = 200
- [x] Response 包含 `"ok": true`
- [x] 檢查 Supabase Console → daily_outfit_plans 表，應有新記錄：
  ```
  user_id: <user_A_uuid>
  date: 2025-12-26
  outfit_id: 1
  layout_slots: { "top_inner": {...}, "bottom": {...} }
  ```

---

## 🧪 Test 3: User A 讀取自己的計畫

### 使用 curl
```bash
curl -X GET \
  "http://localhost:3003/api/reco/daily-outfits/save?date=2025-12-26" \
  -H "Authorization: Bearer YOUR_USER_A_TOKEN" \
  -H "Content-Type: application/json"
```

### 預期結果
```json
HTTP/1.1 200 OK
{
  "ok": true,
  "date": "2025-12-26",
  "outfits": [
    {
      "outfitId": 1,
      "layoutSlots": {
        "top_inner": { "item_id": "t1", "name": "白T恤", ... },
        "bottom": { "item_id": "b1", "name": "牛仔褲", ... }
      }
    }
  ]
}
```

### 驗證檢查
- [x] HTTP Status = 200
- [x] Response 包含 `"outfits"` 陣列且長度 > 0
- [x] `outfitId` = 1（與保存時相同）
- [x] `layoutSlots` 完整

---

## 🧪 Test 4: User B 無法讀取 User A 的計畫（RLS 防護）

### Step 1: 獲取 User B 的 access token

同 Test 2 Step 1，但使用：
```bash
curl -X POST \
  "https://your-project.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "b@test.com",
    "password": "Passw0rd!"
  }'
```

### Step 2: User B 嘗試查詢 2025-12-26 的計畫

```bash
curl -X GET \
  "http://localhost:3003/api/reco/daily-outfits/save?date=2025-12-26" \
  -H "Authorization: Bearer YOUR_USER_B_TOKEN" \
  -H "Content-Type: application/json"
```

### 預期結果
```json
HTTP/1.1 200 OK
{
  "ok": true,
  "date": "2025-12-26",
  "outfits": []  // ← 空陣列（User B 沒有該日期的計畫）
}
```

### 驗證檢查
- [x] HTTP Status = 200
- [x] Response 包含空 `"outfits": []`
- [x] **不得** 返回 User A 的數據（outfitId: 1）
- [x] RLS 政策正確防護了跨用戶存取

### 如果看到 User A 的數據，表示 RLS 失敗！
```javascript
// ❌ 錯誤的回應（RLS 防護失敗）
{
  "ok": true,
  "date": "2025-12-26",
  "outfits": [
    {
      "outfitId": 1,  // ← 這不應該在這裡！
      "layoutSlots": { ... }
    }
  ]
}
```

---

## 🧪 Test 5: 同一天重複選定會 Upsert 更新

### Step 1: User A 再次為 2025-12-26 選定不同的 outfit

```bash
curl -X POST \
  "http://localhost:3003/api/reco/daily-outfits/save" \
  -H "Authorization: Bearer YOUR_USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-12-26",
    "outfitId": 2,  # ← 改為 2
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
    "weather": { "tempC": 20, "condition": "sunny" }
  }'
```

### 預期結果
```json
HTTP/1.1 200 OK
{
  "ok": true,
  "saved": true
}
```

### Step 2: 驗證只有一筆記錄被更新

再次查詢相同日期：
```bash
curl -X GET \
  "http://localhost:3003/api/reco/daily-outfits/save?date=2025-12-26" \
  -H "Authorization: Bearer YOUR_USER_A_TOKEN"
```

### 預期結果
```json
{
  "ok": true,
  "date": "2025-12-26",
  "outfits": [
    {
      "outfitId": 2,  # ← 已更新為 2（不是 1+2=2筆記錄）
      "layoutSlots": {
        "top_inner": { "item_id": "t2", ... },
        "bottom": { "item_id": "b2", ... }
      }
    }
  ]
}
```

### 驗證檢查
- [x] HTTP Status = 200
- [x] `outfits` 陣列長度 = 1（只有一筆）
- [x] `outfitId` = 2（已更新）
- [x] 檢查 Supabase Console → daily_outfit_plans 表：
  ```
  應該只有一筆 (user_A_uuid, 2025-12-26, outfit_id=2)
  沒有重複記錄
  ```

---

## 🔍 故障排查

### 問題 1: 401 Unauthorized 無法取得 token

**原因可能：**
- 帳號未確認電子郵件
- 密碼錯誤
- Supabase URL 或 ANON_KEY 錯誤

**解決方案：**
1. 在 Supabase Console 驗證帳號是否存在且 Email confirmed
2. 確認環境變數 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 手動在 Console 重新發送確認郵件

### 問題 2: User B 仍能看到 User A 的數據（RLS 失敗）

**原因可能：**
- RLS 政策未正確應用
- SELECT 政策的 USING 條件錯誤

**檢查方式（SQL Editor）：**
```sql
-- 檢查 RLS 是否啟用
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'daily_outfit_plans';

-- 應回傳：rowsecurity = true

-- 檢查政策
SELECT policyname, qual, with_check
FROM pg_policies
WHERE tablename = 'daily_outfit_plans';

-- 應看到 4 個政策，USING 條件都是 "auth.uid() = user_id"
```

### 問題 3: Upsert 產生重複記錄

**原因可能：**
- `onConflict: 'user_id,date'` 設定不正確
- 資料庫的 UNIQUE 約束未建立

**檢查方式（SQL Editor）：**
```sql
-- 檢查唯一約束
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'daily_outfit_plans';

-- 應包含 UNIQUE(user_id, date)
```

### 問題 4: 觀察到 RLS 拒絕錯誤

**預期錯誤（表示 RLS 正常工作）：**
```
error code: "42501"
message: "new row violates row-level security policy"
```

此時 API 應回傳：
```json
{ "ok": false, "message": "無法保存穿搭計畫" }
```

---

## 📊 測試結果記錄

複製此表格記錄測試結果：

| Test # | 項目 | 預期 | 實際 | 狀態 | 備註 |
|--------|------|------|------|------|------|
| 1 | 未登入查詢 | 401 | | ⬜ | |
| 2 | User A 保存 | 200 | | ⬜ | |
| 3 | User A 讀取 | 200 + 資料 | | ⬜ | |
| 4 | User B 隔離 | 200 + 空 | | ⬜ | |
| 5 | Upsert | 單筆記錄 | | ⬜ | |

---

## ✅ 完整驗證檢查清單

- [ ] 所有 5 個測試均通過
- [ ] User B 無法看到 User A 的數據
- [ ] 重複選定無重複記錄
- [ ] API 回應時間 < 500ms
- [ ] 沒有 SQL 錯誤在 Supabase logs
- [ ] RLS 政策在 SQL Editor 中可見

---

## 💡 參考資源

- Supabase RLS 文檔：https://supabase.com/docs/guides/auth/row-level-security
- PostgreSQL 錯誤代碼：https://www.postgresql.org/docs/current/errcodes-appendix.html
  - 42501 = insufficient_privilege

---

**驗證完成日期**：___________
**驗證人員**：___________
**所有測試**：✅ 通過 / ❌ 失敗
