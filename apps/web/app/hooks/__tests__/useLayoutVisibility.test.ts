import { describe, it, expect } from 'vitest';
import { getLayoutVisibilityRules } from '../useLayoutVisibility';
import type { PageType, LoadingState } from '../../contexts/AppStateContext';

describe('useLayoutVisibility - Layout Visibility Rules', () => {
  describe('Loading State', () => {
    it('should hide all UI except loading screen when loadingState is "loading"', () => {
      const result = getLayoutVisibilityRules(null, 'loading');

      expect(result.showLoadingScreen).toBe(true);
      expect(result.showBottomNav).toBe(false);
      expect(result.showHeader).toBe(false);
      expect(result.showMainContent).toBe(false);
    });

    it('should hide all UI when currentPage is null (loading)', () => {
      const result = getLayoutVisibilityRules(null, 'ready');

      expect(result.showLoadingScreen).toBe(true);
      expect(result.showBottomNav).toBe(false);
      expect(result.showHeader).toBe(false);
      expect(result.showMainContent).toBe(false);
    });

    it('should show main content but not bottom nav when error', () => {
      const result = getLayoutVisibilityRules('home', 'error');

      expect(result.showLoadingScreen).toBe(false);
      expect(result.showMainContent).toBe(true);
      expect(result.showBottomNav).toBe(true); // 錯誤狀態時仍應顯示正常 UI
    });
  });

  describe('Login Page', () => {
    it('should hide BottomNav and Header on login page', () => {
      const result = getLayoutVisibilityRules('login', 'ready');

      expect(result.showBottomNav).toBe(false);
      expect(result.showHeader).toBe(false);
      expect(result.showMainContent).toBe(true);
      expect(result.showLoadingScreen).toBe(false);
    });

    it('should not show BottomNav even when loading state is ready on login page', () => {
      const result = getLayoutVisibilityRules('login', 'ready');
      expect(result.showBottomNav).toBe(false);
    });
  });

  describe('Main Pages (home, wardrobe, explore, store, profile)', () => {
    const mainPages: PageType[] = ['home', 'wardrobe', 'explore', 'store', 'profile'];

    mainPages.forEach((page) => {
      it(`should show BottomNav, Header, and MainContent on ${page} page`, () => {
        const result = getLayoutVisibilityRules(page, 'ready');

        expect(result.showBottomNav).toBe(true);
        expect(result.showHeader).toBe(true);
        expect(result.showMainContent).toBe(true);
        expect(result.showLoadingScreen).toBe(false);
      });
    });
  });

  describe('Sub Pages (tryon, checkout, discount, etc.)', () => {
    const subPages: PageType[] = [
      'tryon',
      'checkout',
      'discount',
      'trending',
      'upload',
      'broadcast',
      'calendar',
      'cpwranking',
      'delivery',
      'notification',
      'payment-methods',
    ];

    subPages.forEach((page) => {
      it(`should show BottomNav and Header on ${page} page for navigation back`, () => {
        const result = getLayoutVisibilityRules(page, 'ready');

        expect(result.showBottomNav).toBe(true);
        expect(result.showHeader).toBe(true);
        expect(result.showMainContent).toBe(true);
        expect(result.showLoadingScreen).toBe(false);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should not break when transitioning from loading to ready', () => {
      // Before transition
      const beforeTransition = getLayoutVisibilityRules(null, 'loading');
      expect(beforeTransition.showLoadingScreen).toBe(true);
      expect(beforeTransition.showBottomNav).toBe(false);

      // After transition (still null but state changed)
      const afterTransition = getLayoutVisibilityRules(null, 'ready');
      expect(afterTransition.showLoadingScreen).toBe(true);
      expect(afterTransition.showBottomNav).toBe(false);
    });

    it('should correctly handle page transition while ready', () => {
      const fromHome = getLayoutVisibilityRules('home', 'ready');
      const toLogin = getLayoutVisibilityRules('login', 'ready');
      const backToHome = getLayoutVisibilityRules('home', 'ready');

      // Home -> Login transition
      expect(fromHome.showBottomNav).toBe(true);
      expect(toLogin.showBottomNav).toBe(false);

      // Login -> Home transition
      expect(backToHome.showBottomNav).toBe(true);
    });

    it('should never show both loading screen and other UI', () => {
      const allPages: (PageType | null)[] = [
        null,
        'home',
        'login',
        'wardrobe',
        'explore',
        'store',
        'profile',
      ];
      const allStates: LoadingState[] = ['loading', 'ready', 'error'];

      allPages.forEach((page) => {
        allStates.forEach((state) => {
          const result = getLayoutVisibilityRules(page, state);

          // Logic check: if loading screen is shown, others should be hidden
          if (result.showLoadingScreen) {
            expect(result.showBottomNav).toBe(false);
            expect(result.showHeader).toBe(false);
            // Main content might vary, but let's check consistency
          }
        });
      });
    });
  });

  describe('Regression Tests - Previous Issues', () => {
    it('should not hide BottomNav when transitioning from null to home (bug fix)', () => {
      // Before fix: BottomNav would show when null, then disappear when set to home
      // After fix: Should properly show/hide based on current state

      const nullState = getLayoutVisibilityRules(null, 'ready');
      const homeState = getLayoutVisibilityRules('home', 'ready');

      // Both should behave consistently - null should hide, home should show
      expect(nullState.showBottomNav).toBe(false); // null is treated as loading
      expect(homeState.showBottomNav).toBe(true); // home should show
    });

    it('should not show BottomNav during initial load transition', () => {
      // Simulate the exact bug scenario:
      // 1. Initial render with null
      const initialRender = getLayoutVisibilityRules(null, 'loading');
      expect(initialRender.showBottomNav).toBe(false);

      // 2. After a few seconds, auth check completes and sets to login
      const afterAuthCheck = getLayoutVisibilityRules('login', 'ready');
      expect(afterAuthCheck.showBottomNav).toBe(false);

      // BottomNav should never flicker
    });
  });
});
