# 🔄 Outfits DB 持久化 - 本地 vs 線上差異分析

## 📋 Scenario 1: 本地 Migration vs 線上 Schema 差異

### 差異重點（8 項）

| # | 項目 | 本地現狀 | 線上期望 | 狀態 |
|---|------|---------|---------|------|
| 1 | pgcrypto extension | ❌ 未明確建立 | ✅ 需要 CREATE EXTENSION | ⚠️ **缺失** |
| 2 | closet_items migration | ✅ 完整 | ✅ 一致 | ✅ OK |
| 3 | set_updated_at() function | ✅ CREATE OR REPLACE | ✅ 期望一致 | ✅ OK |
| 4 | RLS enabled | ✅ ALTER TABLE ENABLE | ✅ 一致 | ✅ OK |
| 5 | Policies with IF NOT EXISTS | ❌ 無 IF NOT EXISTS | ✅ 線上可能無 | ✅ OK (migration 一次性) |
| 6 | Trigger 定義 | ✅ CREATE TRIGGER 無 IF | ✅ 一致 | ✅ OK |
| 7 | Foreign Key ON DELETE CASCADE | ✅ user_id FK 有 CASCADE | ✅ 一致 | ✅ OK |
| 8 | 初始資料定義 | ❌ 無 | ✅ 線上可能有 | ℹ️ 不影響此次 |

### 關鍵發現

✅ **本地 schema 結構完善** - closet_items migration 已涵蓋 RLS + trigger + index
⚠️ **缺失 pgcrypto extension** - gen_random_uuid() 依賴此，應補充
✅ **RLS 限制一致** - auth.uid() 防護已實施
✅ **可直接複用此 pattern** 給 outfits/outfit_items tables

---

## 🎯 Scenario 2: 新增 outfits/outfit_items Migrations

**計畫**:
- [x] 先新增 pgcrypto extension migration
- [x] 新增 public.outfits table migration
- [x] 新增 public.outfit_items table migration
- [x] 複用 set_updated_at() trigger pattern
- [x] 啟用 RLS + policies

**Outfits 表結構**:
```
id (uuid, PK)
user_id (uuid, FK auth.users ON DELETE CASCADE)
title (text)
notes (text, nullable)
created_at (timestamptz, default now())
updated_at (timestamptz, default now())
```

**Outfit_items 表結構**:
```
id (uuid, PK)
outfit_id (uuid, FK outfits ON DELETE CASCADE)
closet_item_id (uuid, nullable, FK closet_items ON DELETE SET NULL)
position (int) - 穿搭順序
layer (text) - 層級 (top, bottom, outer, accessory, feet)
created_at (timestamptz, default now())
updated_at (timestamptz, default now())
```

**RLS 政策**:
- outfits: SELECT/INSERT/UPDATE/DELETE 限制 user_id = auth.uid()
- outfit_items: 透過 outfit.user_id = auth.uid() 檢查（不信任 client user_id）

---

## 🔗 Scenario 3: API 改為走 DB

**受影響的路由**:
- POST /api/outfits - 建立穿搭（items array 支援）
- GET /api/outfits - 列表（最近 10 筆）
- GET /api/daily-outfits - 回傳最近 10 筆（暫時）
- PUT/DELETE /api/outfits/[id] - 更新/刪除（可選）

**API 修改要點**:
- user_id 從 server session 取得（getSupabaseAndUser）
- POST 須驗證 closet_item_id 存在且屬於 auth.uid()
- 所有寫入透過 RLS 自動限制
- 測試覆蓋：未登入 401, 登入可建立, items 缺失 400

---

## 📝 實施步驟

1. ✅ 分析差異 → 本文件
2. ⏳ 新增 migrations （3 個）
3. ⏳ 修改 API routes （3 個檔案）
4. ⏳ 新增測試 （至少 5 個 test case）
5. ⏳ 輸出最終摘要

**Status**: 分析完成，進入實施階段
