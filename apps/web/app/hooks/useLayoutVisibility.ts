import { useAppState, PageType, LoadingState } from '../contexts/AppStateContext';

interface LayoutVisibility {
  showBottomNav: boolean;
  showHeader: boolean;
  showMainContent: boolean;
  showLoadingScreen: boolean;
}

/**
 * 統一管理 layout component 的可見性規則
 * 避免在多個地方重複定義相同的邏輯
 *
 * 規則：
 * - 在 loading 狀態時，只顯示 loading screen
 * - 在 login 頁面，不顯示 BottomNav 和 Header
 * - 在其他頁面，正常顯示所有 UI
 */
export function useLayoutVisibility(): LayoutVisibility {
  const { currentPage, loadingState } = useAppState();

  const isLoading = loadingState === 'loading' || currentPage === null;
  const isLoginPage = currentPage === 'login';

  return {
    // BottomNav 應該在：不 loading，且不在 login 頁面時顯示
    showBottomNav: !isLoading && !isLoginPage,

    // Header 應該在：不 loading，且不在 login 頁面時顯示
    showHeader: !isLoading && !isLoginPage,

    // 主要內容應該在：不 loading 時顯示
    showMainContent: !isLoading,

    // Loading screen 應該在：loading 狀態時顯示
    showLoadingScreen: isLoading,
  };
}

/**
 * 驗證函數 - 用於測試和檢查規則一致性
 * 返回當前狀態下哪些 UI 應該被顯示
 */
export function getLayoutVisibilityRules(
  currentPage: PageType | null,
  loadingState: LoadingState
): LayoutVisibility {
  const isLoading = loadingState === 'loading' || currentPage === null;
  const isLoginPage = currentPage === 'login';

  return {
    showBottomNav: !isLoading && !isLoginPage,
    showHeader: !isLoading && !isLoginPage,
    showMainContent: !isLoading,
    showLoadingScreen: isLoading,
  };
}
