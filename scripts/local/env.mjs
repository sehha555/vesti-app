#!/usr/bin/env node
// 把本機 Supabase 的網址與金鑰寫進 apps/web/.env.local（`npm run local:env`）。
// - 只改 Supabase 那三行，其他設定（例如 GEMINI_API_KEY）原封不動
// - 第一次執行會先把原本的檔案備份成 .env.local.before-local
// - apps/web/.env.local 沒有 GEMINI_API_KEY、但專案根目錄的 .env.local / .env 有，就複製過來
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const target = join(root, 'apps', 'web', '.env.local');
const backup = `${target}.before-local`;

function parseEnv(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

let status;
try {
  status = parseEnv(execSync('npx supabase status -o env', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
} catch {
  console.error('讀不到本機 Supabase。請先執行 npm run local:db:start（Docker 要先開著）。');
  process.exit(1);
}
if (!status.API_URL || !status.ANON_KEY || !status.SERVICE_ROLE_KEY) {
  console.error('本機 Supabase 看起來還沒啟動完成，請再執行一次 npm run local:db:start。');
  process.exit(1);
}

const updates = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
};

let text = existsSync(target) ? readFileSync(target, 'utf8') : '';
if (text && !existsSync(backup)) {
  copyFileSync(target, backup);
  console.log(`已備份原本的設定到 ${backup}`);
}

const current = parseEnv(text);
if (!current.GEMINI_API_KEY) {
  for (const file of ['.env.local', '.env']) {
    const key = existsSync(join(root, file)) && parseEnv(readFileSync(join(root, file), 'utf8')).GEMINI_API_KEY;
    if (key) {
      updates.GEMINI_API_KEY = key;
      console.log(`從根目錄的 ${file} 複製 GEMINI_API_KEY`);
      break;
    }
  }
}

for (const [key, value] of Object.entries(updates)) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^\\s*${key}\\s*=.*$`, 'm');
  text = re.test(text) ? text.replace(re, line) : `${text}${text && !text.endsWith('\n') ? '\n' : ''}${line}\n`;
}
writeFileSync(target, text);

console.log(`已把本機 Supabase 設定寫進 ${target}`);
if (!parseEnv(text).GEMINI_API_KEY) {
  console.log('⚠ 還沒有 GEMINI_API_KEY：AI 認衣服與搭配推薦不會運作。請在上面這個檔案加一行 GEMINI_API_KEY=你的金鑰');
}
console.log('測試帳號：test@vesti.local / vesti-test-1234');
