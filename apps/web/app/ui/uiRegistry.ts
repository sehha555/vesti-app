/**
 * UI Registry - 集中管理所有全域/固定/覆蓋型 UI 元件
 * 用於回歸測試、可見性規則、自動選擇器生成
 *
 * 欄位說明：
 * - key: 機器可讀的識別符（kebab-case）
 * - filePath: 元件所在檔案路徑
 * - testId: 用於測試定位的 data-testid 值
 * - uiType: "fixed" | "sticky" | "overlay" | "page" | "toast" | "loading"
 * - priority: 1-5，1 = 最關鍵（必須測試）
 * - description: 用途說明
 * - conditions?: 顯示的前置條件
 */

export interface UIElement {
  key: string;
  filePath: string;
  testId: string;
  uiType: 'fixed' | 'sticky' | 'overlay' | 'page' | 'toast' | 'loading';
  priority: 1 | 2 | 3 | 4 | 5;
  description: string;
  conditions?: {
    page?: string[];
    requireAuth?: boolean;
    requireLoading?: boolean;
  };
}

/**
 * 所有需測試的 UI 元件清單
 *
 * 優先級說明：
 * - 1: 最關鍵 - BottomNav, Header, LoadingScreen, ErrorBoundary
 * - 2: 高優先 - Modal, Overlay, ActionBar
 * - 3: 中優先 - Toast, Skeleton
 * - 4: 低優先 - 頁面內部的粘性元素
 * - 5: 最低 - 可選/附加功能
 */
export const uiRegistry: UIElement[] = [
  // ===== Priority 1: 最關鍵 =====

  {
    key: 'bottom-nav',
    filePath: 'apps/web/app/components/figma/BottomNav.tsx',
    testId: 'bottom-nav',
    uiType: 'fixed',
    priority: 1,
    description: '底部標籤導航欄 (首頁、衣櫃、探索、商店、個人)',
    conditions: {
      page: ['home', 'wardrobe', 'explore', 'store', 'profile', 'tryon', 'checkout', 'discount', 'trending', 'upload', 'broadcast', 'calendar', 'cpwranking', 'delivery', 'notification', 'payment-methods'],
      requireAuth: true,
    },
  },

  {
    key: 'loading-screen',
    filePath: 'apps/web/app/page.tsx',
    testId: 'loading-screen',
    uiType: 'loading',
    priority: 1,
    description: '初始化身份驗證時的加載畫面',
    conditions: {
      requireLoading: true,
    },
  },

  {
    key: 'error-boundary',
    filePath: 'apps/web/app/components/figma/ErrorBoundary.tsx',
    testId: 'error-boundary',
    uiType: 'page',
    priority: 1,
    description: '全局錯誤邊界，捕獲運行時錯誤',
  },

  // ===== Priority 2: 高優先 =====

  {
    key: 'page-header',
    filePath: 'apps/web/app/page.tsx',
    testId: 'page-header',
    uiType: 'sticky',
    priority: 2,
    description: '頁面頂部標題欄 (VESTI logo + 購物車/通知)',
    conditions: {
      page: ['home'],
      requireAuth: true,
    },
  },

  {
    key: 'outfit-detail-modal',
    filePath: 'apps/web/app/components/figma/OutfitDetailModal.tsx',
    testId: 'outfit-detail-modal',
    uiType: 'overlay',
    priority: 2,
    description: '穿搭詳細資訊模態框（從底部滑出）',
  },

  {
    key: 'clothing-detail-modal',
    filePath: 'apps/web/app/components/figma/ClothingDetailModal.tsx',
    testId: 'clothing-detail-modal',
    uiType: 'overlay',
    priority: 2,
    description: '衣服詳細資訊模態框',
  },

  {
    key: 'floating-basket',
    filePath: 'apps/web/app/components/figma/FloatingBasket.tsx',
    testId: 'floating-basket',
    uiType: 'fixed',
    priority: 2,
    description: '浮動試穿籃（可拖曳的購物籃）',
    conditions: {
      page: ['wardrobe', 'store'],
    },
  },

  {
    key: 'checkout-action-bar',
    filePath: 'apps/web/app/components/figma/CheckoutPage.tsx',
    testId: 'checkout-action-bar',
    uiType: 'fixed',
    priority: 2,
    description: '結帳頁面固定操作欄（結帳按鈕、訂單摘要）',
    conditions: {
      page: ['checkout'],
      requireAuth: true,
    },
  },

  {
    key: 'tryon-action-bar',
    filePath: 'apps/web/app/components/figma/TryOnPage.tsx',
    testId: 'tryon-action-bar',
    uiType: 'fixed',
    priority: 2,
    description: '試穿頁面固定操作欄',
    conditions: {
      page: ['tryon'],
      requireAuth: true,
    },
  },

  {
    key: 'toaster',
    filePath: 'apps/web/app/components/figma/ui/sonner.tsx',
    testId: 'toaster',
    uiType: 'toast',
    priority: 2,
    description: '全局 Toast 通知系統',
  },

  // ===== Priority 3: 中優先 =====

  {
    key: 'quiz-modal',
    filePath: 'apps/web/app/components/figma/QuizModal.tsx',
    testId: 'quiz-modal',
    uiType: 'overlay',
    priority: 3,
    description: '穿搭偏好問卷模態框',
  },

  {
    key: 'address-modal',
    filePath: 'apps/web/app/components/figma/AddressModal.tsx',
    testId: 'address-modal',
    uiType: 'overlay',
    priority: 3,
    description: '配送地址編輯模態框',
  },

  {
    key: 'payment-card-modal',
    filePath: 'apps/web/app/components/figma/AddPaymentCardModal.tsx',
    testId: 'payment-card-modal',
    uiType: 'overlay',
    priority: 3,
    description: '新增信用卡模態框',
  },

  {
    key: 'upload-options-dialog',
    filePath: 'apps/web/app/components/figma/UploadOptionsDialog.tsx',
    testId: 'upload-options-dialog',
    uiType: 'overlay',
    priority: 3,
    description: '上傳選項對話框 (相機 vs 相簿)',
  },

  {
    key: 'create-category-dialog',
    filePath: 'apps/web/app/components/figma/CreateCategoryDialog.tsx',
    testId: 'create-category-dialog',
    uiType: 'overlay',
    priority: 3,
    description: '建立衣服分類對話框',
  },

  {
    key: 'card-skeleton',
    filePath: 'apps/web/app/components/figma/CardSkeleton.tsx',
    testId: 'card-skeleton',
    uiType: 'page',
    priority: 3,
    description: '卡片加載骨架屏',
  },

  // ===== Priority 4: 低優先 =====

  {
    key: 'checkout-header',
    filePath: 'apps/web/app/components/figma/CheckoutPage.tsx',
    testId: 'checkout-header',
    uiType: 'sticky',
    priority: 4,
    description: '結帳頁面粘性標題',
    conditions: {
      page: ['checkout'],
    },
  },

  {
    key: 'cpw-ranking-header',
    filePath: 'apps/web/app/components/figma/CPWRankingFullPage.tsx',
    testId: 'cpw-ranking-header',
    uiType: 'sticky',
    priority: 4,
    description: 'CPW 排名頁面粘性標題',
    conditions: {
      page: ['cpwranking'],
    },
  },

  {
    key: 'delivery-tracking-header',
    filePath: 'apps/web/app/components/figma/DeliveryTrackingPage.tsx',
    testId: 'delivery-tracking-header',
    uiType: 'sticky',
    priority: 4,
    description: '配送追蹤頁面粘性標題',
    conditions: {
      page: ['delivery'],
    },
  },

  {
    key: 'profile-header',
    filePath: 'apps/web/app/components/figma/ProfilePage.tsx',
    testId: 'profile-header',
    uiType: 'sticky',
    priority: 4,
    description: '個人資料頁面粘性標題',
    conditions: {
      page: ['profile'],
    },
  },

  {
    key: 'store-header',
    filePath: 'apps/web/app/components/figma/StorePage.tsx',
    testId: 'store-header',
    uiType: 'sticky',
    priority: 4,
    description: '商店頁面粘性標題',
    conditions: {
      page: ['store'],
    },
  },

  {
    key: 'explore-header',
    filePath: 'apps/web/app/components/figma/ExplorePage.tsx',
    testId: 'explore-header',
    uiType: 'sticky',
    priority: 4,
    description: '探索頁面粘性標題',
    conditions: {
      page: ['explore'],
    },
  },

  {
    key: 'tryon-header',
    filePath: 'apps/web/app/components/figma/TryOnPage.tsx',
    testId: 'tryon-header',
    uiType: 'sticky',
    priority: 4,
    description: '試穿頁面粘性標題',
    conditions: {
      page: ['tryon'],
    },
  },

  // ===== Priority 5: 最低 =====

  {
    key: 'broadcast-header',
    filePath: 'apps/web/app/components/figma/BroadcastPage.tsx',
    testId: 'broadcast-header',
    uiType: 'sticky',
    priority: 5,
    description: '廣播/分享頁面粘性標題',
    conditions: {
      page: ['broadcast'],
    },
  },

  {
    key: 'trending-header',
    filePath: 'apps/web/app/components/figma/TrendingPage.tsx',
    testId: 'trending-header',
    uiType: 'sticky',
    priority: 5,
    description: '趨勢頁面粘性標題',
    conditions: {
      page: ['trending'],
    },
  },

  {
    key: 'discount-header',
    filePath: 'apps/web/app/components/figma/DiscountPage.tsx',
    testId: 'discount-header',
    uiType: 'sticky',
    priority: 5,
    description: '折扣頁面粘性標題',
    conditions: {
      page: ['discount'],
    },
  },
];

/**
 * 依優先級過濾 UI 元件
 */
export function getUIByPriority(minPriority: number): UIElement[] {
  return uiRegistry.filter((ui) => ui.priority <= minPriority);
}

/**
 * 依頁面過濾 UI 元件
 */
export function getUIByPage(page: string): UIElement[] {
  return uiRegistry.filter((ui) => {
    if (!ui.conditions?.page) return false;
    return ui.conditions.page.includes(page);
  });
}

/**
 * 依類型過濾 UI 元件
 */
export function getUIByType(uiType: UIElement['uiType']): UIElement[] {
  return uiRegistry.filter((ui) => ui.uiType === uiType);
}

/**
 * 取得所有需認證的 UI
 */
export function getAuthRequiredUI(): UIElement[] {
  return uiRegistry.filter((ui) => ui.conditions?.requireAuth);
}

/**
 * 取得所有固定/粘性 UI（不應被裁切）
 */
export function getFixedUI(): UIElement[] {
  return uiRegistry.filter((ui) => ui.uiType === 'fixed' || ui.uiType === 'sticky');
}
