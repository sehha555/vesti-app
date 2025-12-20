import { toast as sonnerToast } from 'sonner';
import { haptic } from '../hooks/useHaptic';

/**
 * 帶觸覺回饋的 Toast 通知
 * 包裝 Sonner toast，加上震動回饋
 */
export const toast = {
  success: (message: string, options?: Parameters<typeof sonnerToast.success>[1]) => {
    haptic('success');
    return sonnerToast.success(message, options);
  },

  error: (message: string, options?: Parameters<typeof sonnerToast.error>[1]) => {
    haptic('error');
    return sonnerToast.error(message, options);
  },

  warning: (message: string, options?: Parameters<typeof sonnerToast.warning>[1]) => {
    haptic('warning');
    return sonnerToast.warning(message, options);
  },

  info: (message: string, options?: Parameters<typeof sonnerToast.info>[1]) => {
    haptic('light');
    return sonnerToast.info(message, options);
  },

  // 預設 toast（中等震動）
  default: (message: string, options?: Parameters<typeof sonnerToast>[1]) => {
    haptic('medium');
    return sonnerToast(message, options);
  },

  // Promise toast（載入時輕微震動，完成時對應震動）
  promise: <T,>(
    promise: Promise<T>,
    options: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ) => {
    haptic('light');
    return sonnerToast.promise(promise, {
      loading: options.loading,
      success: (data) => {
        haptic('success');
        return typeof options.success === 'function' ? options.success(data) : options.success;
      },
      error: (error) => {
        haptic('error');
        return typeof options.error === 'function' ? options.error(error) : options.error;
      },
    });
  },
};

// 兼容原始 toast API
export default toast;
