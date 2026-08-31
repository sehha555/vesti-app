'use client';

import { useCallback, useEffect, useState } from 'react';

// 實驗用的極簡衣櫃頁：貼商品連結 + 看目前衣櫃。不做編輯 / 刪除。

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  source_url?: string | null;
}

const CATEGORIES = [
  { value: '', label: '自動判斷（未分類）' },
  { value: 'top', label: '上身' },
  { value: 'outerwear', label: '外套' },
  { value: 'bottom', label: '下身' },
  { value: 'shoes', label: '鞋子' },
  { value: 'accessory', label: '配件' },
];

export default function ClosetPage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/closet-items');
      if (res.status === 401) {
        setMessage('請先登入');
        setItems([]);
        return;
      }
      const body = await res.json();
      setItems(body.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/closet-items/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(category ? { category } : {}),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.error ?? '匯入失敗');
        return;
      }
      setUrl('');
      setName('');
      setCategory('');
      setMessage(`已加入：${body.data?.name ?? '商品'}`);
      await load();
    } catch {
      setMessage('匯入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl p-4 space-y-6">
      <h1 className="text-xl font-semibold">我的衣櫃</h1>

      <form onSubmit={submit} className="space-y-3 rounded-lg border p-4">
        <label className="block text-sm">
          商品連結或圖片網址（UNIQLO 台灣可直接貼商品頁；其他品牌對圖片右鍵「複製圖片位址」）
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.uniqlo.com/tw/..."
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1 text-sm">
            名稱（選填）
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block flex-1 text-sm">
            類別
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? '匯入中…' : '加入衣櫃'}
        </button>
        {message && <p className="text-sm text-gray-700">{message}</p>}
      </form>

      <section>
        <h2 className="mb-2 text-sm text-gray-500">
          {loading ? '載入中…' : `共 ${items.length} 件`}
        </h2>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="space-y-1">
              <div className="aspect-square overflow-hidden rounded bg-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <p className="truncate text-xs">{item.name}</p>
              <p className="text-xs text-gray-400">{item.category}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
