/**
 * UI Visibility Matrix - 定義每個 UI 在各應用狀態下的可見性
 *
 * 用途：
 * - 作為單位測試的數據來源
 * - 作為集成測試的期望值
 * - 自動生成測試案例
 * - 檔案結構變化時易於更新
 */

import type { PageType, LoadingState } from '../contexts/AppStateContext';

/** 應用狀態定義 */
export interface AppState {
  name: string; // 狀態名稱（便於閱讀）
  currentPage: PageType | null;
  loadingState: LoadingState;
  isAuthenticated: boolean;
}

/** 可見性期望值 */
export interface VisibilityExpectation {
  state: string; // 應用狀態名稱
  ui: string; // UI 元件 key（來自 uiRegistry）
  visible: boolean; // 是否應該可見
  reason?: string; // 原因說明
}

/**
 * 所有應用狀態組合
 * 覆蓋所有路由、認証狀態、加載狀態的組合
 */
export const appStates: AppState[] = [
  // ===== 初始加載狀態 =====
  {
    name: 'init_loading',
    currentPage: null,
    loadingState: 'loading',
    isAuthenticated: false,
  },

  // ===== 未認證狀態 =====
  {
    name: 'login_page_unauth',
    currentPage: 'login',
    loadingState: 'ready',
    isAuthenticated: false,
  },

  // ===== 已認証 + 主頁面 =====
  {
    name: 'home_authenticated',
    currentPage: 'home',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'wardrobe_authenticated',
    currentPage: 'wardrobe',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'explore_authenticated',
    currentPage: 'explore',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'store_authenticated',
    currentPage: 'store',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'profile_authenticated',
    currentPage: 'profile',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  // ===== 已認証 + 子頁面 =====
  {
    name: 'tryon_authenticated',
    currentPage: 'tryon',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'checkout_authenticated',
    currentPage: 'checkout',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'discount_authenticated',
    currentPage: 'discount',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'trending_authenticated',
    currentPage: 'trending',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'upload_authenticated',
    currentPage: 'upload',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  {
    name: 'broadcast_authenticated',
    currentPage: 'broadcast',
    loadingState: 'ready',
    isAuthenticated: true,
  },

  // ===== 錯誤狀態 =====
  {
    name: 'error_state',
    currentPage: 'home',
    loadingState: 'error',
    isAuthenticated: true,
  },

  // ===== 回歸測試：加載 -> 就緒的轉換 =====
  {
    name: 'loading_to_home_transition',
    currentPage: null, // 表示轉換中的中間狀態
    loadingState: 'ready',
    isAuthenticated: true,
  },
];

/**
 * UI 可見性期望值規則
 *
 * 規則邏輯：
 * - 在加載狀態 (loadingState === 'loading' || currentPage === null) 時：只顯示 LoadingScreen，隱藏所有其他 UI
 * - 在未認証 (isAuthenticated === false) 時：只顯示登入頁面相關 UI，隱藏 BottomNav 等
 * - 在已認証 + 主頁面時：顯示 BottomNav、Header、Footer 等
 * - 在已認証 + 子頁面時：BottomNav 仍顯示供返回，但某些 Header 可能不同
 */
export const visibilityExpectations: VisibilityExpectation[] = [
  // ===== init_loading 狀態 =====
  { state: 'init_loading', ui: 'loading-screen', visible: true, reason: '初始加載時顯示加載畫面' },
  { state: 'init_loading', ui: 'bottom-nav', visible: false, reason: '加載中隱藏導航欄' },
  { state: 'init_loading', ui: 'page-header', visible: false, reason: '加載中隱藏頁面頭部' },
  { state: 'init_loading', ui: 'error-boundary', visible: true, reason: '錯誤邊界始終包裝應用' },

  // ===== login_page_unauth 狀態 =====
  { state: 'login_page_unauth', ui: 'loading-screen', visible: false, reason: '登入頁不需加載畫面' },
  { state: 'login_page_unauth', ui: 'bottom-nav', visible: false, reason: '登入頁隱藏導航欄' },
  { state: 'login_page_unauth', ui: 'page-header', visible: false, reason: '登入頁隱藏頁面頭部' },
  { state: 'login_page_unauth', ui: 'error-boundary', visible: true, reason: '錯誤邊界始終包裝應用' },

  // ===== home_authenticated 狀態 =====
  { state: 'home_authenticated', ui: 'loading-screen', visible: false, reason: '已加載不需加載畫面' },
  { state: 'home_authenticated', ui: 'bottom-nav', visible: true, reason: '主頁顯示導航欄' },
  { state: 'home_authenticated', ui: 'page-header', visible: true, reason: '主頁顯示頁面頭部' },
  { state: 'home_authenticated', ui: 'error-boundary', visible: true },
  { state: 'home_authenticated', ui: 'toaster', visible: true, reason: '提供通知功能' },

  // ===== wardrobe_authenticated 狀態 =====
  { state: 'wardrobe_authenticated', ui: 'bottom-nav', visible: true, reason: '衣櫃頁顯示導航欄' },
  { state: 'wardrobe_authenticated', ui: 'floating-basket', visible: true, reason: '衣櫃頁可拖曳衣服到籃子' },
  { state: 'wardrobe_authenticated', ui: 'loading-screen', visible: false },
  { state: 'wardrobe_authenticated', ui: 'error-boundary', visible: true },

  // ===== explore_authenticated 狀態 =====
  { state: 'explore_authenticated', ui: 'bottom-nav', visible: true, reason: '探索頁顯示導航欄' },
  { state: 'explore_authenticated', ui: 'explore-header', visible: true, reason: '探索頁顯示自己的標題' },
  { state: 'explore_authenticated', ui: 'error-boundary', visible: true },

  // ===== store_authenticated 狀態 =====
  { state: 'store_authenticated', ui: 'bottom-nav', visible: true, reason: '商店頁顯示導航欄' },
  { state: 'store_authenticated', ui: 'store-header', visible: true, reason: '商店頁顯示搜尋/篩選欄' },
  { state: 'store_authenticated', ui: 'floating-basket', visible: true, reason: '商店頁可拖曳衣服' },
  { state: 'store_authenticated', ui: 'error-boundary', visible: true },

  // ===== profile_authenticated 狀態 =====
  { state: 'profile_authenticated', ui: 'bottom-nav', visible: true, reason: '個人頁顯示導航欄' },
  { state: 'profile_authenticated', ui: 'profile-header', visible: true, reason: '個人頁顯示設定/登出' },
  { state: 'profile_authenticated', ui: 'error-boundary', visible: true },

  // ===== 子頁面（需要 BottomNav 供返回） =====
  { state: 'tryon_authenticated', ui: 'bottom-nav', visible: true, reason: '試穿頁顯示導航欄供返回' },
  { state: 'tryon_authenticated', ui: 'tryon-action-bar', visible: true, reason: '試穿頁固定操作欄' },
  { state: 'tryon_authenticated', ui: 'tryon-header', visible: true },
  { state: 'tryon_authenticated', ui: 'error-boundary', visible: true },

  { state: 'checkout_authenticated', ui: 'bottom-nav', visible: true, reason: '結帳頁顯示導航欄' },
  { state: 'checkout_authenticated', ui: 'checkout-action-bar', visible: true, reason: '結帳頁固定操作欄' },
  { state: 'checkout_authenticated', ui: 'checkout-header', visible: true },
  { state: 'checkout_authenticated', ui: 'error-boundary', visible: true },

  { state: 'discount_authenticated', ui: 'bottom-nav', visible: true, reason: '折扣頁顯示導航欄' },
  { state: 'discount_authenticated', ui: 'discount-header', visible: true },
  { state: 'discount_authenticated', ui: 'error-boundary', visible: true },

  { state: 'trending_authenticated', ui: 'bottom-nav', visible: true, reason: '趨勢頁顯示導航欄' },
  { state: 'trending_authenticated', ui: 'trending-header', visible: true },
  { state: 'trending_authenticated', ui: 'error-boundary', visible: true },

  { state: 'upload_authenticated', ui: 'bottom-nav', visible: true, reason: '上傳頁顯示導航欄' },
  { state: 'upload_authenticated', ui: 'error-boundary', visible: true },

  { state: 'broadcast_authenticated', ui: 'bottom-nav', visible: true, reason: '廣播頁顯示導航欄' },
  { state: 'broadcast_authenticated', ui: 'broadcast-header', visible: true },
  { state: 'broadcast_authenticated', ui: 'error-boundary', visible: true },

  // ===== 錯誤狀態 =====
  { state: 'error_state', ui: 'error-boundary', visible: true, reason: '顯示錯誤信息' },
  { state: 'error_state', ui: 'bottom-nav', visible: true, reason: '錯誤時仍應顯示導航供用戶返回' },

  // ===== 回歸測試：loading_to_home_transition =====
  { state: 'loading_to_home_transition', ui: 'loading-screen', visible: false, reason: 'loadingState ready 時隱藏加載畫面' },
  { state: 'loading_to_home_transition', ui: 'bottom-nav', visible: false, reason: 'currentPage 為 null 時隱藏 BottomNav（轉換中的保險措施）' },
  { state: 'loading_to_home_transition', ui: 'error-boundary', visible: true },

  // ===== Priority 3: 模態框和對話框 =====
  // Quiz Modal - 在穿搭推薦或初始設定時出現
  { state: 'home_authenticated', ui: 'quiz-modal', visible: false, reason: '預設隱藏，由用戶交互觸發' },
  { state: 'wardrobe_authenticated', ui: 'quiz-modal', visible: false },

  // Address Modal - 在結帳時出現
  { state: 'checkout_authenticated', ui: 'address-modal', visible: false, reason: '預設隱藏，用戶點擊編輯地址時出現' },

  // Payment Card Modal - 在結帳時出現
  { state: 'checkout_authenticated', ui: 'payment-card-modal', visible: false, reason: '預設隱藏，用戶添加新信用卡時出現' },

  // Upload Options Dialog - 在上傳頁面時出現
  { state: 'upload_authenticated', ui: 'upload-options-dialog', visible: false, reason: '預設隱藏，用戶點擊上傳時出現' },

  // Create Category Dialog - 在衣櫃頁面時出現
  { state: 'wardrobe_authenticated', ui: 'create-category-dialog', visible: false, reason: '預設隱藏，用戶點擊新增分類時出現' },

  // Card Skeleton - 在首次載入或數據加載時出現
  { state: 'home_authenticated', ui: 'card-skeleton', visible: false, reason: '預設隱藏，只在加載數據時短暫顯示' },
  { state: 'wardrobe_authenticated', ui: 'card-skeleton', visible: false },
  { state: 'store_authenticated', ui: 'card-skeleton', visible: false },

  // ===== Priority 4-5: 頁面粘性標題 =====
  // Priority 4: 頁面粘性標題 (在各對應頁面顯示)
  { state: 'checkout_authenticated', ui: 'checkout-header', visible: true, reason: '結帳頁粘性標題' },
  { state: 'home_authenticated', ui: 'cpw-ranking-header', visible: false, reason: '预设隐藏，从主页导航时出现' },
  { state: 'home_authenticated', ui: 'delivery-tracking-header', visible: false, reason: '预设隐藏，从主页导航时出现' },
  { state: 'profile_authenticated', ui: 'profile-header', visible: true, reason: '個人檔案頁粘性標題' },
  { state: 'store_authenticated', ui: 'store-header', visible: true, reason: '商店頁粘性標題' },
  { state: 'explore_authenticated', ui: 'explore-header', visible: true, reason: '探索頁粘性標題' },
  { state: 'tryon_authenticated', ui: 'tryon-header', visible: true, reason: '試穿頁粘性標題' },

  // Priority 5: 廣播/趨勢標題
  { state: 'broadcast_authenticated', ui: 'broadcast-header', visible: true, reason: '廣播頁粘性標題' },
  { state: 'trending_authenticated', ui: 'trending-header', visible: true, reason: '趨勢頁粘性標題' },
  { state: 'discount_authenticated', ui: 'discount-header', visible: true, reason: '折扣頁粘性標題' },
];

/**
 * 依狀態取得期望的 UI 可見性
 */
export function getExpectationsForState(stateName: string): VisibilityExpectation[] {
  return visibilityExpectations.filter((exp) => exp.state === stateName);
}

/**
 * 依 UI 取得所有狀態的期望值
 */
export function getExpectationsForUI(uiKey: string): VisibilityExpectation[] {
  return visibilityExpectations.filter((exp) => exp.ui === uiKey);
}

/**
 * 驗證可見性期望值的一致性
 * 用於開發時檢查是否有遺漏或衝突
 */
export function validateMatrix(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 檢查所有期望值引用的狀態是否存在
  const stateNames = appStates.map((s) => s.name);
  const usedStates = new Set(visibilityExpectations.map((e) => e.state));

  usedStates.forEach((stateName) => {
    if (!stateNames.includes(stateName)) {
      errors.push(`期望值引用了未定義的狀態: ${stateName}`);
    }
  });

  // 檢查初始化狀態應該只顯示 loading-screen 和 error-boundary
  const initLoadingExpectations = visibilityExpectations.filter((e) => e.state === 'init_loading');
  const visibleUIs = initLoadingExpectations.filter((e) => e.visible).map((e) => e.ui);
  if (!visibleUIs.includes('loading-screen')) {
    errors.push('init_loading 狀態應該顯示 loading-screen');
  }
  visibleUIs.forEach((ui) => {
    if (!['loading-screen', 'error-boundary'].includes(ui)) {
      errors.push(`init_loading 狀態不應該顯示 ${ui}`);
    }
  });

  // 檢查登入狀態應該隱藏 bottom-nav
  const loginExpectations = visibilityExpectations.filter((e) => e.state === 'login_page_unauth');
  const loginVisibleUIs = loginExpectations.filter((e) => e.visible).map((e) => e.ui);
  if (loginVisibleUIs.includes('bottom-nav')) {
    errors.push('login_page_unauth 狀態不應該顯示 bottom-nav');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
