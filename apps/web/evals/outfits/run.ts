// 穿搭考卷。用法見同資料夾的 README.md。
//   npm run eval:outfits -- fetch [--gender Men|Women]
//   npm run eval:outfits -- fetch-brand        （UNIQLO / GU 基本款，清單在 brand-items.json）
//   npm run eval:outfits -- run [--scenario id] [--limit N] [--repeat N] [--no-judge]
//   npm run eval:outfits -- compare results/A.json results/B.json
//   npm run eval:outfits -- tryon [results/A.json] [--per N] [--limit N]
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(here, '..', '..');
const imagesDir = join(here, 'images');
const resultsDir = join(here, 'results');

// 讀 apps/web/.env.local（再退到專案根目錄），只補還沒設定的變數；要在 import AI 程式之前做
for (const file of [join(webRoot, '.env.local'), join(webRoot, '..', '..', '.env.local'), join(webRoot, '..', '..', '.env')]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const args = process.argv.slice(2);
const command = args[0];
const flag = (name: string) => args.includes(`--${name}`);
const option = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};

function requireKey() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('找不到 GEMINI_API_KEY。請在 apps/web/.env.local 加一行 GEMINI_API_KEY=你的金鑰');
    process.exit(1);
  }
}

async function main() {
  if (command === 'fetch-brand') {
    requireKey();
    const { fetchBrandImages } = await import('./fetch-brand');
    console.log(`從 UNIQLO / GU 下載 brand-items.json 的商品圖到 ${imagesDir}（每件讓 AI 挑一張平拍圖）…`);
    await fetchBrandImages({ imagesDir, itemsPath: join(here, 'brand-items.json') });
    console.log('完成。');
    return;
  }

  if (command === 'fetch') {
    const { fetchImages } = await import('./fetch-images');
    const gender = option('gender') === 'Women' ? 'Women' : 'Men';
    console.log(`從 Hugging Face 下載照片（${gender}）到 ${imagesDir} …`);
    await fetchImages({ imagesDir, gender });
    console.log('完成。');
    return;
  }

  if (command === 'compare') {
    const [a, b] = args.slice(1, 3);
    if (!a || !b) throw new Error('用法：compare results/之前.json results/之後.json');
    const { compareReports } = await import('./report');
    const load = (p: string) => JSON.parse(readFileSync(resolve(process.cwd(), p), 'utf8'));
    console.log(compareReports(load(a), load(b)));
    return;
  }

  if (command === 'tryon') {
    const sdDir = process.env.SD_CPP_DIR;
    if (!sdDir) throw new Error('找不到 SD_CPP_DIR。請在 apps/web/.env.local 加一行 SD_CPP_DIR=stable-diffusion.cpp 的資料夾');
    // 沒指定成績單就用最新一份
    const target = args[1] && !args[1].startsWith('--') ? resolve(process.cwd(), args[1]) : undefined;
    const latest = readdirSync(resultsDir).filter((f) => f.endsWith('.json')).sort().at(-1);
    const resultsPath = target ?? (latest && join(resultsDir, latest));
    if (!resultsPath) throw new Error('results/ 沒有成績單，請先跑 run。');
    const { renderTryons } = await import('./tryon');
    const page = renderTryons({
      resultsPath,
      imagesDir,
      sdDir,
      perScenario: Number(option('per') ?? 2),
      limit: Number(option('limit') ?? Infinity),
    });
    console.log(`抽查頁：${page}`);
    return;
  }

  if (command === 'run') {
    requireKey();
    const { loadPool, ensureAttributes, runScenario } = await import('./pipeline');
    const { summarizeScenario, buildReport, toMarkdown } = await import('./report');
    const { JUDGE_MODEL } = await import('./judge');
    const { GEMINI_MODEL } = await import('../../lib/ai/gemini');
    const { OUTFIT_SYSTEM_PROMPT } = await import('../../lib/ai/outfit-prompt');

    const allPhotos = loadPool(imagesDir);
    if (allPhotos.length === 0) {
      console.error(`${imagesDir} 裡沒有照片。先執行 npm run eval:outfits -- fetch，或自己放照片（見 README）。`);
      process.exit(1);
    }

    // 先辨識（結果會存起來），才知道哪些是印花
    const cachePath = join(imagesDir, 'attributes.json');
    const cached = existsSync(cachePath) ? JSON.parse(readFileSync(cachePath, 'utf8')) : {};
    const toTag = allPhotos.filter((p) => !(p.id in cached)).length;
    if (toTag > 0) console.log(`先辨識 ${toTag} 張還沒辨識的照片（${toTag} 次 AI 呼叫，結果會存起來）。`);
    const attributes = await ensureAttributes(allPhotos, cachePath, (done, total) => process.stdout.write(`\r  辨識 ${done}/${total}`));
    if (toTag > 0) console.log('');
    // 日系簡約守則不要大印花：辨識成印花的不放進題目衣櫃
    // 模特兒照會被認成身上另一件（褲子的照片認成上衣），類別跟資料夾對不上的也拿掉
    const pool = allPhotos.filter((p) => {
      const a = attributes.get(p.id);
      return a?.pattern !== 'print' && (!a || a.category === p.category);
    });

    const all = JSON.parse(readFileSync(join(here, 'scenarios.json'), 'utf8')).scenarios as import('./pipeline').Scenario[];
    const only = option('scenario');
    const limit = Number(option('limit') ?? all.length);
    const counts = new Map<string, number>();
    for (const p of pool) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    const shortage = (s: (typeof all)[number]) =>
      Object.entries(s.closet)
        .filter(([cat, n]) => (counts.get(cat) ?? 0) < (n ?? 0))
        .map(([cat, n]) => `${cat} 需要 ${n} 張、只有 ${counts.get(cat) ?? 0} 張`);
    const selected = all.filter((s) => !only || s.id === only).slice(0, limit);
    const scenarios = selected.filter((s) => shortage(s).length === 0);
    for (const s of selected.filter((x) => shortage(x).length > 0)) {
      console.log(`跳過「${s.title}」：照片不夠（${shortage(s).join('、')}）`);
    }
    const repeat = Math.max(1, Number(option('repeat') ?? 1));
    const judge = !flag('no-judge');
    if (selected.length === 0) throw new Error(`找不到題目 ${only}`);
    if (scenarios.length === 0) throw new Error('每一題的照片都不夠，請先下載或放更多照片。');

    const calls = scenarios.length * repeat * (judge ? 2 : 1);
    console.log(
      `照片 ${allPhotos.length} 張（排除印花、認錯類別後 ${pool.length} 張）。` +
        `跑 ${scenarios.length} 題 × ${repeat} 次（約 ${calls} 次 AI 呼叫，每次搭配最多送 30 張照片）。`
    );

    const summaries = [];
    let errorsInRow = 0;
    outer: for (const scenario of scenarios) {
      const runs = [];
      for (let i = 0; i < repeat; i++) {
        process.stdout.write(`  ${scenario.title}（第 ${i + 1} 次）… `);
        let run = await runScenario({ scenario, pool, attributes, judge });
        // 免費方案每分鐘額度用完（或模型暫時太忙）時，等一分鐘重跑這一次，不算失敗
        if (run.error && /quota|high demand/i.test(run.error)) {
          process.stdout.write('額度用完，等 60 秒重試… ');
          await new Promise((r) => setTimeout(r, 60_000));
          run = await runScenario({ scenario, pool, attributes, judge });
        }
        const scores = run.verdicts.map((v) => v.score).join(',') || '—';
        console.log(run.error ? `⚠ ${run.error}` : `${run.outfits.length} 套，分數 ${scores}`);
        runs.push(run);
        errorsInRow = run.error ? errorsInRow + 1 : 0;
        if (errorsInRow >= 2) {
          summaries.push(summarizeScenario(scenario, runs));
          console.log('AI 呼叫連續失敗，先停下來。請確認金鑰與額度，已跑完的部分仍會存成成績單。');
          break outer;
        }
      }
      summaries.push(summarizeScenario(scenario, runs));
    }

    const createdAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
    const report = buildReport({
      createdAt,
      model: GEMINI_MODEL,
      judgeModel: judge ? JUDGE_MODEL : null,
      promptVersion: createHash('sha1').update(OUTFIT_SYSTEM_PROMPT).digest('hex').slice(0, 8),
      repeat,
      scenarios: summaries,
    });

    mkdirSync(resultsDir, { recursive: true });
    const stamp = createdAt.replace(/[-:]/g, '').replace('T', '-').replace('Z', '');
    writeFileSync(join(resultsDir, `${stamp}.json`), JSON.stringify(report, null, 2));
    writeFileSync(join(resultsDir, `${stamp}.md`), toMarkdown(report));
    console.log(`\n評審平均分：${report.judgeMean ?? '—'}　規則通過率：${report.rulePassRate == null ? '—' : `${Math.round(report.rulePassRate * 100)}%`}`);
    console.log(`成績單：${join(resultsDir, `${stamp}.md`)}`);
    if (judge && JUDGE_MODEL === GEMINI_MODEL) {
      console.log('提醒：評審跟搭配用的是同一個模型。在 .env.local 設 GEMINI_JUDGE_MODEL 換一個模型，分數會比較客觀。');
    }
    return;
  }

  console.log(`用法：
  npm run eval:outfits -- fetch [--gender Men|Women]   下載考卷用的衣服照片
  npm run eval:outfits -- run [選項]                    跑考卷
      --scenario <題目id>   只跑一題
      --limit <N>           只跑前 N 題（第一次建議 --limit 3 試試）
      --repeat <N>          每題跑 N 次（AI 每次答案不同，比較版本時建議 3）
      --no-judge            不請評審打分數，只檢查規則（比較省）
  npm run eval:outfits -- compare <之前.json> <之後.json>   比較兩次成績
  npm run eval:outfits -- tryon [成績單.json] [選項]       用本機 stable-diffusion.cpp 生成試穿圖和抽查頁（預設最新成績單）
      --per <N>             每題生成前 N 套（預設 2）
      --limit <N>           只做前 N 題`);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
