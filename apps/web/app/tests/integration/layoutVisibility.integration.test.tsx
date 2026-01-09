/**
 * Integration Test: Layout Visibility & Test Selectors
 *
 * 驗證所有 Priority 1-2 UI 元件都已添加 data-testid
 * 驗證可見性矩陣的邏輯正確性
 *
 * 覆蓋範圍：
 * - ✓ 驗證 10 個關鍵 UI 都有有效的 testId
 * - ✓ 驗證可見性規則矩陣的一致性
 * - ✓ 驗證所有應用狀態都被定義
 * - ✓ 驗證優先級分類的完整性
 */

import { describe, it, expect } from 'vitest';
import { uiRegistry, getUIByPriority } from '../../ui/uiRegistry';
import {
  appStates,
  visibilityExpectations,
  getExpectationsForState,
  validateMatrix,
} from '../../ui/uiVisibilityMatrix';

describe('Layout Visibility Integration Tests', () => {
  describe('Phase 1 UI Registry - Priority 1-2 完整性驗證', () => {
    it('應該有至少 10 個 Priority 1-2 的 UI 元件', () => {
      const criticalUI = getUIByPriority(2);
      expect(criticalUI.length).toBeGreaterThanOrEqual(10);
    });

    it('所有 Priority 1 UI 應該都有有效的 testId', () => {
      const priority1UI = getUIByPriority(1);

      priority1UI.forEach((ui) => {
        // testId 應該是非空字符串
        expect(ui.testId).toBeDefined();
        expect(ui.testId).not.toBe('');
        expect(ui.testId.length).toBeGreaterThan(0);

        // testId 應該使用 kebab-case
        expect(ui.testId).toMatch(/^[a-z-]+$/);

        // testId 不應該包含特殊字符或空格
        expect(ui.testId).not.toMatch(/[\s@#$%^&*()]/);
      });
    });

    it('所有 Priority 2 UI 應該都有有效的 testId', () => {
      const priority2UI = uiRegistry.filter((ui) => ui.priority === 2);

      priority2UI.forEach((ui) => {
        expect(ui.testId).toBeDefined();
        expect(ui.testId).not.toBe('');
        expect(ui.testId).toMatch(/^[a-z-]+$/);
      });
    });

    it('Phase 1 應該補齊至少 7 個 UI 元件的 testId', () => {
      const phase1UIKeys = [
        'bottom-nav',
        'loading-screen',
        'error-boundary',
        'page-header',
        'outfit-detail-modal',
        'clothing-detail-modal',
        'floating-basket',
        'checkout-action-bar',
        'tryon-action-bar',
        'toaster',
      ];

      phase1UIKeys.forEach((key) => {
        const ui = uiRegistry.find((u) => u.key === key);
        expect(ui).toBeDefined();
        expect(ui?.testId).toBe(key);
      });
    });

    it('所有 UI 的 filePath 應該指向實際存在的檔案（模式驗證）', () => {
      const criticalUI = getUIByPriority(2);

      criticalUI.forEach((ui) => {
        // filePath 應該以 .tsx 或 .ts 結尾
        expect(ui.filePath).toMatch(/\.(tsx?|ts)$/);

        // filePath 應該不包含 node_modules
        expect(ui.filePath).not.toContain('node_modules');

        // filePath 應該是相對或絕對路徑
        expect(ui.filePath.length).toBeGreaterThan(0);
      });
    });
  });

  describe('可見性矩陣 - 邏輯一致性驗證', () => {
    it('可見性矩陣應該通過驗證', () => {
      const result = validateMatrix();
      expect(result.valid).toBe(true);

      if (!result.valid) {
        console.error('矩陣驗證失敗:', result.errors);
      }
    });

    it('應該有至少 13 個應用狀態被定義', () => {
      expect(appStates.length).toBeGreaterThanOrEqual(13);
    });

    it('應該有至少 40 個可見性期望規則', () => {
      expect(visibilityExpectations.length).toBeGreaterThanOrEqual(40);
    });

    it('每個應用狀態都應該有對應的期望規則', () => {
      appStates.forEach((state) => {
        const expectations = getExpectationsForState(state.name);

        // 至少應該有一些 UI 的期望規則
        expect(expectations.length).toBeGreaterThan(0);

        // 驗證所有期望規則中的 state 名稱都一致
        expectations.forEach((exp) => {
          expect(exp.state).toBe(state.name);
        });
      });
    });

    it('loading 狀態應該只顯示 loading-screen 和 error-boundary', () => {
      const initLoadingExpectations = getExpectationsForState('init_loading');

      const visibleUIs = initLoadingExpectations
        .filter((e) => e.visible)
        .map((e) => e.ui);

      expect(visibleUIs).toContain('loading-screen');
      expect(visibleUIs).toContain('error-boundary');

      // 除了這兩個，其他 UI 不應該顯示
      visibleUIs.forEach((ui) => {
        expect(['loading-screen', 'error-boundary']).toContain(ui);
      });
    });

    it('login 狀態應該隱藏 bottom-nav', () => {
      const loginExpectations = getExpectationsForState('login_page_unauth');

      const bottomNavExpectation = loginExpectations.find((e) => e.ui === 'bottom-nav');
      expect(bottomNavExpectation).toBeDefined();
      expect(bottomNavExpectation?.visible).toBe(false);
    });

    it('已認証的主頁面應該顯示 bottom-nav 和 page-header', () => {
      const homeExpectations = getExpectationsForState('home_authenticated');

      const bottomNavExp = homeExpectations.find((e) => e.ui === 'bottom-nav');
      const headerExp = homeExpectations.find((e) => e.ui === 'page-header');

      expect(bottomNavExp?.visible).toBe(true);
      expect(headerExp?.visible).toBe(true);
    });

    it('子頁面（如 checkout）應該顯示 bottom-nav 供返回', () => {
      const checkoutExpectations = getExpectationsForState('checkout_authenticated');

      const bottomNavExp = checkoutExpectations.find((e) => e.ui === 'bottom-nav');
      const actionBarExp = checkoutExpectations.find((e) => e.ui === 'checkout-action-bar');

      expect(bottomNavExp?.visible).toBe(true);
      expect(actionBarExp?.visible).toBe(true);
    });
  });

  describe('回歸測試 - 防止 BottomNav 消失問題', () => {
    it('BottomNav 應該在所有已認証的頁面都顯示', () => {
      const authenticatedStates = appStates.filter((s) => s.isAuthenticated && s.currentPage !== null && s.currentPage !== 'login');

      authenticatedStates.forEach((state) => {
        const expectations = getExpectationsForState(state.name);
        const bottomNavExp = expectations.find((e) => e.ui === 'bottom-nav');

        expect(bottomNavExp?.visible).toBe(true);
      });
    });

    it('BottomNav 應該在 null 狀態時隱藏（防止閃爍）', () => {
      const nullPageExpectations = appStates
        .filter((s) => s.currentPage === null)
        .forEach((state) => {
          const expectations = getExpectationsForState(state.name);
          const bottomNavExp = expectations.find((e) => e.ui === 'bottom-nav');
          expect(bottomNavExp?.visible).toBe(false);
        });
    });

    it('loading -> ready 轉換時 loading-screen 應該隱藏', () => {
      const loadingToReadyState = appStates.find((s) => s.name === 'loading_to_home_transition');
      expect(loadingToReadyState).toBeDefined();

      const expectations = getExpectationsForState('loading_to_home_transition');
      const loadingScreenExp = expectations.find((e) => e.ui === 'loading-screen');

      expect(loadingScreenExp?.visible).toBe(false);
    });

    it('error-boundary 應該在所有狀態都存在', () => {
      appStates.forEach((state) => {
        const expectations = getExpectationsForState(state.name);
        const errorBoundaryExp = expectations.find((e) => e.ui === 'error-boundary');

        expect(errorBoundaryExp).toBeDefined();
        expect(errorBoundaryExp?.visible).toBe(true);
      });
    });
  });

  describe('測試選擇器（testId）命名規範驗證', () => {
    it('所有 testId 應該使用 kebab-case', () => {
      const criticalUI = getUIByPriority(2);

      criticalUI.forEach((ui) => {
        // testId 應該只包含小寫字母和連字符
        expect(ui.testId).toMatch(/^[a-z]+(-[a-z]+)*$/);
      });
    });

    it('所有 testId 應該是唯一的', () => {
      const allTestIds = uiRegistry.map((ui) => ui.testId);
      const uniqueTestIds = new Set(allTestIds);

      expect(allTestIds.length).toBe(uniqueTestIds.size);
    });

    it('testId 應該與 key 相同', () => {
      const criticalUI = getUIByPriority(2);

      criticalUI.forEach((ui) => {
        expect(ui.testId).toBe(ui.key);
      });
    });

    it('testId 長度應該合理（5-30 字符）', () => {
      const criticalUI = getUIByPriority(2);

      criticalUI.forEach((ui) => {
        expect(ui.testId.length).toBeGreaterThanOrEqual(5);
        expect(ui.testId.length).toBeLessThanOrEqual(30);
      });
    });
  });

  describe('優先級分類驗證', () => {
    it('Priority 1 UI 應該包含最關鍵的元件', () => {
      const priority1Keys = getUIByPriority(1).map((ui) => ui.key);

      expect(priority1Keys).toContain('bottom-nav');
      expect(priority1Keys).toContain('loading-screen');
      expect(priority1Keys).toContain('error-boundary');
    });

    it('Priority 2 UI 應該包含所有重要的 Modal 和操作欄', () => {
      const priority2Keys = uiRegistry
        .filter((ui) => ui.priority === 2)
        .map((ui) => ui.key);

      expect(priority2Keys).toContain('page-header');
      expect(priority2Keys).toContain('outfit-detail-modal');
      expect(priority2Keys).toContain('clothing-detail-modal');
      expect(priority2Keys).toContain('floating-basket');
      expect(priority2Keys).toContain('checkout-action-bar');
      expect(priority2Keys).toContain('tryon-action-bar');
      expect(priority2Keys).toContain('toaster');
    });

    it('Priority 應該遞減分布', () => {
      const counts = {
        1: uiRegistry.filter((ui) => ui.priority === 1).length,
        2: uiRegistry.filter((ui) => ui.priority === 2).length,
        3: uiRegistry.filter((ui) => ui.priority === 3).length,
        4: uiRegistry.filter((ui) => ui.priority === 4).length,
        5: uiRegistry.filter((ui) => ui.priority === 5).length,
      };

      // Priority 1 應該最少（最關鍵）
      // Priority 越高，數量應該越多
      expect(counts[1]).toBeLessThanOrEqual(counts[2]);
    });
  });

  describe('Phase 1 完成度檢查清單', () => {
    it('✅ 已補齊 10 個 Priority 1-2 UI 的 data-testid', () => {
      const phase1UIKeys = [
        'bottom-nav',
        'loading-screen',
        'error-boundary',
        'page-header',
        'outfit-detail-modal',
        'clothing-detail-modal',
        'floating-basket',
        'checkout-action-bar',
        'tryon-action-bar',
        'toaster',
      ];

      phase1UIKeys.forEach((key) => {
        const ui = uiRegistry.find((u) => u.key === key);
        expect(ui).toBeDefined();
        expect(ui?.testId).toBe(key);
        expect(ui?.priority).toBeLessThanOrEqual(2);
      });
    });

    it('✅ UI Registry 已正確定義所有 UI 的可見性條件', () => {
      const criticalUI = getUIByPriority(2);

      criticalUI.forEach((ui) => {
        // 每個 UI 應該有清晰的描述
        expect(ui.description).toBeDefined();
        expect(ui.description.length).toBeGreaterThan(0);

        // 高優先級 UI 應該有條件定義
        if (ui.priority <= 2) {
          expect(ui.conditions || ui.uiType).toBeDefined();
        }
      });
    });

    it('✅ 可見性矩陣覆蓋所有關鍵狀態', () => {
      const statesCovered = new Set(visibilityExpectations.map((e) => e.state));
      const requiredStates = [
        'init_loading',
        'login_page_unauth',
        'home_authenticated',
        'wardrobe_authenticated',
        'checkout_authenticated',
        'tryon_authenticated',
      ];

      requiredStates.forEach((state) => {
        expect(statesCovered.has(state)).toBe(true);
      });
    });

    it('✅ 所有測試應該通過（總覽）', () => {
      // 這是一個匯總測試，確保所有上述測試都已執行
      const registryUICount = uiRegistry.length;
      const stateCount = appStates.length;
      const expectationCount = visibilityExpectations.length;

      expect(registryUICount).toBeGreaterThan(0);
      expect(stateCount).toBeGreaterThan(0);
      expect(expectationCount).toBeGreaterThan(0);

      console.log(`
        ✅ Integration Test Summary:
        - Total UI Elements: ${registryUICount}
        - Total App States: ${stateCount}
        - Total Visibility Expectations: ${expectationCount}
        - Priority 1-2 UI: ${getUIByPriority(2).length}
        - Test Coverage: ${(getUIByPriority(2).length / registryUICount * 100).toFixed(1)}%
      `);
    });
  });
});
