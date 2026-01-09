/**
 * E2E Test: UI Visibility
 *
 * 驗證真實應用中 UI 元件的實際行為
 * 使用 Playwright
 *
 * 覆蓋範圍：
 * - Tab 切換時 BottomNav 可見性
 * - 頁面滾動時 BottomNav 保持可見
 * - Modal 開啟/關閉時 UI 疊層正確
 * - 真實路由轉換
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3001';

test.describe('UI Visibility - End to End', () => {
  test.beforeEach(async ({ page }) => {
    // 設置認証狀態（模擬已登入）
    await page.context().addCookies([
      {
        name: 'sb-auth-status',
        value: 'authenticated',
        url: BASE_URL,
      },
    ]);

    // 導航到首頁
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
  });

  test('BottomNav 應該在首頁可見', async ({ page }) => {
    // 等待 BottomNav 出現
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 驗證 BottomNav 在視窗底部
    const boundingBox = await bottomNav.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.y + boundingBox.height).toBeGreaterThan(
        await page.viewportSize().then((size) => size?.height || 0) - 100
      );
    }
  });

  test('Tab 切換時 BottomNav 應保持可見且不閃爍', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 點擊衣櫃 tab
    const wardrobeTab = page.getByTestId('bottom-nav').locator('text=衣櫃');
    await wardrobeTab.click();

    // 等待頁面轉換
    await page.waitForLoadState('networkidle');

    // BottomNav 應該仍然可見（不應短暫消失）
    await expect(bottomNav).toBeVisible();

    // 點擊探索 tab
    const exploreTab = page.getByTestId('bottom-nav').locator('text=探索');
    await exploreTab.click();

    await page.waitForLoadState('networkidle');

    // 再次驗證 BottomNav 可見
    await expect(bottomNav).toBeVisible();
  });

  test('滾動到頁面底部時 BottomNav 應保持可見', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 獲取初始位置
    const initialBox = await bottomNav.boundingBox();
    expect(initialBox).not.toBeNull();

    // 滾動到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // 等待任何後續加載
    await page.waitForTimeout(500);

    // BottomNav 應該仍然可見
    await expect(bottomNav).toBeVisible();

    // 驗證位置沒有改變（固定定位）
    const finalBox = await bottomNav.boundingBox();
    expect(finalBox).not.toBeNull();
    if (initialBox && finalBox) {
      expect(finalBox.y).toBe(initialBox.y);
    }
  });

  test('BottomNav 應該可點擊', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 嘗試點擊商店 tab
    const storeTab = page.getByTestId('bottom-nav').locator('text=商店');
    await storeTab.click();

    // 驗證導航成功（URL 改變或頁面內容改變）
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('store');
  });

  test('登入頁面時 BottomNav 不應顯示', async ({ page, context }) => {
    // 清除認証 cookie
    await context.clearCookies();

    // 重新加載頁面
    await page.reload();
    await page.waitForLoadState('networkidle');

    // BottomNav 應該不可見
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).not.toBeVisible();

    // 加載畫面應該在初始化時出現（暫時）
    const loadingScreen = page.getByTestId('loading-screen');
    // 加載畫面可能已消失，所以我們只驗證它最終不存在或被替換
    await expect(loadingScreen).not.toBeVisible({ timeout: 10000 });
  });

  test('Modal 開啟時 BottomNav 應仍可見但被 Modal 覆蓋', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 嘗試開啟 Modal（例如點擊衣服卡片）
    const clothingCard = page.locator('[data-testid="clothing-detail-modal"]').first();
    if (await clothingCard.count() > 0) {
      await clothingCard.click();

      // Modal 應該可見
      const modal = page.getByTestId('clothing-detail-modal');
      await expect(modal).toBeVisible();

      // BottomNav 應該仍然在 DOM 中（但可能被遮住）
      expect(await bottomNav.count()).toBeGreaterThan(0);

      // 關閉 Modal
      const closeButton = modal.locator('[aria-label="close"], button:near(h2)').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        // 點擊背景關閉
        await modal.locator('..').first().click({ position: { x: 10, y: 10 } });
      }

      // Modal 應該消失
      await expect(modal).not.toBeVisible();

      // BottomNav 應該再次可見
      await expect(bottomNav).toBeVisible();
    }
  });

  test('Z-index 層級：BottomNav (z-50) 應在 normal content 上方', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');
    await expect(bottomNav).toBeVisible();

    // 驗證 z-index 樣式
    const zIndex = await bottomNav.evaluate((el) =>
      window.getComputedStyle(el).getPropertyValue('z-index')
    );
    expect(parseInt(zIndex) >= 40).toBeTruthy(); // 至少應該是 50
  });

  test('回歸：從加載 -> 就緒時，BottomNav 不應短暫出現又消失', async ({ page }) => {
    // 這個測試驗證之前的 bug 是否已修復
    // 如果 bug 存在，BottomNav 會在初始化時短暫閃現

    // 清除 cookie 以觸發完整的認証流程
    await page.context().clearCookies();

    // 開始監聽 BottomNav 的可見性變化
    const bottomNav = page.getByTestId('bottom-nav');
    let visibilityChanges: boolean[] = [];

    // 監控 BottomNav 的存在
    const checkInterval = setInterval(async () => {
      try {
        const isVisible = await bottomNav.isVisible().catch(() => false);
        visibilityChanges.push(isVisible);
      } catch {
        visibilityChanges.push(false);
      }
    }, 100);

    // 導航到頁面
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');

    clearInterval(checkInterval);

    // BottomNav 最終應該可見（因為未認証會進到登入頁，認証則進到 home）
    // 但它不應該在過程中多次閃爍
    const bottomNavVisible = await bottomNav.isVisible().catch(() => false);

    // 統計可見性變化的次數（應該最多 1 次轉換）
    const changeCount = visibilityChanges.reduce((count, current, index) => {
      if (index > 0 && visibilityChanges[index - 1] !== current) {
        return count + 1;
      }
      return count;
    }, 0);

    // 允許最多 1 次轉換（無變化 = 0，從隱藏到顯示 = 1 次轉換）
    expect(changeCount).toBeLessThanOrEqual(1);
  });

  test('主頁的多個 Tab 之間切換時，頁面內容改變但 BottomNav 保持穩定', async ({ page }) => {
    const bottomNav = page.getByTestId('bottom-nav');

    // 驗證初始位置
    const initialPosition = await bottomNav.boundingBox();

    // 依次點擊各個 tab
    const tabs = ['衣櫃', '探索', '商店', '個人'];

    for (const tabName of tabs) {
      const tab = page.getByTestId('bottom-nav').locator(`text=${tabName}`);
      if (await tab.count() > 0) {
        await tab.click();
        await page.waitForLoadState('networkidle');

        // BottomNav 應該仍然可見
        await expect(bottomNav).toBeVisible();

        // 位置應該保持不變（固定定位）
        const currentPosition = await bottomNav.boundingBox();
        expect(currentPosition?.y).toBe(initialPosition?.y);
      }
    }
  });
});
