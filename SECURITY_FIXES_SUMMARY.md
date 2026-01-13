# 🔐 RPC Security Audit Fixes - Summary

## ✅ 修正完成

### 新增 3 個 Migrations（執行順序）

#### 1️⃣ `20260113_001_add_schema_columns_to_saved_outfits.sql`
**改動**:
- ✅ 添加 `season` VARCHAR(50) 欄位（可選）
- ✅ 添加 `source` VARCHAR(50) 欄位，默認 'daily'（用於穿搭來源追蹤）
- ✅ 添加 `notes` TEXT 欄位（用戶註記）
- ✅ 建立 3 個索引: `season`, `source`, `user_id+source`

#### 2️⃣ `20260113_002_make_saved_outfits_flexible.sql`
**改動**:
- ✅ `weather_info`: 移除 NOT NULL（某些穿搭無天氣上下文）
- ✅ `occasion`: 移除 NOT NULL（某些穿搭無特定場合）

#### 3️⃣ `20260113_100_create_outfit_rpc.sql` ⭐ **主要安全加強**
**關鍵改動**:

| 項目 | 風險 | 修正 |
|------|------|------|
| **search_path** | Schema shadowing 攻擊 | ✅ 加 `SET search_path = public` |
| **p_items 驗證** | 空陣列、DoS | ✅ 驗證 1-30 items |
| **closet_item 所有權** | 用戶 A 可寫入用戶 B 的單品 | ✅ 迴圈驗證 `user_id = auth.uid()` |
| **catalog_item 驗證** | 不存在的 ID | ⚠️ 延遲到應用層（表尚未建立） |
| **Dynamic SQL** | SQL 注入 | ✅ OK - 無 EXECUTE/FORMAT |
| **RLS** | 越權寫入 | ✅ OK - SECURITY INVOKER + policy |
| **回傳值** | 敏感欄位洩漏 | ✅ OK - 僅回傳 `id, user_id, created_at` |

---

## 📋 驗證清單

```sql
-- 測試 1: 空陣列應被拒絕
SELECT create_outfit_with_items('daily', '[]'::JSONB, 'spring', 'work');
-- Expected: Exception 'Items cannot be empty'

-- 測試 2: 超過 30 items 應被拒絕
-- (構造 31+ items 的 JSONB 陣列)
-- Expected: Exception 'Maximum 30 items per outfit'

-- 測試 3: 他人的 closet_item_id 應被拒絕
-- (用戶 A 的 session 傳入用戶 B 的 closet_item_id)
-- Expected: Exception 'Closet item not found or unauthorized'

-- 測試 4: 成功保存穿搭
SELECT create_outfit_with_items(
  'daily',
  '[{"item_type":"closet","closet_item_id":"<YOUR_ITEM_ID>"}]'::JSONB,
  'spring',
  'work'
);
-- Expected: SUCCESS - returns (id, user_id, created_at)
```

---

## 📊 影響範圍

| 檔案 | 修改 | 影響 |
|------|------|------|
| `saved_outfits` 表 | +3 列, +3 索引, 2 個 NOT NULL 移除 | 升級安全 |
| API Routes | 無變更 | 相容 |
| 應用層驗證 | 無變更 | 仍需驗證 catalog_items（應用層） |
| 測試 | 無變更（待補充） | 建議添加 RPC 單元測試 |

---

## 🚀 部署建議

1. **順序執行** migrations：
   ```
   1. 20260113_001_* (添加欄位)
   2. 20260113_002_* (修改約束)
   3. 20260113_100_* (建立 RPC)
   ```

2. **應用層待修正**:
   - 驗證 `catalog_item_id` 存在且 `is_visible = true`
   - 或在 catalog_items 表建立後，將驗證移入 RPC

3. **建議單元測試**:
   ```sql
   -- RPC 驗證測試（來自 route.test.ts 邏輯，但在 SQL 層）
   - 測試 items=[] 拒絕
   - 測試 items 超限拒絕
   - 測試他人 closet_item_id 拒絕
   - 測試成功路徑
   ```

---

## ✨ 安全提升等級

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| Schema 安全 | ⚠️ 無明確 search_path | ✅ 明確 `public` |
| 輸入驗證 | ❌ 無 | ✅ 完整（items count, type, ownership） |
| 所有權檢查 | ❌ 無 | ✅ 所有 closet_item 驗證 |
| 交易安全 | ✅ 單 INSERT | ✅ 同上 + RLS |
| 錯誤處理 | ✅ 通用訊息 | ✅ 同上 + RPC validation |

---

**Status**: ✅ Ready for merge after testing
**Files Changed**: +3 migrations
**LOC**: +168 lines of SQL
**Risk Level**: **LOW** (additive, backward compatible)
