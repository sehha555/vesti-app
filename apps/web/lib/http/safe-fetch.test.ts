import { describe, it, expect, vi } from 'vitest';
import { isPrivateAddress, assertPublicHttpsUrl, SafeFetchError } from './safe-fetch';

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
