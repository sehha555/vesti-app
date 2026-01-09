# UI Visibility 檢查清單

快速參考，避免重複發生 BottomNav 消失的問題。

## 開發新 Component 時

### 新增條件渲染 UI 的檢查清單

- [ ] **確認這個 UI 何時應該顯示**
  - 在 loading 時？
  - 在 login 頁面？
  - 只在特定頁面？
  - 在所有頁面？

- [ ] **使用 useLayoutVisibility 而不是自己寫邏輯**
  ```typescript
  // ❌ 不要
  {currentPage !== 'login' && <MyComponent />}

  // ✅ 要
  const { showBottomNav } = useLayoutVisibility();
  {showBottomNav && <MyComponent />}
  ```

- [ ] **如果沒有現成的規則，新增到 useLayoutVisibility**
  ```typescript
  // useLayoutVisibility.ts
  const showMyComponent = !isLoading && !isLoginPage && someOtherCondition;
  return {
    // ...
    showMyComponent,
  };
  ```

- [ ] **寫測試驗證所有狀態組合**
  ```typescript
  // useLayoutVisibility.test.ts
  it('should show MyComponent on home page', () => {
    const result = getLayoutVisibilityRules('home', 'ready');
    expect(result.showMyComponent).toBe(true);
  });
  ```

- [ ] **檢查邊界情況**
  - 從 loading 轉換到 ready 時會發生什麼？
  - 從 home 跳到 login 時會發生什麼？
  - 從 null 狀態轉換時會發生什麼？

## Code Review 時

### 審查新的條件渲染代碼

- [ ] **有沒有考慮 null / loading state？**
  ```typescript
  // ❌ 有問題
  {currentPage !== 'login' && <Component />}
  // 當 currentPage === null 時會顯示

  // ✅ 正確
  {currentPage !== null && currentPage !== 'login' && <Component />}
  // 或使用 useLayoutVisibility
  ```

- [ ] **有沒有重複定義相同的邏輯？**
  - 搜尋類似的條件（e.g., `currentPage !== 'login'`）
  - 如果出現多次，應該統一到 useLayoutVisibility

- [ ] **有沒有寫對應的測試？**
  - 新增條件渲染邏輯 → 應該有對應的測試

- [ ] **loadingState 有沒有被正確處理？**
  - 如果用到 `currentPage === null`，應該也考慮 `loadingState === 'loading'`

## Bug 排查時

### 如果發現 UI 閃爍或消失

1. **確認當前狀態**
   ```typescript
   const { currentPage, loadingState } = useAppState();
   console.log('currentPage:', currentPage);
   console.log('loadingState:', loadingState);
   ```

2. **檢查條件邏輯**
   ```typescript
   const visibility = useLayoutVisibility();
   console.log('visibility:', visibility);
   ```

3. **根據問題類型排查**

   **症狀: UI 閃爍（短暫出現又消失）**
   ```
   可能原因: 沒有考慮 null state
   解決: 加入 currentPage !== null 檢查
   或: 使用 useLayoutVisibility
   ```

   **症狀: UI 完全不顯示**
   ```
   可能原因: 邏輯反向或條件過於嚴格
   解決: 檢查 useLayoutVisibility 的規則
   ```

   **症狀: UI 在錯誤的地方出現**
   ```
   可能原因: 條件定義錯誤
   解決: 看 useLayoutVisibility 的規則，可能需要新增例外情況
   ```

4. **驗證修正**
   - 執行測試: `npm test`
   - 手動測試各個頁面轉換
   - 特別測試 loading → ready 的轉換

## 定期維護

### 每週檢查

- [ ] 看 git log，有沒有新的條件渲染邏輯？
  ```bash
  git log --grep="condition\|visibility\|render" -i
  ```

- [ ] 有沒有新增的頁面沒有加到 useLayoutVisibility？
  ```bash
  grep -r "case '" apps/web/app/ | grep -v "test"
  ```

### 每個 Sprint 檢查

- [ ] 執行所有 visibility 測試
  ```bash
  npm test -- useLayoutVisibility.test.ts
  ```

- [ ] 看有沒有未覆蓋的頁面組合
  - 新頁面 + loading state
  - 新頁面 + 在不同的 previousPage 情況下進入

## 快速參考

### 所有頁面及其 Level

```typescript
// Main Pages (Level 1) - 應該顯示 BottomNav
- home
- wardrobe
- explore
- store
- profile

// Sub Pages (Level 2) - 應該顯示 BottomNav
- tryon (來自 home/store)
- checkout
- discount
- trending
- upload (來自 wardrobe)
- broadcast (來自 wardrobe)
- calendar
- cpwranking
- delivery
- notification
- payment-methods

// Special Pages (Level 0) - 不顯示 BottomNav
- login
```

### 所有 UI Component 的可見性規則

| UI Component | Loading | Login | Main Pages | Sub Pages | Notes |
|------------|---------|-------|-----------|-----------|-------|
| BottomNav | Hide | Hide | Show | Show | 用於導航 |
| Header | Hide | Hide | Show | Show | 包含 logo 和操作按鈕 |
| MainContent | Hide | Show | Show | Show | 主要頁面內容 |
| LoadingScreen | Show | Hide | Hide | Hide | 初始化時顯示 |

## 相關文件位置

```
apps/web/app/
├── contexts/
│   └── AppStateContext.tsx          ← 中央狀態管理
├── hooks/
│   ├── useLayoutVisibility.ts       ← 可見性規則
│   └── __tests__/
│       └── useLayoutVisibility.test.ts
└── page.tsx                         ← 主應用（已手動修正）

docs/guides/
├── LAYOUT_VISIBILITY_GUIDE.md       ← 詳細指南
└── UI_VISIBILITY_CHECKLIST.md       ← 本文件
```
