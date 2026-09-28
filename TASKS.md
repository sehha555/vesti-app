# Vesti 任務進度與待辦

> 最後更新：2026-09-28（依 2026-09-26～28 的討論結論整理；本機 Supabase 已設定好）
> 所有改動都在分支 `claude/resume-ot3fvx`，**還沒合進 `master`**。
> 接手的人（或 Claude）請先讀這份，法律相關再讀 `docs/legal/link-out-compliance.md`。

---

## 回家後照這個做（Windows 用 PowerShell 或終端機都可以）

**第一步：拿到最新的程式碼**（在專案資料夾執行）

```bash
git fetch origin
git checkout claude/resume-ot3fvx
git pull
npm install
```

**第二步：啟動本機 Supabase**（要先打開 Docker Desktop）

```bash
npm run local:setup
```

- 第一次會下載好幾 GB 的東西，要等一陣子；之後就很快。
- 它會自動把本機 Supabase 的網址和金鑰寫進 `apps/web/.env.local`。
  - 原本的 `apps/web/.env.local` 會先備份成 `apps/web/.env.local.before-local`，想換回原本的設定就把它改回原名。
  - 原本檔案裡的其他設定（例如 Gemini 金鑰）不會被動到。
- **Gemini 金鑰**：你說本機可能有，只是沒推上 GitHub（`.env.local` 本來就不會上傳，這是對的）。
  - 如果在 `apps/web/.env.local`：不用做任何事。
  - 如果在專案最外層的 `.env.local` 或 `.env`：程式會自動複製過去。
  - 都沒有的話，程式會提醒你，在 `apps/web/.env.local` 加一行 `GEMINI_API_KEY=你的金鑰`。

**第三步：開網站**

```bash
npm run dev
```

打開 http://localhost:3000 ，用測試帳號登入：`test@vesti.local`／`vesti-test-1234`

**其他常用指令**

| 指令 | 做什麼 |
|---|---|
| `npm run local:db:stop` | 關掉本機 Supabase（資料會保留） |
| `npm run local:db:reset` | 把本機資料庫清空重來（測試帳號會自動重建） |
| 打開 http://127.0.0.1:54323 | 本機 Supabase 的管理後台，可以直接看資料表 |

**如果下載失敗**（出現 `Data limit exceeded` 之類的錯誤），先執行下面這行，再重跑 `npm run local:setup`：

```powershell
$env:SUPABASE_INTERNAL_IMAGE_REGISTRY="docker.io"
```

然後跟 Claude 說：「讀 TASKS.md，接著做」。

---

## 一句話現況

App 的主流程已經串起來了：**放衣服進衣櫃 → AI 認出是什麼衣服 → AI 依天氣搭配 → 使用者按「要／不要」→ 下次推薦參考這些回饋**。
但**還沒用真的衣服跑過**，也**還沒辦法知道推薦好不好**。接下來的重點就是這兩件事。

---

## 目標

1. **A. 自己先用順**：自己每天用，確認推薦真的好用。
2. **B. 給朋友試用**：A 沒問題之後，找幾個朋友用、收集意見。

正式上線還沒排時間，等 B 之後再決定。

---

## 討論後的決定

### 推薦要怎麼做：AI ＋ 程式一起
用「造型師＋助理」來比喻：

- **AI 是造型師**：懂穿搭，第一天就能用，所以**新使用者沒有冷啟動問題**。它負責先提出 6～8 套搭配。
- **程式是熟悉你的助理**：記得你每次按的「要／不要／有沒有穿」，幫每套打分數，只留最高分的 3 套。
- **比重會自動移動**：回饋少的時候，大多照 AI 的意見；回饋越多，程式打的分數越重要。

程式能學的東西分三層：

| 層次 | 例子 | 需要多少資料 | 現況 |
|---|---|---|---|
| 1. 常識規則 | 30 度不穿羽絨衣、同一套正式度要接近 | 不用 | ✅ 已完成 |
| 2. 你個人的口味 | 你常嫌「太正式」、你最常穿深色 | 你自己按幾十次 | 待做（任務 6） |
| 3. 大家的口味 | 跟你品味像的人也喜歡這樣搭 | 很多使用者 | 以後再說 |

### 時尚美感：先改 prompt，微調以後再說
- **現在**：把給 AI 的「穿搭守則」寫好，加上好搭配、壞搭配的範例。便宜、馬上看得到效果。
- **以後**：守則怎麼改分數都不再進步時，才考慮「微調」（用大量好壞範例訓練模型）。那時使用者累積的「要／不要」剛好就是訓練資料。

### 怎麼知道推薦好不好：做一份「考卷」
- 準備約 20 個固定情境（這些衣服＋這個天氣＋這個場合），每次修改後跑一遍，看平均分數有沒有上升。
- **先讓 AI 打分數**。注意不能讓「搭配的 AI」自己打分數（像學生改自己的考卷），要用另一個模型，或完全不同的評分標準。
- **你偶爾抽查**：每次看 5 套左右，確認 AI 打的分數跟你的感覺差不多。

### 不開新的雲端 Supabase
- 舊的 Supabase 專案因為太久沒用被暫停了。
- **目標 A**：在你家電腦用 Docker 跑「本機版 Supabase」，免費，資料只在你電腦上，弄亂也沒關係。設定由 Claude 準備。
- **目標 B**：朋友要連得到，才需要雲端的 Supabase。到時先試著恢復舊專案，救不回就開新的。

---

## 任務清單（照順序做）

### 任務 1. 考卷 ⭐ 最先做
- **只需要 Gemini 金鑰，不用 Supabase、不用開網站。**
- **Claude 要做**：
  - 一支獨立的小程式：讀資料夾裡的衣服照片 → AI 認衣服 → AI 搭配 → 另一個 AI 打分數 → 印出每題分數與平均。
  - 約 20 個情境：不同天氣（熱、涼、冷、下雨）× 不同場合（休閒、上班、約會、運動）× 不同衣櫃（衣服很少、很多、缺鞋子）。
  - 衣服照片用公開資料集（例如 Kaggle 的 Fashion Product Images），不用自己拍。
  - 每次跑完把成績存檔，方便比較「改之前、改之後」。
- **你要做**：準備 Gemini 金鑰；看第一次的成績和 5 套抽查。

### 任務 2. 加強穿搭守則（prompt）
- **前提**：任務 1 完成。
- 改寫 `apps/web/lib/ai/outfit-prompt.ts` 裡的守則，加入好、壞搭配範例。
- 每改一版就跑一次考卷，只留下分數有上升的修改。

### 任務 3. 本機 Supabase ✅ 設定完成，等你在家啟動
- 已經做好：設定檔、測試帳號、啟動指令（見最上面「回家後照這個做」）。
- 已經在雲端環境實際跑過：登入、上傳衣服、今日穿搭、回饋、收藏、刪除帳號都正常；所有資料庫更新都會自動套上。
- **你要做**：在家照步驟啟動一次，確認你的電腦上也正常。

### 任務 4. 測試衣櫃
- **前提**：任務 3 完成。
- 自動灌一批公開資料集的衣服進本機的測試帳號，不用自己拍照就能試推薦。

### 任務 5. 自己用 App（目標 A）
- **前提**：任務 3、4 完成。
- 每天用：看推薦、按要／不要、隔天回答有沒有穿。
- 記下怪的地方：認錯的衣服、奇怪的搭配、太慢的畫面。

### 任務 6. 助理打分數（排序器）
- **前提**：任務 1（要用考卷確認有變好），最好也累積了一些任務 5 的回饋。
- 讓 AI 一次提 6～8 套，程式依回饋打分數留 3 套：
  - 跟你按過「要」的搭配很像 → 加分
  - 含你按過「不要」的組合，或違反你選的原因（例如「太正式」）→ 扣分
  - 最近 3 天穿過的整套 → 扣分
- 回饋越多，程式分數的比重越高。

### 任務 7. 給朋友試用（目標 B）
- **前提**：自己用覺得 OK。
- 要做的事：
  - 恢復或新開雲端 Supabase，把網站放到網路上。
  - 補齊法律頁面〔〕裡的資料（公司名稱、聯絡信箱、資料放在哪個國家）。
  - Gemini 改付費方案（免費方案的資料可能被拿去訓練，跟隱私權政策衝突）。
  - 設定 `SUPABASE_SERVICE_ROLE_KEY`（刪除帳號要用）和 `VESTI_BOT_INFO_URL`。
- 加一頁簡單的統計：推薦被按「要」的比例、最常被嫌的原因、選了之後真的有穿的比例。

### 以後再說
- 微調模型（見上面「時尚美感」）。
- 第 3 層「大家的口味」推薦。
- 正式上線：找律師看 `docs/legal/link-out-compliance.md` 的問題清單、個資外洩應變流程。
- UNIQLO 匯入可能因為我們老實報上 VestiBot 而被擋。**不要改回假裝成瀏覽器**；替代方案是請使用者拍照，或申請官方商品資料。
- 技術債：
  - Tailwind 樣式檔要重新設定。
  - 首頁今天、昨天的穿搭可以合成一次請求。
  - `daily_outfit_plans.outfit_id` 欄位沒意義，之後改掉。
  - `services/reco` 舊的事件系統可以清掉。
  - 衣服都辨識完之後，可以評估只送文字、不送照片給 AI，更快更便宜。

---

## 你要做的事（總整理）

- [ ] 準備 Gemini 金鑰（任務 1 就要用）
- [ ] 在家照「回家後照這個做」啟動本機 Supabase，用測試帳號登入看看（任務 3）
- [ ] 有空時到 Supabase 後台看舊專案能不能按 Restore 恢復（任務 7 才需要）
- [ ] 決定什麼時候開 PR，把分支合進 master（跟 Claude 說「開 PR」即可）

---

## 已經做完的（白話版）

| 項目 | 白話說明 |
|---|---|
| 登入／登出修好 | 以前 email 登入後，其他功能認不得你；登出按鈕也沒真的登出。 |
| 資料安全 | 以前有幾張表任何人都能讀寫，已關掉；每個人只能看自己的衣服。 |
| 衣櫃 | 可以拍照上傳、貼商品連結匯入、改名稱、刪除；會自動去背。 |
| 今日穿搭、收藏 | 以前存在瀏覽器、換手機就不見，現在存在伺服器。 |
| 回饋按鈕 | 推薦卡片有「👍 要這套」「👎 不要（可選原因）」，隔天會問「昨天有穿嗎」。這些都會餵給 AI。 |
| 購物改成外連 | 拿掉 App 內的購物車、結帳、付款。按「前往 uniqlo.com 購買 ↗」直接去官網，並標示可能有分潤。 |
| 抓商品圖守規矩 | 抓網頁時老實報上名字（VestiBot）、遵守 robots.txt、蝦皮等不讓抓的網站直接跳過。 |
| 法律頁面 | 服務條款、隱私權政策、VestiBot 說明（草稿，待補資料與律師確認）。 |
| 刪除帳號 | 個人頁可以刪帳號，照片、收藏、回饋紀錄一起刪。 |
| AI 認衣服 | 上傳時 AI 自動填類別、顏色、花紋、保暖度 1–5、正式度 1–5、風格；舊衣服可按「AI 辨識」補上。 |
| 挑衣服更聰明 | 先依天氣排除不合適的，再每類輪流挑，不再只拿最新 30 件。 |
| 自動檢查 | 每次推程式碼會自動跑 lint、型別檢查、測試（目前 505 個測試）。 |

---

## 給 Claude 的技術交接（這段可以跳過）

- 分支 `claude/resume-ot3fvx`。push 前跑 `npm run typecheck && npm run lint && npm test`；網頁改動再跑 `cd apps/web && npx next build`。
- 使用者看不懂技術用語，**說明一律用白話**；做重大決定前先討論，不要先做再說。
- `apps/web` 的 tsconfig 沒開 `strict`，union 靠 truthiness 收窄不了，回傳型別用明確的 `null` 欄位（參考 `lib/http/require-user.ts`）。
- 預編譯的 CSS 缺很多 Tailwind class，新 UI 用 inline style 或 `var(--vesti-primary)`。
- 核心循環的檔案：
  - ① 衣物理解：`lib/ai/tag-item.ts`、`lib/closet/attributes.ts`、`lib/closet/create-item.ts`、`app/api/closet-items/analyze`
  - ② 候選：`lib/reco/candidates.ts`
  - ③ 搭配：`lib/ai/suggest-outfits.ts`、`lib/ai/outfit-prompt.ts`（`OUTFIT_SYSTEM_PROMPT` 就是穿搭守則）
  - ④ 排序器（任務 6，未實作）：建議放 `lib/reco/rank.ts`；輸入候選搭配與 `lib/feedback/summary.ts` 讀到的回饋，輸出前 3 套；比重依回饋筆數調整
  - ⑤ 回饋：`app/api/reco/events`、`lib/feedback/*`、`app/components/figma/StackedCards.tsx`
- 考卷（任務 1）建議放在 `evals/outfits/`：情境檔（JSON）＋執行腳本＋每次成績（依日期存檔）。直接呼叫 `lib/ai` 的函式，不經過 API 與資料庫。評審用不同的模型或不同的 system prompt，並輸出評分理由方便使用者抽查。可參考既有的 `docs/evals/metrics.md`。
- 一套搭配的識別碼是「單品 id 排序後用 | 串起來」（`lib/outfits/key.ts`），卡片 id 1/2/3 只是位置。
- 本機 Supabase（任務 3）：`supabase/config.toml`（關掉 edge_runtime、analytics；site_url 為 localhost:3000）、`supabase/seed.sql`（測試帳號）、`scripts/local/env.mjs`（寫 `apps/web/.env.local`）。Storage bucket 由 migration 建立。
  - 2026-09-28 在雲端容器驗證過：`supabase start` 套上全部 7 個 migration、seed 帳號可登入，upload / plan / events / saved-outfits / DELETE /api/account 端到端正常，`db reset` 後帳號重建。
  - 雲端容器沒有 IPv6，realtime 起不來，驗證時暫時關掉 realtime；使用者電腦應該不受影響。ECR 下載被限流時用 `SUPABASE_INTERNAL_IMAGE_REGISTRY=docker.io`。
  - 使用者是 Windows（`next.config.js` 的 watchOptions 有 pagefile.sys），指令要能在 PowerShell 跑。
