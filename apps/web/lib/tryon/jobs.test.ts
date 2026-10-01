import { describe, it, expect, vi } from 'vitest';
import { ensureTryonJobs, getTryonStates, jobKey, tryonItems } from './jobs';

const outfit = (id: number, slots: Array<[string, string]>) => ({
  id,
  layoutSlots: slots.map(([slotKey, itemId]) => ({ slotKey, item: { id: itemId } })),
});

interface Row {
  id: string;
  user_id: string;
  job_key: string;
  person_path: string;
  items: unknown;
  status: string;
  result_path: string | null;
}

/**
 * 假的 Supabase：tryon_jobs 跟真的表一樣有 (user_id, job_key) 唯一限制，
 * upsert + ignoreDuplicates 遇到重複就跳過；沒帶 ignoreDuplicates 會變成更新，被 RLS 擋；storage 的 body 資料夾有 bodyFiles 這些檔案。
 */
function fakeDb({ bodyFiles = ['me.png'], rows = [] as Row[], failInsert = false } = {}) {
  let seq = rows.length;
  const table = [...rows];
  const query = () => {
    const filters: Array<(r: Row) => boolean> = [];
    const q = {
      eq: (col: keyof Row, v: unknown) => (filters.push((r) => r[col] === v), q),
      in: (col: keyof Row, vs: unknown[]) => (filters.push((r) => vs.includes(r[col])), q),
      then: (resolve: (v: unknown) => void) => resolve({ data: table.filter((r) => filters.every((f) => f(r))), error: null }),
    };
    return q;
  };
  const upsert = vi.fn(async (newRows: Row[], opts: { onConflict: string; ignoreDuplicates: boolean }) => {
    if (failInsert) return { error: { message: 'rls' } };
    for (const r of newRows) {
      const dup = table.find((t) => t.user_id === r.user_id && t.job_key === r.job_key);
      if (dup && opts.ignoreDuplicates) continue;
      // 使用者沒有 update 權限（RLS 沒開 update policy），重複時要更新就會被擋
      if (dup) return { error: { message: 'new row violates row-level security policy' } };
      table.push({ ...r, id: `job${++seq}`, status: 'queued', result_path: null });
    }
    return { error: null };
  });
  const supabase = {
    from: () => ({ upsert, select: () => query() }),
    storage: {
      from: () => ({
        list: async () => ({ data: bodyFiles.map((name) => ({ name, id: name })), error: null }),
        createSignedUrls: async (paths: string[]) => ({
          data: paths.map((p) => ({ signedUrl: `https://signed/${p}` })),
          error: null,
        }),
      }),
    },
  };
  return { supabase: supabase as never, table, upsert };
}

describe('tryonItems / jobKey', () => {
  it('只取上身、外套、下身、鞋，配件不換', () => {
    const items = tryonItems(outfit(1, [['top_inner', 'a'], ['accessory', 'x'], ['bottom', 'b']]));
    expect(items).toEqual([
      { slotKey: 'top_inner', itemId: 'a' },
      { slotKey: 'bottom', itemId: 'b' },
    ]);
  });

  it('衣服順序不同 key 一樣；換照片 key 不同', () => {
    const a = [{ slotKey: 'top_inner', itemId: 'a' }, { slotKey: 'bottom', itemId: 'b' }];
    const b = [...a].reverse();
    expect(jobKey('u1/body/1.png', a)).toBe(jobKey('u1/body/1.png', b));
    expect(jobKey('u1/body/1.png', a)).not.toBe(jobKey('u1/body/2.png', a));
  });
});

describe('ensureTryonJobs', () => {
  it('沒上傳全身照就不登記', async () => {
    const db = fakeDb({ bodyFiles: [] });
    const states = await ensureTryonJobs(db.supabase, 'u1', [outfit(1, [['top_inner', 'a']])]);
    expect(states.size).toBe(0);
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('每套登記一件等待中的工作，再呼叫一次不會重複登記', async () => {
    const db = fakeDb();
    const outfits = [outfit(1, [['top_inner', 'a'], ['bottom', 'b']]), outfit(2, [['top_inner', 'c']])];

    const first = await ensureTryonJobs(db.supabase, 'u1', outfits);
    const second = await ensureTryonJobs(db.supabase, 'u1', outfits);

    expect(db.table).toHaveLength(2);
    expect(db.table[0]).toMatchObject({ person_path: 'u1/body/me.png', items: [{ slotKey: 'top_inner', itemId: 'a' }, { slotKey: 'bottom', itemId: 'b' }] });
    expect(first.get(1)).toEqual({ jobId: 'job1', status: 'queued' });
    expect(second.get(2)).toEqual({ jobId: 'job2', status: 'queued' });
  });

  it('已完成的工作不會被重登記蓋掉，並附結果圖網址', async () => {
    const o = outfit(1, [['top_inner', 'a']]);
    const key = jobKey('u1/body/me.png', tryonItems(o));
    const db = fakeDb({
      rows: [{ id: 'j9', user_id: 'u1', job_key: key, person_path: 'u1/body/me.png', items: [], status: 'done', result_path: 'u1/tryon/j9.png' }],
    });
    const states = await ensureTryonJobs(db.supabase, 'u1', [o]);
    expect(states.get(1)).toEqual({ jobId: 'j9', status: 'done', imageUrl: 'https://signed/u1/tryon/j9.png' });
    expect(db.table[0].status).toBe('done');
  });

  it('沒有可換衣服的套裝不登記', async () => {
    const db = fakeDb();
    const states = await ensureTryonJobs(db.supabase, 'u1', [outfit(1, [['accessory', 'x']])]);
    expect(states.size).toBe(0);
    expect(db.upsert).not.toHaveBeenCalled();
  });

  it('登記失敗回空結果，不丟錯（推薦照常回）', async () => {
    const db = fakeDb({ failInsert: true });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const states = await ensureTryonJobs(db.supabase, 'u1', [outfit(1, [['top_inner', 'a']])]);
    expect(states.size).toBe(0);
  });
});

describe('getTryonStates', () => {
  it('只回本人的工作', async () => {
    const db = fakeDb({
      rows: [
        { id: 'j1', user_id: 'u1', job_key: 'k1', person_path: '', items: [], status: 'running', result_path: null },
        { id: 'j2', user_id: 'u2', job_key: 'k2', person_path: '', items: [], status: 'done', result_path: 'u2/tryon/j2.png' },
      ],
    });
    const states = await getTryonStates(db.supabase, 'u1', ['j1', 'j2']);
    expect(states).toEqual([{ jobId: 'j1', status: 'running' }]);
  });
});
