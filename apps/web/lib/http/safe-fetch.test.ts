import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isPrivateAddress, assertPublicHttpsUrl, safeFetch, clearRobotsCache, SafeFetchError } from './safe-fetch';

vi.mock('dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    const table: Record<string, string> = {
      'internal.example': '10.0.0.5',
      'metadata.example': '169.254.169.254',
      'public.example': '93.184.216.34',
    };
    return [{ address: table[host] ?? '93.184.216.34', family: 4 }];
  }),
}));

describe('isPrivateAddress', () => {
  it.each([
    ['127.0.0.1', true],
    ['10.1.2.3', true],
    ['172.16.0.1', true],
    ['172.31.255.255', true],
    ['172.32.0.1', false],
    ['192.168.1.1', true],
    ['169.254.169.254', true],
    ['100.64.0.1', true],
    ['8.8.8.8', false],
    ['::1', true],
    ['fd00::1', true],
    ['fe80::1', true],
    ['::ffff:10.0.0.1', true],
    ['2606:4700::1111', false],
  ])('%s → %s', (ip, expected) => {
    expect(isPrivateAddress(ip)).toBe(expected);
  });
});

describe('assertPublicHttpsUrl', () => {
  const expectBlocked = async (url: string) => {
    await expect(assertPublicHttpsUrl(url)).rejects.toMatchObject({ code: 'BLOCKED' });
  };

  it('擋 http', () => expectBlocked('http://public.example/'));
  it('擋 file / ftp', async () => {
    await expectBlocked('file:///etc/passwd');
    await expectBlocked('ftp://public.example/');
  });
  it('擋 localhost 與 .local', async () => {
    await expectBlocked('https://localhost/');
    await expectBlocked('https://printer.local/');
  });
  it('擋直接寫 IP 的私有位址', () => expectBlocked('https://169.254.169.254/latest/meta-data'));
  it('擋解析到私有網段的 hostname', async () => {
    await expectBlocked('https://internal.example/');
    await expectBlocked('https://metadata.example/');
  });
  it('擋帶帳密的網址', () => expectBlocked('https://user:pw@public.example/'));
  it('放行公開 https', async () => {
    const url = await assertPublicHttpsUrl('https://public.example/item/1');
    expect(url.hostname).toBe('public.example');
  });
  it('錯誤型別是 SafeFetchError', async () => {
    await expect(assertPublicHttpsUrl('not a url')).rejects.toBeInstanceOf(SafeFetchError);
  });
});

describe('封鎖名單', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('內建擋蝦皮（含子網域）', async () => {
    for (const url of ['https://shopee.tw/product/1', 'https://cf.shopee.tw/file/abc']) {
      await expect(assertPublicHttpsUrl(url)).rejects.toMatchObject({ code: 'DISALLOWED' });
    }
  });

  it('可用 FETCH_BLOCKED_DOMAINS 追加', async () => {
    vi.stubEnv('FETCH_BLOCKED_DOMAINS', 'brand.example, other.example');
    await expect(assertPublicHttpsUrl('https://img.brand.example/a.jpg')).rejects.toMatchObject({ code: 'DISALLOWED' });
    await expect(assertPublicHttpsUrl('https://notbrand.example/a.jpg')).resolves.toBeInstanceOf(URL);
  });
});

describe('safeFetch：robots.txt 與 User-Agent', () => {
  const OPTS = { maxBytes: 1024 * 1024, timeoutMs: 5000, accept: ['text/html'] };
  let fetchMock: ReturnType<typeof vi.fn>;

  const respond = (routes: Record<string, () => Response>) => {
    fetchMock = vi.fn(async (input: URL | string) => {
      const url = input.toString();
      const handler = routes[url];
      if (!handler) throw new Error(`unexpected fetch ${url}`);
      return handler();
    });
    vi.stubGlobal('fetch', fetchMock);
  };
  const text = (body: string, status = 200, type = 'text/plain') =>
    () => new Response(body, { status, headers: { 'content-type': type } });

  beforeEach(() => clearRobotsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('robots.txt 不允許就不抓，連目標網址都不會打', async () => {
    respond({ 'https://public.example/robots.txt': text('User-agent: *\nDisallow: /p/') });
    await expect(safeFetch('https://public.example/p/1', OPTS)).rejects.toMatchObject({ code: 'DISALLOWED' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('允許時照常抓，並如實標示 VestiBot', async () => {
    respond({
      'https://public.example/robots.txt': text('User-agent: *\nDisallow: /admin'),
      'https://public.example/p/1': text('<html></html>', 200, 'text/html'),
    });
    const res = await safeFetch('https://public.example/p/1', OPTS);
    expect(res.contentType).toBe('text/html');
    const headers = fetchMock.mock.calls[1][1].headers as Record<string, string>;
    expect(headers['User-Agent']).toContain('VestiBot');
    expect(headers['User-Agent']).not.toContain('Chrome');
  });

  it('robots.txt 404 視為沒有限制', async () => {
    respond({
      'https://public.example/robots.txt': text('not found', 404),
      'https://public.example/p/1': text('<html></html>', 200, 'text/html'),
    });
    await expect(safeFetch('https://public.example/p/1', OPTS)).resolves.toMatchObject({ contentType: 'text/html' });
  });

  it('robots.txt 5xx 視為全部不允許（RFC 9309）', async () => {
    respond({ 'https://public.example/robots.txt': text('oops', 503) });
    await expect(safeFetch('https://public.example/p/1', OPTS)).rejects.toMatchObject({ code: 'DISALLOWED' });
  });

  it('同一個網站的 robots.txt 只抓一次', async () => {
    respond({
      'https://public.example/robots.txt': text(''),
      'https://public.example/p/1': text('<html></html>', 200, 'text/html'),
      'https://public.example/p/2': text('<html></html>', 200, 'text/html'),
    });
    await safeFetch('https://public.example/p/1', OPTS);
    await safeFetch('https://public.example/p/2', OPTS);
    const robotsCalls = fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/robots.txt'));
    expect(robotsCalls).toHaveLength(1);
  });

  it('redirect 到另一個網站時也看那個網站的 robots.txt', async () => {
    respond({
      'https://public.example/robots.txt': text(''),
      'https://public.example/go': () => new Response(null, { status: 302, headers: { location: 'https://cdn.example/img' } }),
      'https://cdn.example/robots.txt': text('User-agent: *\nDisallow: /'),
    });
    await expect(safeFetch('https://public.example/go', OPTS)).rejects.toMatchObject({ code: 'DISALLOWED' });
  });
});

describe('safeFetch：同時抓同一網站', () => {
  beforeEach(() => clearRobotsCache());
  afterEach(() => vi.unstubAllGlobals());

  it('平行請求共用同一次 robots.txt 抓取', async () => {
    const fetchMock = vi.fn(async (input: URL | string) => {
      const url = input.toString();
      if (url.endsWith('/robots.txt')) return new Response('', { status: 200, headers: { 'content-type': 'text/plain' } });
      return new Response('x', { status: 200, headers: { 'content-type': 'image/jpeg' } });
    });
    vi.stubGlobal('fetch', fetchMock);

    const opts = { maxBytes: 1024, timeoutMs: 5000, accept: ['image/'] };
    await Promise.all([1, 2, 3, 4].map((n) => safeFetch(`https://public.example/img/${n}.jpg`, opts)));

    const robotsCalls = fetchMock.mock.calls.filter(([u]) => u.toString().endsWith('/robots.txt'));
    expect(robotsCalls).toHaveLength(1);
  });
});
