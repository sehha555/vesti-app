# Layout Visibility Management Guide

## 問題背景

之前 BottomNav 會在初始化時短暫出現，然後消失。原因是：
1. `currentPage` 初始化為 `null`（loading state）
2. 條件渲染只檢查 `currentPage !== 'login'`，沒有考慮 `null` 的情況
3. Auth check 完成後，`currentPage` 變成 'login'
4. BottomNav 才根據新的狀態隱藏

這個問題容易在其他 UI component 上重複發生。

## 解決方案架構

### 1. AppStateContext - 中央狀態管理

統一管理所有與頁面狀態相關的邏輯，包括：
- `currentPage`: 當前頁面
- `previousPage`: 前一個頁面
- `loadingState`: 'loading' | 'ready' | 'error'
- `navigationDirection`: 導航方向
- `isAuthenticated`: 認證狀態

```typescript
const { currentPage, loadingState, isAuthenticated } = useAppState();
```

### 2. useLayoutVisibility - 統一的可見性規則

集中定義所有 UI component 應該在何時顯示/隱藏，而不是在每個地方重複定義邏輯。

```typescript
const { showBottomNav, showHeader, showMainContent, showLoadingScreen } = useLayoutVisibility();
```

### 3. 可見性規則（Rules）

| Component | Loading | Login | Home/Main Pages | Sub Pages |
|-----------|---------|-------|-----------------|-----------|
| BottomNav | ✗       | ✗     | ✓               | ✓         |
| Header    | ✗       | ✗     | ✓               | ✓         |
| MainContent | ✗     | ✓     | ✓               | ✓         |
| LoadingScreen | ✓    | ✗     | ✗               | ✗         |

## 使用方式

### Step 1: 在根組件包裹 AppStateProvider

```typescript
// app/layout.tsx 或 app/page.tsx 的頂層
import { AppStateProvider } from './contexts/AppStateContext';

export default function RootLayout({ children }) {
  return (
    <AppStateProvider>
      {/* 你的應用內容 */}
    </AppStateProvider>
  );
}
```

### Step 2: 在需要的地方使用 useLayoutVisibility

```typescript
import { useLayoutVisibility } from '@/hooks/useLayoutVisibility';

export default function Page() {
  const { showBottomNav, showHeader, showMainContent, showLoadingScreen } = useLayoutVisibility();

  return (
    <>
      {showLoadingScreen && <LoadingScreen />}

      <main>
        {showHeader && <Header />}

        {showMainContent && <PageContent />}
      </main>

      {showBottomNav && <BottomNav />}
    </>
  );
}
```

### Step 3: 用 useAppState 替代直接的 useState

不要這樣做：
```typescript
// ❌ 不推薦 - 本地 state，邏輯分散
const [currentPage, setCurrentPage] = useState('login');
```

要這樣做：
```typescript
// ✅ 推薦 - 使用 Context，邏輯統一
const { currentPage, setCurrentPage } = useAppState();
```

## 測試

### 執行測試

```bash
npm test -- useLayoutVisibility.test.ts
```

### 測試涵蓋範圍

1. **Loading State** - 驗證在 loading 時所有 UI 都隱藏
2. **Login Page** - 驗證在 login 頁面 BottomNav 隱藏
3. **Main Pages** - 驗證在 home/wardrobe/etc. 時所有 UI 顯示
4. **Sub Pages** - 驗證在 sub pages 時 BottomNav 仍顯示（方便返回）
5. **Edge Cases** - 驗證狀態轉換時沒有邏輯錯誤
6. **Regression Tests** - 驗證之前的 bug 不會再發生

### 新增測試時的清單

如果要新增 UI component 或修改可見性規則，應該：

- [ ] 在 `useLayoutVisibility.ts` 更新規則
- [ ] 在 `useLayoutVisibility.test.ts` 新增對應的測試
- [ ] 執行 `npm test` 確保所有測試通過
- [ ] 更新本文件的規則表

## 常見錯誤

### ❌ 錯誤 1: 在多個地方重複定義條件

```typescript
// 在 page.tsx
{currentPage !== 'login' && <BottomNav />}

// 在另一個檔案
{currentPage !== null && currentPage !== 'login' && <Header />}

// 在又另一個檔案
{loadingState !== 'loading' && currentPage !== 'login' && <SomeUI />}
```

這樣會導致邏輯不一致。

### ✅ 正確做法: 使用 useLayoutVisibility

```typescript
// 在任何檔案
const { showBottomNav } = useLayoutVisibility();
{showBottomNav && <BottomNav />}
```

### ❌ 錯誤 2: 忘記考慮 null state

```typescript
// ❌ 不完整 - 沒考慮 null
{currentPage !== 'login' && <BottomNav />}

// ✅ 完整
{currentPage !== null && currentPage !== 'login' && <BottomNav />}
```

### ❌ 錯誤 3: 混合不同的 state source

```typescript
// ❌ 混合使用 - 容易出錯
const [localCurrentPage, setLocalCurrentPage] = useState(null);
const { currentPage: contextCurrentPage } = useAppState();

// 應該只用一個 source
```

## 擴展規則

如果需要新增頁面或修改可見性規則：

1. 確認新規則應該適用的場景
2. 在 `getLayoutVisibilityRules()` 中更新邏輯
3. 寫對應的測試
4. 更新此文件的規則表

例如，如果要在某些 sub pages 隱藏 Header：

```typescript
// useLayoutVisibility.ts
const isHeaderHiddenPage = ['checkout', 'payment-methods'].includes(currentPage);

return {
  showHeader: !isLoading && !isLoginPage && !isHeaderHiddenPage,
  // ...
};

// 對應測試
it('should hide header on checkout page', () => {
  const result = getLayoutVisibilityRules('checkout', 'ready');
  expect(result.showHeader).toBe(false);
});
```

## 監控和調試

### 在瀏覽器控制台檢查

```typescript
// 在任何 component 中暫時加入
const { currentPage, loadingState } = useAppState();
const visibility = useLayoutVisibility();
console.log('Current Page:', currentPage);
console.log('Loading State:', loadingState);
console.log('Visibility:', visibility);
```

### 常見調試場景

**症狀**: BottomNav 閃爍出現又消失
```
原因: 可能 loadingState 沒正確設定
檢查: useAppState() 的 loadingState 值
```

**症狀**: Header 在不該顯示的地方出現
```
原因: 可能頁面規則定義有誤
檢查: getLayoutVisibilityRules() 邏輯
修正: 新增測試，確保規則正確
```

## 相關文件

- `apps/web/app/contexts/AppStateContext.tsx` - 中央狀態管理
- `apps/web/app/hooks/useLayoutVisibility.ts` - 可見性規則
- `apps/web/app/hooks/__tests__/useLayoutVisibility.test.ts` - 測試套件
- `docs/guides/UI_VISIBILITY_CHECKLIST.md` - 檢查清單
