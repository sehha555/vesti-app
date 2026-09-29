import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

// 與上傳頁、衣櫃頁的分層一致
const CATEGORIES = [
  { value: 'top', label: '上身' },
  { value: 'outerwear', label: '外套' },
  { value: 'bottom', label: '下身' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配件' },
];

type Box = [number, number, number, number];

interface AnalyzedItem {
  name: string;
  category: string;
  color: string;
  brand: string | null;
  box: Box;
}

interface ReviewItem extends AnalyzedItem {
  selected: boolean;
  blob: Blob;
  previewUrl: string;
}

interface OrderImportDialogProps {
  file: File | null;
  onClose: () => void;
  onSaved: () => void;
}

// box 是 0-1000 的相對座標 [ymin, xmin, ymax, xmax]；照它把縮圖從截圖裁出來
async function cropBoxes(file: File, boxes: Box[]): Promise<Blob[]> {
  const bitmap = await createImageBitmap(file);
  const blobs: Blob[] = [];
  for (const [ymin, xmin, ymax, xmax] of boxes) {
    const sx = (xmin / 1000) * bitmap.width;
    const sy = (ymin / 1000) * bitmap.height;
    const sw = ((xmax - xmin) / 1000) * bitmap.width;
    const sh = ((ymax - ymin) / 1000) * bitmap.height;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw));
    canvas.height = Math.max(1, Math.round(sh));
    canvas.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    blobs.push(await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('crop failed'))), 'image/jpeg', 0.92)
    ));
  }
  bitmap.close();
  return blobs;
}

/**
 * 外部購買紀錄：上傳訂單截圖 → AI 列出衣物與縮圖位置 → 勾選、改名稱類別 → 逐件存進衣櫃（EXTERNAL_ORDER）。
 */
export function OrderImportDialog({ file, onClose, onSaved }: OrderImportDialogProps) {
  const [phase, setPhase] = useState<'analyzing' | 'review' | 'saving' | 'error'>('analyzing');
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let urls: string[] = [];
    setPhase('analyzing');
    setError(null);
    setItems([]);

    (async () => {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/closet-items/analyze-order', { method: 'POST', body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'AI 讀取訂單失敗，請稍後再試');
      const analyzed: AnalyzedItem[] = body.data.items;
      const blobs = await cropBoxes(file, analyzed.map((i) => i.box));
      if (cancelled) return;
      urls = blobs.map((b) => URL.createObjectURL(b));
      setOrderId(body.data.orderId);
      setItems(analyzed.map((item, i) => ({ ...item, selected: true, blob: blobs[i], previewUrl: urls[i] })));
      setPhase('review');
    })().catch((err: Error) => {
      if (cancelled) return;
      setError(err.message);
      setPhase('error');
    });

    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [file]);

  const updateItem = (index: number, patch: Partial<ReviewItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const selectedCount = items.filter((i) => i.selected && i.name.trim()).length;

  const handleSave = async () => {
    setPhase('saving');
    let saved = 0;
    for (const item of items) {
      if (!item.selected || !item.name.trim()) continue;
      const form = new FormData();
      form.append('file', new File([item.blob], 'item.jpg', { type: 'image/jpeg' }));
      form.append('name', item.name.trim());
      form.append('category', item.category);
      if (item.color) form.append('color', item.color);
      if (item.brand) form.append('brand', item.brand);
      form.append('source_type', 'EXTERNAL_ORDER');
      if (orderId) form.append('source_ref_id', orderId);
      const res = await fetch('/api/closet-items/upload', { method: 'POST', body: form }).catch(() => null);
      if (res?.ok) saved += 1;
    }
    if (saved === selectedCount) {
      toast.success(`已加入 ${saved} 件到衣櫃`);
    } else {
      toast.error(`${selectedCount} 件中有 ${selectedCount - saved} 件沒存成功`);
    }
    onSaved();
  };

  return (
    <AnimatePresence>
      {file && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={phase === 'saving' ? undefined : onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />
          <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="pointer-events-auto mx-4 mb-6 flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-[var(--vesti-dark)]" style={{ fontWeight: 600 }}>從訂單加入</h3>
                  <p className="text-[var(--vesti-text-secondary)]" style={{ fontSize: '13px' }}>
                    {orderId ? `訂單 ${orderId}` : '勾選要加入衣櫃的商品，名稱和類別都可以改'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={phase === 'saving'}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--vesti-light-bg)] disabled:opacity-50"
                >
                  <X className="h-4 w-4 text-[var(--vesti-dark)]" strokeWidth={2.5} />
                </button>
              </div>

              {phase === 'analyzing' && (
                <div className="flex flex-col items-center gap-3 py-10 text-[var(--vesti-gray-mid)]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <p style={{ fontSize: '14px' }}>AI 正在讀訂單…</p>
                </div>
              )}

              {phase === 'error' && (
                <p className="py-10 text-center text-[var(--vesti-accent)]" style={{ fontSize: '14px' }}>{error}</p>
              )}

              {(phase === 'review' || phase === 'saving') && items.length === 0 && (
                <p className="py-10 text-center text-[var(--vesti-gray-mid)]" style={{ fontSize: '14px' }}>
                  這張截圖裡沒有找到衣物
                </p>
              )}

              {(phase === 'review' || phase === 'saving') && items.length > 0 && (
                <>
                  <ul className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1">
                    {items.map((item, i) => (
                      <li
                        key={i}
                        className={`flex items-center gap-3 rounded-2xl border-2 p-2 transition-colors ${
                          item.selected ? 'border-[var(--vesti-primary)]' : 'border-transparent bg-[var(--vesti-light-bg)] opacity-60'
                        }`}
                      >
                        <button
                          onClick={() => updateItem(i, { selected: !item.selected })}
                          disabled={phase === 'saving'}
                          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-[var(--vesti-light-bg)]"
                        >
                          <img src={item.previewUrl} alt={item.name} className="h-full w-full object-cover" />
                          {item.selected && (
                            <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--vesti-primary)]">
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <input
                            value={item.name}
                            onChange={(e) => updateItem(i, { name: e.target.value })}
                            disabled={phase === 'saving'}
                            maxLength={100}
                            className="w-full rounded-lg bg-[var(--vesti-light-bg)] px-2 py-1 text-[var(--vesti-dark)] outline-none"
                            style={{ fontSize: '14px' }}
                          />
                          <select
                            value={item.category}
                            onChange={(e) => updateItem(i, { category: e.target.value })}
                            disabled={phase === 'saving'}
                            className="w-full rounded-lg bg-[var(--vesti-light-bg)] px-2 py-1 text-[var(--vesti-dark)] outline-none"
                            style={{ fontSize: '13px' }}
                          >
                            {CATEGORIES.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={handleSave}
                    disabled={phase === 'saving' || selectedCount === 0}
                    className="mt-4 rounded-xl bg-[var(--vesti-primary)] py-3 text-white disabled:opacity-50"
                    style={{ fontWeight: 600 }}
                  >
                    {phase === 'saving' ? '加入中…' : `加入 ${selectedCount} 件到衣櫃`}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
