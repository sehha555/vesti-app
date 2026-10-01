'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { BottomSheet } from './ui/bottom-sheet';
import { DELETE_ACCOUNT_CONFIRMATION } from '@/lib/account/constants';

const TYPED_CONFIRMATION = '刪除';

/**
 * 個人頁的「刪除帳號」：打開面板說明會刪掉什麼，輸入「刪除」才能送出。
 * 成功後由 onDeleted 帶回登入頁（cookie 已由 API 清掉）。
 */
export function DeleteAccount({ onDeleted }: { onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setTyped('');
  };

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: DELETE_ACCOUNT_CONFIRMATION }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || '刪除帳號失敗，請稍後再試');
        return;
      }
      toast.success('帳號與所有資料已刪除');
      setOpen(false);
      onDeleted();
    } catch {
      toast.error('網路連線失敗，請稍後再試');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full py-3 text-sm text-[var(--vesti-gray-mid)] hover:text-red-500"
        style={{ textDecoration: 'underline' }}
      >
        刪除帳號
      </button>

      {open && (
        <BottomSheet label="刪除帳號" onClose={close}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>確定要刪除帳號嗎？</h3>
          <p style={{ fontSize: 14, color: '#4b5563' }}>
            會永久刪除帳號，以及衣櫃照片（含去背圖）、收藏的穿搭、每日穿搭與推薦回饋紀錄，無法復原。
          </p>
          <label style={{ display: 'block', fontSize: 14 }}>
            請輸入「{TYPED_CONFIRMATION}」確認
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              aria-label="輸入刪除以確認"
              className="mt-1 w-full rounded-xl border border-[var(--vesti-gray-light)] px-3 py-2"
            />
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={close}
              disabled={busy}
              className="flex-1 rounded-xl border border-[var(--vesti-gray-light)] py-3"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy || typed.trim() !== TYPED_CONFIRMATION}
              className="flex-1 rounded-xl py-3 text-white disabled:opacity-50"
              style={{ background: '#dc2626', fontWeight: 700 }}
            >
              {busy ? '刪除中…' : '永久刪除'}
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  );
}
