import { lookup } from 'dns/promises';
import { isIP } from 'net';

/**
 * 給「抓使用者提供的網址」用的 fetch，擋 SSRF：
 * - 只允許 https
 * - DNS 解析後擋私有網段、loopback、link-local（含雲端 metadata 169.254.169.254）
 * - redirect 最多 3 次，每一跳重新檢查
 * - 回應超過 maxBytes 就中斷
 * - Content-Type 不在白名單就拒絕
 */
export interface SafeFetchOptions {
  maxBytes: number;
  timeoutMs: number;
  /** Content-Type 前綴白名單，例如 ['text/html'] 或 ['image/'] */
  accept: string[];
}

export interface SafeFetchResult {
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
}

export class SafeFetchError extends Error {
  constructor(message: string, public readonly code: 'BLOCKED' | 'TOO_LARGE' | 'BAD_TYPE' | 'HTTP' | 'TIMEOUT') {
    super(message);
  }
}

const MAX_REDIRECTS = 3;

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
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);

    let res: Response;
    try {
      res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          // 部分電商對沒有 UA 的請求回 403
          'User-Agent': 'Mozilla/5.0 (compatible; VestiBot/1.0; +https://vesti.app)',
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
      throw new SafeFetchError(`Upstream responded ${res.status}`, 'HTTP');
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
