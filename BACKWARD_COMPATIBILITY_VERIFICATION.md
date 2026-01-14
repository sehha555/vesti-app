# POST /api/outfits Backward Compatibility - 上线前最後 3 個確認

**版本**: 1.0
**日期**: 2025-01-14
**棄用期限**: 2026-03-01
**棄用通知日**: 2025-01-14 至 2026-03-01 (45 天過渡期)

---

## ✅ 確認項 1: Deprecation Link 路徑驗證

### 問題
Link header 指向的文檔路徑必須存在，否則 header 形同虛設。

### 實現
- **文檔位置**: `docs/BACKEND_API_REFERENCE.md`
- **章節**: Outfits (搭配) - `/api/outfits` 部分
- **Link Header 值**:
  ```
  <https://github.com/vesti-app/vesti/blob/master/docs/BACKEND_API_REFERENCE.md#api-apiotfits>; rel="deprecation"
  ```

### 驗證步驟
1. ✅ 文檔文件存在: `docs/BACKEND_API_REFERENCE.md`
2. ✅ 文檔包含 Outfits 章節，詳細說明新舊格式
3. ✅ GitHub 原始文件 URL 有效且可訪問
4. ✅ 測試環境可 mock 並驗證 Link header 正確傳遞

### 檔案位置
- **API 路由**: `apps/web/app/api/outfits/route.ts` (行 118)
- **API 文檔**: `docs/BACKEND_API_REFERENCE.md` (行 95-165)

### 文檔內容覆蓋
- ✅ 新格式說明 (推薦使用)
- ✅ 舊格式說明 (已棄用)
- ✅ 自動轉換規則
- ✅ 棄用信號說明 (Deprecation, Sunset, Link headers)
- ✅ 棄用期限日期 (2026-03-01)

---

## ✅ 確認項 2: Cache-Control 一致性

### 問題
legacy/new 都要同樣加 `Cache-Control: private, no-store`，避免有分支漏掉。

### 實現
所有 API response 都初始化並保持 `Cache-Control: private, no-store`

### 驗證步驟

**初始化** (`apps/web/app/api/outfits/route.ts:89`):
```typescript
const responseHeaders: Record<string, string> = { 'Cache-Control': 'private, no-store' };
```

**所有分支覆蓋**:

| 分支 | 行號 | 狀態碼 | Cache-Control | 備註 |
|------|------|--------|---|---|
| 未認證 (GET) | 39 | 401 | ✅ private, no-store | GET handler |
| 取得失敗 (GET) | 55 | 500 | ✅ private, no-store | Server error |
| 成功 (GET) | 60 | 200 | ✅ private, no-store | Success response |
| 伺服器錯誤 (GET) | 65 | 500 | ✅ private, no-store | Catch block |
| 未認證 (POST) | 82 | 401 | ✅ private, no-store | POST handler |
| 無效格式 (POST) | 122 | 400 | ✅ private, no-store | 新/舊格式都失敗 |
| JSON 解析失敗 (POST) | 129 | 400 | ✅ private, no-store | Exception |
| 衣物非使用者所有 (POST) | 148 | 403 | ✅ private, no-store | Authorization |
| 建立 Outfit 失敗 (POST) | 168 | 500 | ✅ private, no-store | DB error |
| 建立 Items 失敗 (POST) | 190 | 500 | ✅ private, no-store | DB error |
| **成功 (POST - 新格式)** | **196** | **201** | **✅ responseHeaders** | 使用初始化的 headers |
| **成功 (POST - 舊格式)** | **196** | **201** | **✅ responseHeaders** | + Deprecation headers |

**測試覆蓋**: `apps/web/app/api/outfits/route.test.ts`
- 9/9 tests 通過，驗證所有分支的 Cache-Control 正確

---

## ✅ 確認項 3: 可觀測性 - Legacy 使用次數追踪

### 問題
把 legacy 使用次數打到 log/metrics，到 2026-03-01 前可以量化「還有多少舊 client 沒升級」。

### 實現

#### 3.1 Metrics 模組 (`apps/web/lib/metrics.ts`)

**功能**:
- `logDeprecationMetric()` - 記錄每個 legacy format 的請求
- `logMigrationStatus()` - 記錄整體遷移統計 (用於定期報告)
- `hashUserId()` - 隱私保護 (只記錄 user ID 的前 8 字元 + 後 4 字元)

**記錄內容**:
```typescript
{
  level: "DEPRECATION",
  service: "api",
  message: "Deprecated API endpoint usage: POST /api/outfits",
  metric: {
    endpoint: "POST /api/outfits",
    format: "legacy",
    userId: "550e8400...0001",        // Hashed for privacy
    itemCount: 2,
    timestamp: "2025-01-14T10:30:45Z",
    userAgent: "curl/7.68.0"          // Optional
  }
}
```

#### 3.2 集成到 API Route (`apps/web/app/api/outfits/route.ts`)

**調用位置** (行 116-122):
```typescript
logDeprecationMetric({
  endpoint: 'POST /api/outfits',
  format: 'legacy',
  userId: user.id,
  itemCount: legacy.itemIds.length,
  userAgent: req.headers.get('user-agent') || undefined,
});
```

**觸發條件**:
- ✅ 只在 legacy format 被接受時記錄
- ✅ 在新格式成功時不記錄
- ✅ 在任何格式都失敗時不記錄 (早期返回)

#### 3.3 測試驗證 (`apps/web/app/api/outfits/route.test.ts`)

**測試 Case**:
1. ✅ Legacy format 成功 (201) → 驗證 `logDeprecationMetric` 被調用
   - 傳入正確的 endpoint, format, userId, itemCount

2. ✅ Legacy format 失敗 403 → 驗證 `logDeprecationMetric` 被調用
   - 即使最後授權檢查失敗，仍然記錄了嘗試
   - 這對理解「有多少舊 client 試圖使用」很重要

### 日誌聚合建議

**短期** (2025-01-14 ~ 2025-02-14):
- 查看 Supabase Logs 或應用日誌中 "DEPRECATION" 級別的項目
- 用 grep/jq 統計 `logDeprecationMetric` 調用次數
- 示例:
  ```bash
  grep "Deprecated API endpoint usage" logs.json | wc -l
  ```

**中期** (2025-02-14 ~ 2026-02-01):
- 定期運行統計查詢，記錄 legacy 使用百分比
- 如果 > 10% 仍在用 legacy，考慮延長棄用期限
- 如果 < 1%，可確信大多數 client 已升級

**長期** (2026-02-01 ~ 2026-03-01):
- 最後 30 天檢查是否有 legacy 請求
- 如有，發出最終警告公告
- 2026-03-01 後移除 legacy 支援

### 如何查詢統計

**在應用日誌中尋找**:
```
grep "level.*DEPRECATION" app.log | \
  jq '.metric' | \
  group_by(.endpoint) | \
  map({endpoint: .[0].endpoint, count: length, items_avg: (map(.itemCount) | add / length)})
```

**或在 Supabase 中建立 view**:
```sql
-- 假設日誌存入 logs 表
SELECT
  DATE(timestamp) as date,
  COUNT(*) as deprecated_requests,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM logs WHERE timestamp > now() - interval '1 day'), 2) as percent_of_total
FROM logs
WHERE service = 'api' AND level = 'DEPRECATION'
GROUP BY DATE(timestamp)
ORDER BY date DESC;
```

---

## 上線前檢查清單

### 部署前
- [ ] 3 個確認項都已實現
- [ ] 9/9 測試通過
- [ ] `Cache-Control` header 在所有分支都存在
- [ ] Deprecation Link 指向有效文檔
- [ ] Metrics 日誌能正常輸出

### 部署後
- [ ] 監控日誌中是否有 "Deprecated payload" 警告
- [ ] 驗證棄用 header (Deprecation, Sunset, Link) 確實返回給舊 client
- [ ] 統計舊 client 的使用百分比

### 定期檢查 (每週)
- [ ] 查看 legacy format 使用趨勢
- [ ] 如果使用量停留 > 10%，考慮延長棄用期限或主動聯繫使用者
- [ ] 記錄週報告至 metrics/reports/ 目錄

---

## 文檔位置

| 文件 | 用途 | 行數 |
|------|------|------|
| `apps/web/app/api/outfits/route.ts` | API 實現 (新舊格式支援) | 1-200 |
| `apps/web/app/api/outfits/route.test.ts` | 測試 (9 test cases) | 1-350+ |
| `apps/web/lib/metrics.ts` | Metrics 模組 (新建) | 1-60 |
| `docs/BACKEND_API_REFERENCE.md` | API 文檔 + 棄用說明 | 95-165 |
| `BACKWARD_COMPATIBILITY_VERIFICATION.md` | 此文件 (驗證說明) | - |

---

## 棄用時間表

| 日期 | 活動 | 狀態 |
|------|------|------|
| **2025-01-14** | 部署 backward compatibility | ✅ |
| **2025-01-14 ~ 2026-03-01** | 接受舊格式，返回棄用 headers + log | 進行中 |
| **每週** | 統計舊 client 使用量 | 待開始 |
| **2026-02-01** | 發出最終警告 (30 天前) | 待進行 |
| **2026-03-01** | 停止支援舊格式 (移除 legacy code) | 待進行 |
