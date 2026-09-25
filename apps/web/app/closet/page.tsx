'use client';

import { useCallback, useEffect, useState } from 'react';
import { CLOSET_CATEGORIES, CLOSET_CATEGORY_LABELS } from '@/lib/closet/categories';
import { siteNameFromUrl } from '@/lib/links/outbound';
import { PRIMARY_BUTTON_STYLE } from '../components/figma/ShopLinks';

// 極簡衣櫃頁：貼連結 / 拍照上傳加入衣櫃，看目前衣櫃，編輯名稱類別、刪除。

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  source_url?: string | null;
}

const categoryLabel = (value: string) => CLOSET_CATEGORY_LABELS[value as keyof typeof CLOSET_CATEGORY_LABELS] ?? value;

// 匯入的衣物標示圖片來源網站（著作權：保留出處、權利人可據此要求下架）
function SourceLink({ url }: { url: string | null | undefined }) {
  const site = siteNameFromUrl(url);
  if (!site) return null;
  return (
    <p className="truncate text-xs text-gray-400">
      圖片來源：
      <a
        href={url!}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
        aria-label={`前往 ${site} 查看原商品頁`}
      >
        {site} ↗
      </a>
    </p>
  );
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    return typeof body.error === 'string' ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function CategorySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded border px-3 py-2">
      {CLOSET_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {CLOSET_CATEGORY_LABELS[c]}
        </option>
      ))}
    </select>
  );
}

export default function ClosetPage() {
  const [items, setItems] = useState<ClosetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // 貼連結
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [submitting, setSubmitting] = useState(false);

  // 拍照 / 選圖上傳
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('uncategorized');
  const [uploading, setUploading] = useState(false);

  // 編輯
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const submitUrl = async (e: React.FormEvent) => {
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
          category,
        }),
      });
      if (!res.ok) {
        setMessage(await errorMessage(res, '匯入失敗'));
        return;
      }
      const body = await res.json();
      setUrl('');
      setName('');
      setCategory('uncategorized');
      setMessage(`已加入：${body.data?.name ?? '商品'}`);
      // 回應就是新建的那筆（含新簽章圖片網址），不必整個衣櫃重抓
      if (body.data) setItems((prev) => [body.data, ...prev]);
    } catch {
      setMessage('匯入失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const form = new FormData();
      form.append('file', file);
      if (uploadName.trim()) form.append('name', uploadName.trim());
      form.append('category', uploadCategory);

      const res = await fetch('/api/closet-items/upload', { method: 'POST', body: form });
      if (!res.ok) {
        setMessage(await errorMessage(res, '上傳失敗'));
        return;
      }
      const body = await res.json();
      setFile(null);
      setFileInputKey((k) => k + 1); // 清掉 <input type="file"> 的選取
      setUploadName('');
      setUploadCategory('uncategorized');
      setMessage(`已加入：${body.data?.name ?? '衣物'}`);
      if (body.data) setItems((prev) => [body.data, ...prev]);
    } catch {
      setMessage('上傳失敗，請稍後再試');
    } finally {
      setUploading(false);
    }
  };

  const startEdit = (item: ClosetItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCategory(item.category);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim()) {
      setMessage('名稱不能空白');
      return;
    }
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/closet-items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), category: editCategory }),
      });
      if (!res.ok) {
        setMessage(await errorMessage(res, '儲存失敗'));
        return;
      }
      // PATCH 回的 image_url 是存在 DB 的舊簽章網址，只更新名稱和類別
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, name: editName.trim(), category: editCategory } : it))
      );
      setEditingId(null);
    } catch {
      setMessage('儲存失敗，請稍後再試');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (item: ClosetItem) => {
    if (!window.confirm(`確定要從衣櫃刪除「${item.name}」？`)) return;
    setBusyId(item.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/closet-items/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        setMessage(await errorMessage(res, '刪除失敗'));
        return;
      }
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      if (editingId === item.id) setEditingId(null);
    } catch {
      setMessage('刪除失敗，請稍後再試');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="mx-auto p-4 space-y-6" style={{ maxWidth: 768 }}>
      <div className="flex items-center gap-3">
        {/* 這頁沒有底部導覽列，沒有這個連結就回不去首頁 */}
        <a href="/" className="text-sm text-blue-600 hover:underline">← 回首頁</a>
        <h1 className="text-xl font-semibold">我的衣櫃</h1>
      </div>

      <form onSubmit={submitUpload} className="space-y-3 rounded-lg border p-4">
        <label className="block text-sm">
          拍照或從相簿選一張（JPEG / PNG / WebP，最大 10MB，會自動去背）
          <span className="mt-1 block text-xs text-gray-500">
            只要拍衣服本身，請避免拍到臉或其他人。照片會送到去背服務與 AI 分析（可能傳到國外處理），詳見
            <a href="/legal/privacy" className="underline">隱私權政策</a>。
          </span>
          <input
            key={fileInputKey}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm"
          />
        </label>
        <div className="flex gap-3">
          <label className="block flex-1 text-sm">
            名稱（選填）
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              maxLength={100}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </label>
          <label className="block flex-1 text-sm">
            類別
            <CategorySelect value={uploadCategory} onChange={setUploadCategory} />
          </label>
        </div>
        <button
          type="submit"
          disabled={uploading || !file}
          className="rounded px-4 py-2 text-white disabled:opacity-50"
          style={PRIMARY_BUTTON_STYLE}
        >
          {uploading ? '上傳中…' : '上傳到衣櫃'}
        </button>
      </form>

      <form onSubmit={submitUrl} className="space-y-3 rounded-lg border p-4">
        <label className="block text-sm">
          商品連結或圖片網址（UNIQLO 台灣可直接貼商品頁；其他品牌對圖片右鍵「複製圖片位址」）
          <span className="mt-1 block text-xs text-gray-500">
            匯入的商品圖只會存在你自己的衣櫃、只有你看得到，並標示來源網站。部分網站不允許自動擷取，會請你改用拍照上傳。
          </span>
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
            <CategorySelect value={category} onChange={setCategory} />
          </label>
        </div>
        <button
          type="submit"
          disabled={submitting || !url.trim()}
          className="rounded px-4 py-2 text-white disabled:opacity-50"
          style={PRIMARY_BUTTON_STYLE}
        >
          {submitting ? '匯入中…' : '加入衣櫃'}
        </button>
      </form>

      {message && <p className="text-sm text-gray-700">{message}</p>}

      <section>
        <h2 className="mb-2 text-sm text-gray-500">
          {loading ? '載入中…' : `共 ${items.length} 件`}
        </h2>
        <ul className="grid grid-cols-3 gap-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-1">
              <div className="aspect-square overflow-hidden rounded bg-gray-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              {editingId === item.id ? (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    aria-label="名稱"
                    className="w-full rounded border px-2 py-1 text-xs"
                  />
                  <CategorySelect value={editCategory} onChange={setEditCategory} />
                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => saveEdit(item.id)}
                      disabled={busyId === item.id}
                      className="text-blue-600 disabled:opacity-50"
                    >
                      儲存
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-gray-500">
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="truncate text-xs">{item.name}</p>
                  <p className="text-xs text-gray-400">{categoryLabel(item.category)}</p>
                  <SourceLink url={item.source_url} />
                  <div className="flex gap-2 text-xs">
                    <button type="button" onClick={() => startEdit(item)} className="text-blue-600">
                      編輯
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      disabled={busyId === item.id}
                      className="text-red-600 disabled:opacity-50"
                    >
                      刪除
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
