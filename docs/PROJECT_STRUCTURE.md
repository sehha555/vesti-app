# Vesti 專案結構整理報告

**報告產出日期:** 2025年11月28日
**專案名稱:** Vesti - AI 驅動的智能穿搭推薦平台

---

## 📋 專案概述

Vesti 是一個基於 AI 的智能穿搭推薦系統，整合了 Figma 設計系統與現代化前端框架。專案採用 Monorepo 架構，包含多個微服務、前端應用以及共享套件。

### 核心功能
- 🎨 智能穿搭推薦 (Basket Mix-Match, Daily Outfits, Closet Gap Fill)
- 👔 虛擬衣櫃管理 (Wardrobe Management)
- 🛍️ 服飾商店與折扣系統
- 🌤️ 天氣感知穿搭建議
- 🎭 AR 虛擬試穿 (Try-On)
- 💳 購物車與支付系統

---

## 🏗️ 專案架構

### Monorepo 結構

```
style/
├── apps/                    # 前端應用程式
│   ├── web/                # 主要 Next.js 應用 (App Router)
│   ├── admin/              # 管理後台
│   └── mobile/             # 行動應用
├── services/               # 後端微服務
│   ├── reco/              # 推薦引擎服務
│   ├── wardrobe/          # 衣櫃管理服務
│   ├── cart-payments/     # 購物車與支付
│   ├── catalog/           # 商品目錄
│   ├── tryon/             # 虛擬試穿
│   ├── weather/           # 天氣服務
│   ├── auth/              # 認證服務
│   ├── notifications/     # 通知服務
│   └── api-gateway/       # API 閘道
├── packages/              # 共享套件
│   ├── types/            # TypeScript 型別定義
│   ├── ui/               # UI 元件庫
│   ├── config/           # 共享配置
│   └── prompts/          # AI Prompt 模板
├── Vesti/                # Figma 原始設計系統 (Vite)
├── scripts/              # 自動化腳本
├── infra/                # 基礎設施配置
│   ├── k8s/             # Kubernetes 配置
│   ├── terraform/       # Terraform IaC
│   └── ci/              # CI/CD 配置
└── docs/                 # 專案文件
```

---

## 🎯 核心應用層 (apps/)

### 1. **apps/web/** - Next.js 15 主應用

#### 技術棧
- **框架:** Next.js 15.0.0 (App Router)
- **React:** 18.3.0
- **CSS:** Tailwind CSS 4.1.17 + PostCSS
- **動畫:** Framer Motion 12.23.24
- **UI 元件:** Radix UI (完整套件)
- **表單:** React Hook Form 7.66.1 + Zod 4.1.13
- **狀態管理:** React Context + Hooks
- **開發模式:** Turbopack (--turbopack flag)

#### 目錄結構
```
apps/web/
├── app/
│   ├── api/                    # Next.js API Routes
│   │   ├── reco/              # 推薦 API
│   │   │   ├── basket-mixmatch/
│   │   │   ├── closet-gap-fill/
│   │   │   └── daily-outfits/
│   │   ├── wardrobe/          # 衣櫃管理 API
│   │   │   └── items/
│   │   └── outfits/           # 穿搭管理 API
│   ├── components/
│   │   └── figma/             # Figma 遷移的 UI 元件 (73+ 元件)
│   │       ├── ui/            # 基礎 UI 元件 (40+ Radix 封裝)
│   │       ├── BottomNav.tsx
│   │       ├── WardrobePage.tsx
│   │       ├── ExplorePage.tsx
│   │       ├── StorePage.tsx
│   │       ├── ProfilePage.tsx
│   │       └── ... (更多頁面元件)
│   ├── styles/                # 樣式檔案
│   │   ├── vesti.css         # Vesti 主樣式
│   │   └── vesti-index.css   # Vesti index 樣式
│   ├── page.tsx              # 首頁 (整合 Vesti App.tsx 邏輯)
│   └── layout.tsx            # Root Layout
├── lib/                       # 工具函數
│   └── api.ts                # API 客戶端
├── types/                     # 型別定義
├── public/                    # 靜態資源
├── next.config.mjs           # Next.js 配置
├── tailwind.config.js        # Tailwind 配置
└── tsconfig.json             # TypeScript 配置
```

#### 頁面路由系統
`apps/web/app/page.tsx` 實現了完整的單頁應用邏輯：

**支援頁面:**
- `home` - 首頁 (天氣卡片 + 快速操作 + 推薦卡片)
- `wardrobe` - 虛擬衣櫃
- `explore` - 探索頁面
- `store` - 商店
- `profile` - 個人檔案
- `tryon` - 虛擬試穿
- `checkout` - 結帳
- `discount` - 折扣
- `trending` - 流行趨勢
- `daily` - 每日穿搭
- `basket` - 購物籃搭配
- `gap-fill` - 衣櫃缺口分析
- `cart` - 購物車
- `outfit-collection` - 穿搭收藏

**導航邏輯:**
- 使用 `useState` 管理 `currentPage` 和 `previousPage`
- 支援前後頁導航
- 整合 `framer-motion` 頁面切換動畫
- `BottomNav` 元件控制主要 Tab 導航

---

## 🔧 後端服務層 (services/)

### 微服務架構總覽

| 服務名稱 | 職責 | 技術棧 |
|---------|------|--------|
| **reco** | 推薦引擎核心 | NestJS, LRU Cache |
| **wardrobe** | 衣櫃管理 | TypeScript |
| **cart-payments** | 購物車與支付 | NestJS, Mock Payments |
| **catalog** | 商品目錄管理 | TypeScript |
| **tryon** | 虛擬試穿 | TypeScript |
| **weather** | 天氣資料服務 | TypeScript |
| **auth** | 使用者認證 | TypeScript |
| **notifications** | 通知服務 | TypeScript |
| **api-gateway** | API 閘道 | TypeScript |

### 推薦引擎服務 (services/reco/)

#### 核心模組結構
```
services/reco/
├── pipelines/
│   ├── basket_mixmatch/      # 購物籃混搭推薦
│   ├── closet_gap_fill/      # 衣櫃缺口分析
│   └── daily_outfits/        # 每日穿搭推薦
├── modules/
│   ├── retrieval/            # 檢索模組
│   │   ├── simple.ts        # 簡單候選生成
│   │   ├── filter.ts        # 過濾邏輯
│   │   └── lruCache.ts      # LRU 快取實現
│   ├── scoring/              # 評分模組
│   │   └── rules.ts         # 相容性與場合評分
│   └── preference/           # 偏好管理
│       ├── persistence.ts   # 持久化
│       └── logger.ts        # 日誌記錄
└── persistence/              # 資料持久化層
    ├── interface.ts         # 介面定義
    └── inMemoryAdapter.ts   # 記憶體存儲適配器
```

#### 推薦演算法特點
- **候選檢索:** 基於商品屬性的候選生成
- **組合生成:** 自動生成上衣+下著+鞋子+外套組合
- **評分系統:**
  - `scoreCompatibility()` - 風格與顏色相容性評分
  - `scoreOccasion()` - 場合適用性評分
- **快取機制:** LRU Cache (100 項快取)，加速重複查詢
- **去重邏輯:** 基於商品 ID 組合的唯一性過濾

#### API 端點整合
```typescript
// apps/web/app/api/reco/basket-mixmatch/route.ts
POST /api/reco/basket-mixmatch
  → 購物籃混搭推薦

POST /api/reco/closet-gap-fill
  → 衣櫃缺口分析

POST /api/reco/daily-outfits/save
  → 儲存每日穿搭偏好
```

---

## 📦 共享套件層 (packages/)

### 1. **packages/types/** - 型別定義庫

#### 核心型別模組
```typescript
// packages/types/src/wardrobe.ts
- Hue, Brightness, Chroma (顏色系統)
- Pattern (圖案類型)
- WardrobeItem (衣櫃商品)
- Category (服飾分類)

// packages/types/src/basket.ts
- OutfitCombination (穿搭組合)
- BasketMixmatchRecommendation (推薦結果)

// packages/types/src/reco.ts
- RecommendationContext (推薦上下文)

// 其他模組
- cart.ts (購物車)
- daily.ts (每日推薦)
- gap.ts (缺口分析)
- outfit.ts (穿搭)
- payments.ts (支付)
- persistence.ts (持久化)
- tryon.ts (試穿)
- weather.ts (天氣)
```

### 2. **packages/prompts/** - AI Prompt 模板

```
packages/prompts/src/
└── vqa-prompts.ts    # Visual Q&A Prompts
```

### 3. **packages/ui/** - 共享 UI 元件庫
基礎 UI 元件，與 Figma 元件獨立管理。

### 4. **packages/config/** - 共享配置
跨應用的環境變數與配置管理。

---

## 🎨 Figma 設計系統整合 (Vesti/)

### 原始設計專案
- **來源:** https://www.figma.com/design/ZXYNHH6XXKJdPs8Qwws4T3/Vesti
- **框架:** Vite 6.3.5 + React 18.3.1
- **樣式:** 118KB 的 `index.css` (完整設計系統)
- **元件數量:** 25+ 頁面元件 + 40+ UI 元件

### 遷移整合狀態

#### ✅ 已完成 (2025-11-28)
1. **元件遷移:** 所有 73+ 元件已遷移至 `apps/web/app/components/figma/`
2. **樣式整合:** `vesti.css` 與 `vesti-index.css` 已整合
3. **頁面邏輯:** `App.tsx` 核心邏輯已整合至 `apps/web/app/page.tsx`
4. **依賴同步:** Radix UI、Framer Motion 等依賴已統一

#### 元件分類

**頁面元件 (25+):**
- `WardrobePage.tsx` - 衣櫃管理
- `ExplorePage.tsx` - 探索頁面
- `StorePage.tsx` - 商店
- `ProfilePage.tsx` - 個人檔案
- `TryOnPage.tsx` - 虛擬試穿
- `CheckoutPage.tsx` - 結帳
- `DiscountPage.tsx` - 折扣頁面 (已修正語法錯誤)
- `TrendingPage.tsx` - 流行趨勢
- `OutfitCollectionPage.tsx` - 穿搭收藏
- ... (更多頁面元件)

**功能元件:**
- `BottomNav.tsx` - 底部導航
- `WeatherCard.tsx` - 天氣卡片
- `QuickActions.tsx` - 快速操作
- `StackedCards.tsx` - 堆疊卡片
- `OutfitCard.tsx` - 穿搭卡片
- `ClothingCard.tsx` - 服飾卡片
- `OutfitDetailModal.tsx` - 穿搭詳情彈窗
- `UploadClothingButton.tsx` - 上傳服飾按鈕
- `DraggableClothingCard.tsx` - 可拖曳服飾卡片
- `DroppableClothingRow.tsx` - 可放置服飾行

**UI 元件 (40+ Radix 封裝):**
- `ui/button.tsx`, `ui/card.tsx`, `ui/dialog.tsx`
- `ui/accordion.tsx`, `ui/alert-dialog.tsx`, `ui/avatar.tsx`
- `ui/calendar.tsx`, `ui/carousel.tsx`, `ui/chart.tsx`
- `ui/select.tsx`, `ui/slider.tsx`, `ui/switch.tsx`
- `ui/tabs.tsx`, `ui/tooltip.tsx`, `ui/form.tsx`
- ... (完整 Radix UI 套件封裝)

---

## 🛠️ 開發工具與腳本 (scripts/)

### 自動化腳本
```
scripts/
├── migrate-figma-ui.js       # Figma UI 自動遷移腳本 (7790 行)
├── fix-figma-imports.js      # 修正 Figma import 路徑
├── fix-imports.js            # 通用 import 修正
├── smoke.sh                  # 煙霧測試腳本
└── tests/                    # 測試腳本目錄
```

### 重要腳本功能
- **migrate-figma-ui.js:** 自動化將 Vesti Figma 元件遷移至 Next.js 專案
  - 自動添加 `'use client'` directive
  - 修正 import 路徑
  - 生成遷移報告
- **fix-figma-imports.js:** 修正 Figma 元件間的 import 路徑問題

---

## 🚀 基礎設施 (infra/)

### 部署架構
```
infra/
├── k8s/                # Kubernetes 配置
├── terraform/          # Terraform IaC
├── ci/                 # CI/CD Pipeline
└── docker-compose.yml  # 本地開發環境
```

### 部署策略
- **容器化:** Docker + Kubernetes
- **IaC:** Terraform 管理雲端資源
- **CI/CD:** GitHub Actions (推測)

---

## 📊 技術棧總結

### 前端技術
| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 15.0.0 | 前端框架 (App Router) |
| React | 18.3.0 | UI 渲染 |
| TypeScript | 5.9.3 | 型別系統 |
| Tailwind CSS | 4.1.17 | CSS 框架 |
| Framer Motion | 12.23.24 | 動畫 |
| Radix UI | 2.x | Headless UI 元件 |
| Zod | 4.1.13 | Schema 驗證 |
| React Hook Form | 7.66.1 | 表單管理 |
| Sonner | 2.0.7 | Toast 通知 |
| Lucide React | 0.555.0 | Icon 庫 |

### 後端技術
| 技術 | 用途 |
|------|------|
| NestJS | 微服務框架 (推測部分服務) |
| TypeScript | 後端開發語言 |
| LRU Cache | 推薦引擎快取 |

### 開發工具
| 工具 | 版本 | 用途 |
|------|------|------|
| Turbo | - | Monorepo 管理 |
| Vite | 6.3.5 | Figma 專案建構 |
| PostCSS | 8.5.6 | CSS 處理 |
| Autoprefixer | 10.4.22 | CSS 自動前綴 |

---

## 📈 專案規模統計

### 程式碼規模
- **服務層總行數:** ~286 行 (index.ts 主檔案)
- **Figma 元件數量:** 73+ 個 `.tsx` 檔案
- **UI 元件庫:** 40+ Radix UI 封裝元件
- **型別定義:** 13+ 型別模組檔案
- **API Routes:** 10+ Next.js API 端點

### Git 狀態 (截至 2025-11-28)
- **當前分支:** master
- **最近 commit:**
  - bebed34 - 整合 Vesti Figma UI，修正依賴與樣式
  - 73c253e - feat: Add Figma analysis report
  - 2db6610 - 完成 Pages Router 遷移與專案清理

### 修改檔案統計
- **Modified Files:** 80+ 檔案 (主要為 Figma 元件整合)
- **Untracked Files:**
  - `Vesti/` 目錄 (原始設計專案)
  - `docs/` 新文件
  - 新增配置檔案 (`tailwind.config.js`, `next.config.mjs` 等)

---

## 🎯 核心業務邏輯流程

### 1. 推薦引擎流程
```
使用者請求
    ↓
API Route (/api/reco/basket-mixmatch)
    ↓
BasketMixmatchService
    ↓
1. 檢查 LRU Cache
2. getCandidates() - 檢索候選商品
3. generateOutfitCombinations() - 生成組合
4. 去重處理
5. scoreCompatibility() + scoreOccasion() - 評分
6. 排序 & 分頁
    ↓
回傳推薦結果 (BasketMixmatchResponse)
```

### 2. 頁面導航流程
```
使用者點擊 BottomNav
    ↓
onPageChange(pageKey) 觸發
    ↓
setCurrentPage(pageKey) 更新狀態
    ↓
renderPage() 根據 currentPage 渲染
    ↓
Framer Motion 執行切換動畫
    ↓
顯示對應頁面元件
```

### 3. 衣櫃管理流程
```
上傳服飾
    ↓
POST /api/wardrobe/items
    ↓
儲存 WardrobeItem (包含顏色、圖案、分類等屬性)
    ↓
推薦引擎使用衣櫃資料
    ↓
生成個人化穿搭推薦
```

---

## 📝 重要文件

### 專案文件 (docs/)
1. **vesti-app-integration.md** - Vesti App 整合報告
   - 元件同步清單
   - 頁面切換邏輯說明
   - BottomNav 支援頁面
   - DiscountPage 語法修正記錄

2. **figma-integration-report.md** - Figma UI 整合報告
   - 145 個元件遷移記錄
   - 73 個需要 'use client' 的元件
   - 使用範例與測試步驟

3. **vesti-css-integration.md** - CSS 整合文件 (推測)

### 配置檔案
- `turbo.json` - Turborepo 配置 (dev, build pipelines)
- `tsconfig.json` - TypeScript 配置 (路徑別名等)
- `vite.config.ts` - Vite 配置 (Vesti 專案)
- `apps/web/next.config.mjs` - Next.js 配置
- `apps/web/tailwind.config.js` - Tailwind 配置

---

## 🔍 待優化項目

### 1. 程式碼品質
- [ ] 部分檔案有亂碼問題 (已修正 DiscountPage.tsx)
- [ ] 統一 import 路徑規範
- [ ] 新增單元測試覆蓋率

### 2. 架構優化
- [ ] 考慮將 Figma 元件與業務邏輯元件分離
- [ ] 建立統一的 API 客戶端層
- [ ] 完善型別定義與 API 契約

### 3. 效能優化
- [ ] 實作 React Server Components
- [ ] 優化大型 CSS 檔案 (118KB index.css)
- [ ] 圖片 lazy loading 與 CDN 整合

### 4. 文件完善
- [ ] API 端點文件 (Swagger/OpenAPI)
- [ ] 元件 Storybook 建立
- [ ] 部署文件與 SOP

---

## 🚀 快速啟動指令

### 開發模式
```bash
# 安裝依賴
npm install

# 啟動 Web 應用 (Turbopack)
cd apps/web
npm run dev

# 啟動 Vesti 原始專案
cd Vesti
npm run dev

# 執行建構
npm run build
```

### 測試指令
```bash
# 執行測試 (推測)
npm test

# 煙霧測試
./scripts/smoke.sh
```

---

## 📞 專案聯絡資訊

- **Figma 設計稿:** https://www.figma.com/design/ZXYNHH6XXKJdPs8Qwws4T3/Vesti
- **Git Branch:** master
- **專案類型:** Private Monorepo

---

## 🎓 技術決策摘要

### 為什麼選擇 Next.js 15 App Router？
- 原生支援 React Server Components
- 檔案系統路由簡化開發
- API Routes 提供全棧開發能力
- Turbopack 提升開發體驗

### 為什麼使用 Monorepo？
- 共享型別定義與 UI 元件
- 統一依賴管理
- 微服務之間程式碼重用
- 簡化跨專案重構

### 為什麼選擇 Radix UI？
- Headless 設計提供完全樣式控制
- 無障礙性 (Accessibility) 完善
- 與 Tailwind CSS 整合友好
- 活躍社群支援

---

## 📅 專案時間軸

| 日期 | 里程碑 |
|------|--------|
| 2025-09-27 | 專案初始化，建立基礎架構 |
| 2025-10-05 | 完成衣櫃管理與推薦引擎基礎 |
| 2025-11-09 | Pages Router 遷移開始 |
| 2025-11-13 | 完成第 4 階段頁面遷移 (100%) |
| 2025-11-15 | Figma UI 整合 (145 元件遷移) |
| 2025-11-28 | Vesti App 完整整合，修正依賴與樣式 |

---

**報告結束**

此報告涵蓋了 Vesti 專案的完整架構、技術棧、核心業務邏輯與開發狀態。如需更詳細的技術資訊，請參考專案內的各個文件與原始碼。
