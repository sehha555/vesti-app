/**
 * robots.txt（RFC 9309）的最小實作：只處理 User-agent / Allow / Disallow。
 *
 * 規則：
 * - 先找名稱符合我們 bot 的群組，沒有才用 `*` 群組
 * - 路徑比對支援 `*`（任意字元）與結尾 `$`
 * - 同時符合 Allow 與 Disallow 時，比對字串較長的優先；一樣長時 Allow 優先
 */

export const BOT_TOKEN = 'vestibot';

export interface RobotsRule {
  allow: boolean;
  /** 規則本身的長度（不含結尾 $），衝突時比長短用 */
  length: number;
  regex: RegExp;
}

function compileRule(allow: boolean, pattern: string): RobotsRule {
  const anchored = pattern.endsWith('$');
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const source = body
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return { allow, length: body.length, regex: new RegExp(`^${source}${anchored ? '$' : ''}`) };
}

export function parseRobots(text: string, botToken = BOT_TOKEN): RobotsRule[] {
  const groups: Array<{ agents: string[]; rules: RobotsRule[] }> = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  let lastWasAgent = false;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim();
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (key === 'user-agent') {
      // 連續多行 User-agent 屬於同一個群組
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === 'allow' || key === 'disallow') && current) {
      lastWasAgent = false;
      // 空的 Disallow 代表全部允許，不需要規則
      if (value) current.rules.push(compileRule(key === 'allow', value));
    } else {
      lastWasAgent = false;
    }
  }

  const token = botToken.toLowerCase();
  const own = groups.filter((g) => g.agents.some((a) => a !== '*' && token.includes(a)));
  const chosen = own.length > 0 ? own : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

/** path 含 query，例如 `/tw/zh_TW/products/E123?color=01` */
export function isAllowedByRobots(rules: RobotsRule[], path: string): boolean {
  let best: RobotsRule | null = null;
  for (const rule of rules) {
    if (!rule.regex.test(path)) continue;
    if (!best || rule.length > best.length || (rule.length === best.length && rule.allow)) best = rule;
  }
  return best ? best.allow : true;
}
