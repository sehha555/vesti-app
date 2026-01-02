# Web - Vesti AI 穿搭推薦系統

## 概述

Vesti Web 是一個使用 Next.js 建構的 AI 穿搭推薦應用程式。此目錄包含前端應用程式、API routes 和相關服務。

## 開發環境設置

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 執行測試
npm test

# 構建生產版本
npm run build
```

---

## 安全性 - Supabase

### 重要提醒：Anon Key 是公開的

`NEXT_PUBLIC_SUPABASE_ANON_KEY` 和 `NEXT_PUBLIC_SUPABASE_URL` 被設定為 `NEXT_PUBLIC_*` 前綴，**這表示它們會被編譯到客戶端代碼中，任何人都可以看到**。

**這不是安全漏洞 - 這是正常的設計**。Supabase anon key 被設計為「受限的公開密鑰」，其權限完全由 RLS 策略控制。

### Row-Level Security (RLS) 是防線

**所有涉及敏感資料的表格都必須啟用 RLS**。不依賴 anon key 的保密性，而是依賴資料庫級別的權限驗證。

#### RLS Policy 最佳實踐

```sql
-- 例：用戶穿搭表格
CREATE TABLE wardrobe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 啟用 RLS
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Policy：用戶只能看到自己的資料
CREATE POLICY "Users can view own items"
ON wardrobe_items FOR SELECT
USING (auth.uid() = user_id);

-- Policy：用戶只能插入自己的資料
CREATE POLICY "Users can insert own items"
ON wardrobe_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy：用戶只能更新自己的資料
CREATE POLICY "Users can update own items"
ON wardrobe_items FOR UPDATE
USING (auth.uid() = user_id);

-- Policy：用戶只能刪除自己的資料
CREATE POLICY "Users can delete own items"
ON wardrobe_items FOR DELETE
USING (auth.uid() = user_id);
```

### 嚴禁事項

**決不要在前端或環境變數中存放 `service_role key`**
- `service_role key` 有完全的資料庫訪問權限
- 如果洩露，攻擊者可以修改任何資料
- 它必須只存在於後端伺服器上

**決不要在 `NEXT_PUBLIC_*` 中存放任何私密密鑰**
- 所有 `NEXT_PUBLIC_*` 變數都會被編譯到客戶端
- 使用 `NEXT_PUBLIC_*` 前綴的唯一目的是讓變數對客戶端代碼可用

**正確做法**
- Supabase anon key：可以在 `NEXT_PUBLIC_*` 中（因為有 RLS 保護）
- Supabase URL：可以在 `NEXT_PUBLIC_*` 中（它是公開的 endpoint）
- Service role key：必須只在後端 API route 中使用（存放在 `.env.local`，不提交到 repo）
- API 密鑰（Cloudinary、第三方服務）：必須使用私密環境變數

### 驗證策略

#### 前端驗證（可選，用戶體驗）
```typescript
// 檢查用戶是否已登入
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  // 重新導向到登入頁面
}
```

#### 後端驗證（必需，安全性）
```typescript
// API route 中檢查用戶身份
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
    { status: 401 }
  );
}

// 驗證 JWT claims
const { data: { session } } = await supabase.auth.getSession();
if (!session?.user?.id) {
  return NextResponse.json(
    { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
    { status: 401 }
  );
}
```

### CI/CD 中的 Supabase 設定

在 GitHub Actions 中，只注入 **public** 的 Supabase 密鑰：

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
```

**永不在 CI 中注入：**
- `SUPABASE_SERVICE_ROLE_KEY`
- 任何私密 API 密鑰

### 設定 GitHub Secrets

在 GitHub 倉庫設定中添加以下 Secrets：

| Secret 名稱 | 值 | 備註 |
|-----------|---|----|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | 來自 Supabase 專案設定 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | 公開 API 金鑰，anon role 用 |

---

## 專案結構

```
.
├── app/                      # Next.js 應用程式目錄
│   ├── api/                 # API routes
│   │   ├── reco/           # 推薦相關 API
│   │   └── wardrobe/       # 衣櫃相關 API
│   └── page.tsx            # 首頁
├── lib/                     # 工具函式庫
│   └── supabaseClient.ts    # Supabase 客戶端配置
├── middleware/              # Next.js 中間件
│   └── auth.ts             # 認證中間件
├── vitest.config.ts         # Vitest 配置（用於測試別名解析）
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依賴管理
```

---

## 測試

### 運行所有測試
```bash
npm test
```

### 運行特定測試
```bash
npm test -- --testNamePattern="daily"
```

### Vitest 別名解析

Vitest 現已正確配置，可解析以下 TypeScript 別名：
- `@/lib/*` → `apps/web/lib/*`
- `@/middleware/*` → `@/app/api/_middleware/*`
- `@/services/*` → `apps/web/app/services/*`

如果遇到 `Cannot find module` 錯誤，請檢查：
1. `tsconfig.json` 中的 `paths` 配置
2. `vitest.config.ts` 中的 `tsconfigPaths` 插件
3. 在 `.github/workflows/ci.yml` 中注入了 Supabase secrets

---

## 已知限制與未來改進

- [ ] 添加端對端 (E2E) 測試
- [ ] 實施更細粒度的 RLS policies
- [ ] 添加審計日誌記錄

### 常見問題排除

| 問題 | 解決方法 |
|------|----------|
| `act` 報 Docker 連不上 | 確認 Docker Desktop 已啟動（macOS/Windows）或 `sudo systemctl start docker`（Linux） |
| `npm run ci:act` 超慢 | 首次執行正常（下載 image），後續用 cache 加速 |
| `pre-push` 不生效 | `npm install`（觸發 prepare）+ `chmod +x .husky/pre-push` |
| Supabase secrets 驗證失敗 | 確認 `.secrets` 已填入正確 anon key，且 `.actrc` image 已拉完 |
| Windows WSL2 Docker 問題 | 安裝 Docker Desktop + WSL2 整合，或用 `docker desktop` |
