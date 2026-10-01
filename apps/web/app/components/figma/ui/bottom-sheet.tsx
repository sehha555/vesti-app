'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * 從底部滑出的面板。掛到 body：頁面外層的動畫容器會形成自己的 stacking context，
 * 留在裡面會被底部導覽列（z-50）蓋住；z-index 100 高於導覽列。
 * 點背景或按 Esc 關閉。
 */
export function BottomSheet({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center bg-black/40" style={{ zIndex: 100 }} onClick={onClose}>
      <div
        role="dialog"
        aria-label={label}
        className="w-full space-y-3 bg-white p-5"
        style={{ maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', borderRadius: '20px 20px 0 0' }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
