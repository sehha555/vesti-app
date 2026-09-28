import type { Scenario, ScenarioRun } from './pipeline';

// 成績單：把每題跑幾次的結果整理成數字，另外產生一份給人看的 Markdown（含抽查用的搭配與評審理由）。

export interface ScenarioSummary {
  id: string;
  title: string;
  runs: ScenarioRun[];
  /** 評審平均分（1–5）；沒有評分時為 null */
  judgeMean: number | null;
  /** 每次跑的平均分之間的差距（最高減最低），看分數穩不穩 */
  judgeRange: number | null;
  rulesPassed: number;
  rulesTotal: number;
  failedRules: string[];
  errors: string[];
}

export interface Report {
  createdAt: string;
  model: string;
  judgeModel: string | null;
  /** 穿搭守則（prompt）的指紋，改了守則這裡就會變 */
  promptVersion: string;
  repeat: number;
  judgeMean: number | null;
  rulePassRate: number | null;
  scenarios: ScenarioSummary[];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const round = (x: number | null, d = 2) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);

export function summarizeScenario(scenario: Scenario, runs: ScenarioRun[]): ScenarioSummary {
  const runMeans = runs.map((r) => mean(r.verdicts.map((v) => v.score))).filter((x): x is number => x != null);
  const rules = runs.flatMap((r) => r.rules);
  const failed = new Map<string, number>();
  for (const r of rules) if (!r.passed) failed.set(r.label, (failed.get(r.label) ?? 0) + 1);
  return {
    id: scenario.id,
    title: scenario.title,
    runs,
    judgeMean: round(mean(runMeans)),
    judgeRange: runMeans.length ? round(Math.max(...runMeans) - Math.min(...runMeans)) : null,
    rulesPassed: rules.filter((r) => r.passed).length,
    rulesTotal: rules.length,
    failedRules: [...failed].map(([label, n]) => (runs.length > 1 ? `${label}（${n} 次）` : label)),
    errors: runs.map((r) => r.error).filter((e): e is string => Boolean(e)),
  };
}

export function buildReport(params: Omit<Report, 'judgeMean' | 'rulePassRate'>): Report {
  const { scenarios } = params;
  const passed = scenarios.reduce((a, s) => a + s.rulesPassed, 0);
  const total = scenarios.reduce((a, s) => a + s.rulesTotal, 0);
  return {
    ...params,
    judgeMean: round(mean(scenarios.map((s) => s.judgeMean).filter((x): x is number => x != null))),
    rulePassRate: total ? round(passed / total, 3) : null,
  };
}

const fmt = (x: number | null) => (x == null ? '—' : x.toFixed(2));
const pct = (x: number | null) => (x == null ? '—' : `${Math.round(x * 100)}%`);

export function toMarkdown(report: Report): string {
  const lines: string[] = [
    `# 穿搭考卷成績（${report.createdAt}）`,
    '',
    `- 搭配模型：${report.model}　評審模型：${report.judgeModel ?? '（沒有評分）'}`,
    `- 穿搭守則版本：${report.promptVersion}　每題跑 ${report.repeat} 次`,
    '',
    '## 總成績',
    '',
    `| 評審平均分（1–5） | 規則通過率 |`,
    `|---|---|`,
    `| **${fmt(report.judgeMean)}** | **${pct(report.rulePassRate)}** |`,
    '',
    '## 每一題',
    '',
    '| 題目 | 平均分 | 分數差距 | 規則 | 沒通過的規則 |',
    '|---|---|---|---|---|',
  ];
  for (const s of report.scenarios) {
    const problems = [...s.failedRules, ...s.errors.map((e) => `⚠ ${e}`)].join('；') || '—';
    lines.push(`| ${s.title} | ${fmt(s.judgeMean)} | ${fmt(s.judgeRange)} | ${s.rulesPassed}/${s.rulesTotal} | ${problems} |`);
  }

  lines.push('', '## 抽查用：每題第一次的搭配與評審理由', '', '看看評審給的分數跟你的感覺一不一樣。差很多的話，要調整評審的標準。', '');
  for (const s of report.scenarios) {
    const run = s.runs[0];
    lines.push(`### ${s.title}`, '');
    if (!run) continue;
    if (run.feedbackSummary) lines.push('給 AI 的回饋：', '', ...run.feedbackSummary.split('\n').map((l) => `> ${l}`), '');
    if (run.outfits.length === 0) lines.push(`沒有搭出任何一套。${run.error ?? ''}`, '');
    run.outfits.forEach((o, i) => {
      const v = run.verdicts.find((x) => x.index === i + 1);
      lines.push(`**第 ${i + 1} 套：${o.title}**${v ? `　評審 ${v.score} 分` : ''}`, '');
      lines.push(`- 衣服：${o.items.join(' + ')}`, `- 造型師理由：${o.reason}`);
      if (o.howToWear) lines.push(`- 穿法：${o.howToWear}`);
      if (v?.reasons.length) lines.push(`- 評審理由：${v.reasons.join('；')}`);
      if (v?.problems.length) lines.push(`- 扣分原因：${v.problems.join('；')}`);
      lines.push('');
    });
    const failed = run.rules.filter((r) => !r.passed);
    if (failed.length) lines.push(`沒通過的規則：${failed.map((r) => `${r.label}${r.detail ? `（${r.detail}）` : ''}`).join('；')}`, '');
  }
  return lines.join('\n');
}

/** 比較兩次成績：每題分數變化，方便看改了守則之後是變好還是變差 */
export function compareReports(a: Report, b: Report): string {
  const diff = (x: number | null, y: number | null) => (x == null || y == null ? '—' : `${y - x >= 0 ? '+' : ''}${(y - x).toFixed(2)}`);
  const lines = [
    `# 成績比較：${a.createdAt} → ${b.createdAt}`,
    '',
    `穿搭守則版本：${a.promptVersion} → ${b.promptVersion}`,
    '',
    `| | 之前 | 之後 | 變化 |`,
    `|---|---|---|---|`,
    `| 評審平均分 | ${fmt(a.judgeMean)} | ${fmt(b.judgeMean)} | ${diff(a.judgeMean, b.judgeMean)} |`,
    `| 規則通過率 | ${pct(a.rulePassRate)} | ${pct(b.rulePassRate)} | ${a.rulePassRate != null && b.rulePassRate != null ? `${Math.round((b.rulePassRate - a.rulePassRate) * 100)} 個百分點` : '—'} |`,
    '',
    '| 題目 | 之前 | 之後 | 變化 |',
    '|---|---|---|---|',
  ];
  const before = new Map(a.scenarios.map((s) => [s.id, s]));
  for (const s of b.scenarios) {
    const old = before.get(s.id);
    lines.push(`| ${s.title} | ${fmt(old?.judgeMean ?? null)} | ${fmt(s.judgeMean)} | ${diff(old?.judgeMean ?? null, s.judgeMean)} |`);
  }
  lines.push('', '分數差距在 0.3 以內通常只是 AI 每次答案不同造成的，不代表真的變好或變差；用 --repeat 3 以上比較準。');
  return lines.join('\n');
}
