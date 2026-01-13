# 🔐 RPC Migration Security Review - PR Comment

## Summary
Supabase RPC `create_outfit_with_items` review: **7 審查項目，3 項需要改動，4 項 OK**

---

## 審查結果

### 1️⃣ **search_path 設定** ❌ **需要改**
**風險**: RPC 未明確設定 search_path，攻擊者可能通過 schema shadowing 攻擊（例如在 public 外建立惡意表名）。
**修正**: 在 `LANGUAGE plpgsql` 後加 `SET search_path = public` 確保表名解析固定。

```sql
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
```

---

### 2️⃣ **Dynamic SQL 注入防護** ✅ **OK**
**檢查**: RPC 無 EXECUTE/FORMAT 語句，所有表名/列名為常數。
**結論**: 無 SQL 注入風險。

---

### 3️⃣ **p_items JSONB 驗證** ❌ **需要改**
**風險 1**: `p_items` 為空陣列 `[]` 時 RPC 無驗證，允許保存無任何單品的穿搭。
**修正**: 加入 `IF jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Items cannot be empty'; END IF;`

**風險 2**: 無最大數量限制，惡意請求可傳 1000+ 個 items 造成 DoS（JSONB 儲存 + 查詢負擔）。
**修正**: 加入 `IF jsonb_array_length(p_items) > 30 THEN RAISE EXCEPTION 'Max 30 items per outfit'; END IF;`

**風險 3**: Items 內的 `item_type` 與 ID 結構無驗證（應確保每個 item 是 `{item_type, closet_item_id or catalog_item_id, position?}`）。
**修正**: 在迴圈中驗證每個 item schema（或在應用層用 Zod 驗證後再傳入 RPC）。

---

### 4️⃣ **權限與所有權驗證** ❌ **需要改**
**風險 1**: RPC 不驗證 `p_items` 中的 `closet_item_id` 是否屬於 `auth.uid()`。若用戶 A 傳入用戶 B 的 closet_item_id，RPC 不會檢查所有權。
**修正**: 加入驗證迴圈檢查每個 closet_item：
```sql
FOR item IN SELECT * FROM jsonb_array_elements(p_items)
LOOP
  IF (item->>'item_type') = 'closet_item' THEN
    PERFORM 1 FROM closet_items
    WHERE id = (item->>'closet_item_id')::UUID
    AND user_id = v_user_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Closet item not found or unauthorized';
    END IF;
  END IF;
END LOOP;
```

**風險 2**: `catalog_item` 存在性檢查也缺失（應驗證 catalog_item 存在且可見）。
**修正**: 類似上述邏輯檢查 `catalog_items` 表。

---

### 5️⃣ **RLS 政策** ✅ **OK**
**檢查**: `saved_outfits` 表有 INSERT policy `WITH CHECK (auth.uid() = user_id)`，SECURITY INVOKER 會自動執行。
**結論**: RLS 層面 OK，但上層 items 驗證缺失會削弱此防護。

---

### 6️⃣ **回傳值洩漏** ✅ **OK**
**檢查**: 回傳 `id, user_id, created_at`，無內部欄位或敏感資料。
**結論**: 安全。

---

### 7️⃣ **交易一致性** ⚠️ **OK 但設計注意**
**檢查**: 單一 `INSERT INTO saved_outfits` 操作，無複雜交易邏輯。
**設計決策**: Items 儲存為 JSONB（非正規化），無 `outfit_items` 關聯表。
**結論**: 原子性 OK（單 INSERT），但若未來需要查詢「包含特定單品的穿搭」會有 JSONB 查詢性能問題（建議預留設計空間）。

---

## 🎯 **必改項目清單**
- [ ] 加 `SET search_path = public`
- [ ] 驗證 `p_items` 非空 (array_length > 0)
- [ ] 限制最大 items 數（建議 30）
- [ ] 驗證 closet_item_id 屬於 auth.uid()
- [ ] 驗證 catalog_item_id 存在且可見（或確認應用層已驗證）

---

## 📋 **測試建議**
1. 嘗試傳入 items=[] → 應 403
2. 嘗試傳入 items 含他人 closet_item_id → 應 403
3. 嘗試傳入 31+ items → 應 400

---

**Ready for merge after above fixes** ✨
