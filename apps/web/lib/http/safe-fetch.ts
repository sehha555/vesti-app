import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { parseRobots, isAllowedByRobots, type RobotsRule } from './robots';

/**
 * 給「抓使用者提供的網址」用的 fetch，擋 SSRF：
 * - 只允許 https
 * - DNS 解析後擋私有網段、loopback、link-local（含雲端 metadata 169.254.169.254）
 * - redirect 最多 3 次，每一跳重新檢查
 * - 回應超過 maxBytes 就中斷
 * - Content-Type 不在白名單就拒絕
 *
 * 另外依法遵要求（docs/legal/link-out-compliance.md）：
 * - User-Agent 如實標示 VestiBot，不偽裝成瀏覽器、不繞過網站的封鎖
 * - 每一跳都先看 robots.txt，不允許就不抓
 * - 封鎖名單上的網域一律不抓（條款明文禁止自動擷取的網站、權利人要求停止的網站）
 */
export interface SafeFetchOptions {
  maxBytes: number;
  timeoutMs: number;
  /** Content-Type 前綴白名單，例如 ['text/html'] 或 ['image/'] */
  accept: string[];
  /** 預設 true；只有抓 robots.txt 本身時關掉 */
  respectRobots?: boolean;
}

export interface SafeFetchResult {
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
}

export class SafeFetchError extends Error {
  constructor(
    message: string,
    public readonly code: 'BLOCKED' | 'DISALLOWED' | 'TOO_LARGE' | 'BAD_TYPE' | 'HTTP' | 'TIMEOUT',
    public readonly status?: number
  ) {
    super(message);
  }
}

const MAX_REDIRECTS = 3;

// 如實標示身分；設了 VESTI_BOT_INFO_URL 就附上說明 / 聯絡頁，方便網站管理者找到我們
export const USER_AGENT = `Mozilla/5.0 (compatible; VestiBot/1.0${
  process.env.VESTI_BOT_INFO_URL ? `; +${process.env.VESTI_BOT_INFO_URL}` : ''
})`;

// 蝦皮聯盟計畫條款禁止自動擷取其網站內容與素材（請改用聯盟 API / feed）
const BUILTIN_BLOCKED_DOMAINS = ['shopee.tw', 'shopee.com'];

function blockedDomains(): string[] {
  const extra = (process.env.FETCH_BLOCKED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean);
  return [...BUILTIN_BLOCKED_DOMAINS, ...extra];
}

export function isBlockedDomain(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return blockedDomains().some((d) => host === d || host.endsWith(`.${d}`));
}

// robots.txt 快取：同一個網站一小時內只抓一次；存 promise，同時進來的請求共用同一次抓取
const ROBOTS_TTL_MS = 60 * 60 * 1000;
const ROBOTS_CACHE_MAX = 500;
type RobotsVerdict = RobotsRule[] | 'deny-all';
const robotsCache = new Map<string, { verdict: Promise<RobotsVerdict>; expires: number }>();

/** 測試用 */
export function clearRobotsCache(): void {
  robotsCache.clear();
}

async function fetchRobots(origin: string): Promise<RobotsVerdict> {
  try {
    const res = await safeFetch(`${origin}/robots.txt`, {
      maxBytes: 512 * 1024,
      timeoutMs: 5_000,
      accept: [''],
      respectRobots: false,
    });
    return parseRobots(res.buffer.toString('utf8'));
  } catch (err) {
    // RFC 9309：4xx 視為沒有限制；5xx 或連不上視為全部不允許
    const status = err instanceof SafeFetchError ? err.status : undefined;
    return status !== undefined && status >= 400 && status < 500 ? [] : 'deny-all';
  }
}

function loadRobots(origin: string): Promise<RobotsVerdict> {
  const cached = robotsCache.get(origin);
  if (cached && cached.expires > Date.now()) return cached.verdict;

  if (robotsCache.size >= ROBOTS_CACHE_MAX) {
    const oldest = robotsCache.keys().next().value;
    if (oldest) robotsCache.delete(oldest);
  }
  const verdict = fetchRobots(origin);
  robotsCache.set(origin, { verdict, expires: Date.now() + ROBOTS_TTL_MS });
  return verdict;
}

async function assertAllowedByRobots(url: URL): Promise<void> {
  const rules = await loadRobots(url.origin);
  if (rules === 'deny-all' || !isAllowedByRobots(rules, url.pathname + url.search)) {
    throw new SafeFetchError('Disallowed by robots.txt', 'DISALLOWED');
  }
}

export function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) // CGNAT
    );
  }
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true; // link-local
    // IPv4-mapped ::ffff:a.b.c.d
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
  }
  return false;
}

export async function assertPublicHttpsUrl(rawUrl: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SafeFetchError('Invalid URL', 'BLOCKED');
  }
  if (url.protocol !== 'https:') {
    throw new SafeFetchError('Only https URLs are allowed', 'BLOCKED');
  }
  if (url.username || url.password) {
    throw new SafeFetchError('Credentials in URL are not allowed', 'BLOCKED');
  }
  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')) {
    throw new SafeFetchError('Host not allowed', 'BLOCKED');
  }
  if (isBlockedDomain(host)) {
    throw new SafeFetchError('Domain is on the blocklist', 'DISALLOWED');
  }

  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true })).map((a) => a.address);
  if (addresses.length === 0 || addresses.some(isPrivateAddress)) {
    throw new SafeFetchError('Host resolves to a private address', 'BLOCKED');
  }
  return url;
}

export async function safeFetch(rawUrl: string, options: SafeFetchOptions): Promise<SafeFetchResult> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpsUrl(current);
    if (options.respectRobots !== false) await assertAllowedByRobots(url);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': USER_AGENT,
          Accept: options.accept.join(', ') + ', */*;q=0.1',
        },
      });
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error).name === 'AbortError') throw new SafeFetchError('Request timed out', 'TIMEOUT');
      throw new SafeFetchError('Request failed', 'HTTP');
    }

    if (res.status >= 300 && res.status < 400) {
      clearTimeout(timer);
      const location = res.headers.get('location');
      if (!location) throw new SafeFetchError('Redirect without location', 'HTTP');
      current = new URL(location, url).toString();
      continue;
    }

    if (!res.ok) {
      clearTimeout(timer);
      throw new SafeFetchError(`Upstream responded ${res.status}`, 'HTTP', res.status);
    }

    const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
    if (!options.accept.some((prefix) => contentType.startsWith(prefix))) {
      clearTimeout(timer);
      throw new SafeFetchError(`Unexpected content type: ${contentType || 'unknown'}`, 'BAD_TYPE');
    }

    const declared = parseInt(res.headers.get('content-length') ?? '', 10);
    if (declared > options.maxBytes) {
      clearTimeout(timer);
      throw new SafeFetchError('Response too large', 'TOO_LARGE');
    }

    const chunks: Uint8Array[] = [];
    let total = 0;
    const reader = res.body?.getReader();
    if (!reader) {
      clearTimeout(timer);
      throw new SafeFetchError('Empty body', 'HTTP');
    }
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > options.maxBytes) {
          await reader.cancel();
          throw new SafeFetchError('Response too large', 'TOO_LARGE');
        }
        chunks.push(value);
      }
    } catch (err) {
      if (err instanceof SafeFetchError) throw err;
      if ((err as Error).name === 'AbortError') throw new SafeFetchError('Request timed out', 'TIMEOUT');
      throw new SafeFetchError('Read failed', 'HTTP');
    } finally {
      clearTimeout(timer);
    }

    return { buffer: Buffer.concat(chunks), contentType: contentType.split(';')[0].trim(), finalUrl: url.toString() };
  }

  throw new SafeFetchError('Too many redirects', 'HTTP');
}
