# VESTI 開發指南

此目錄包含 VESTI 應用開發的各種指南和最佳實踐。

## 📋 Available Guides

### UI 和組件相關

#### [Layout Visibility Management Guide](./LAYOUT_VISIBILITY_GUIDE.md)
- **目的**: 管理 UI component 的顯示/隱藏邏輯
- **背景**: 解決 BottomNav 等 UI 元素在特定狀態下閃爍或消失的問題
- **包含內容**:
  - AppStateContext - 中央狀態管理
  - useLayoutVisibility Hook - 統一的可見性規則
  - 測試套件（15+ 個測試案例）
  - 常見錯誤和解決方案

**何時閱讀**:
- 開發涉及條件渲染的新 UI component 時
- 發現 UI 閃爍或消失的問題時
- Code review 涉及條件渲染邏輯時

#### [UI Visibility 檢查清單](./UI_VISIBILITY_CHECKLIST.md)
- **目的**: 快速參考清單，防止 UI 相關的常見問題
- **包含內容**:
  - 開發新 component 時的檢查清單
  - Code review 檢查項目
  - Bug 排查流程
  - 定期維護項目

**何時使用**:
- 在 code review 之前檢查代碼
- 開發新的條件渲染邏輯時
- 出現 UI 問題時的快速診斷

### 相關代碼位置

```
apps/web/app/
├── contexts/
│   └── AppStateContext.tsx          # 中央狀態管理 Context
├── hooks/
│   ├── useLayoutVisibility.ts       # 可見性規則 Hook
│   └── __tests__/
│       └── useLayoutVisibility.test.ts  # 完整測試套件
└── page.tsx                         # 主應用（已應用修正）
```

## 🚀 Quick Start

### 如果要開發新的 UI component

1. 閱讀 [Layout Visibility Management Guide](./LAYOUT_VISIBILITY_GUIDE.md) 的「使用方式」部分
2. 檢查 [UI_VISIBILITY_CHECKLIST.md](./UI_VISIBILITY_CHECKLIST.md) 的「開發新 Component 時」
3. 確保使用 `useLayoutVisibility` Hook 而不是自己寫條件邏輯

### 如果發現 UI 閃爍/消失

1. 看 [UI_VISIBILITY_CHECKLIST.md](./UI_VISIBILITY_CHECKLIST.md) 的「Bug 排查時」
2. 參考 [Layout Visibility Management Guide](./LAYOUT_VISIBILITY_GUIDE.md) 的「監控和調試」
3. 執行測試: `npm test -- useLayoutVisibility.test.ts`

### 在做 Code Review 時

使用 [UI_VISIBILITY_CHECKLIST.md](./UI_VISIBILITY_CHECKLIST.md) 的「Code Review 時」部分的檢查清單

## 📊 測試覆蓋

所有 UI visibility 規則都有完整的測試覆蓋：

```bash
# 執行所有 visibility 相關的測試
npm test -- useLayoutVisibility.test.ts

# 執行所有測試
npm test
```

測試覆蓋包括：
- ✅ Loading state 處理
- ✅ 登入頁面邏輯
- ✅ 主頁面（home, wardrobe, explore, store, profile）
- ✅ 子頁面（tryon, checkout, discount 等）
- ✅ 邊界情況和狀態轉換
- ✅ 回歸測試（確保之前的 bug 不重複發生）

## 📝 最佳實踐總結

### ✅ DO（要做）

- [ ] 使用 `useLayoutVisibility()` Hook 來處理 UI 的顯示/隱藏
- [ ] 在新增條件渲染邏輯時寫對應的測試
- [ ] 考慮 loading state（`null` 和 `loadingState === 'loading'`）
- [ ] 在一個地方（`useLayoutVisibility.ts`）定義所有規則
- [ ] 參考檢查清單進行 code review

### ❌ DON'T（不要做）

- [ ] 在多個地方重複定義相同的條件邏輯
- [ ] 忽略 `null` state 和 loading state
- [ ] 混合使用本地 state 和 context 的 state
- [ ] 新增條件渲染邏輯卻不寫測試

## 🔗 相關文檔

- [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) - 完整項目結構
- [BACKEND_API_REFERENCE.md](../BACKEND_API_REFERENCE.md) - API 文檔
- [git-github-guide.md](../git-github-guide.md) - Git 使用指南

## 🤔 常見問題

**Q: 我該何時使用 useLayoutVisibility？**
A: 任何涉及條件渲染（`{condition && <Component />}`）的地方。

**Q: 現有代碼沒有使用 useLayoutVisibility 怎麼辦？**
A: 逐步重構。優先重構涉及 `currentPage` 或 `loadingState` 的條件渲染邏輯。

**Q: 新增一個頁面需要做什麼？**
A:
1. 在 `AppStateContext.tsx` 的 `pageHierarchy` 中新增
2. 在 `useLayoutVisibility.ts` 中檢查是否需要特殊規則
3. 寫對應的測試

**Q: 如何調試 UI visibility 相關的問題？**
A: 見 [Layout Visibility Management Guide](./LAYOUT_VISIBILITY_GUIDE.md) 的「監控和調試」部分

## 📞 需要幫助？

1. 查看相關的 .md 文件
2. 執行測試看是否能重現問題
3. 檢查 git history 看類似的修改怎麼做
4. 在 code review 中提出問題
