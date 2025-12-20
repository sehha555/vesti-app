import { useCallback } from 'react';

/**
 * 觸覺回饋強度
 */
export type HapticStrength = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * 觸覺回饋 Hook
 * 支援不同強度的震動回饋
 */
export function useHaptic() {
  const triggerHaptic = useCallback((strength: HapticStrength = 'medium') => {
    // 檢查是否支援 Vibration API
    if (!('vibrate' in navigator)) {
      return;
    }

    // 根據強度設定震動模式
    const patterns: Record<HapticStrength, number | number[]> = {
      light: 10,           // 輕微震動
      medium: 20,          // 中等震動
      heavy: 40,           // 強烈震動
      success: [10, 50, 10], // 成功：短-停-短
      warning: [20, 100, 20, 100, 20], // 警告：中-停-中-停-中
      error: [50, 100, 50], // 錯誤：長-停-長
    };

    try {
      navigator.vibrate(patterns[strength]);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }, []);

  return { triggerHaptic };
}

/**
 * 便捷函數：觸發觸覺回饋
 */
export function haptic(strength: HapticStrength = 'medium') {
  if (!('vibrate' in navigator)) return;

  const patterns: Record<HapticStrength, number | number[]> = {
    light: 10,
    medium: 20,
    heavy: 40,
    success: [10, 50, 10],
    warning: [20, 100, 20, 100, 20],
    error: [50, 100, 50],
  };

  try {
    navigator.vibrate(patterns[strength]);
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
  }
}
