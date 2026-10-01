// 試穿生圖的 prompt 與參考圖順序（桌機 worker 用；純函式，方便測試）
// 做法來自 2026-10-01 的試穿迭代：先把每件衣服抽成無字的平拍圖，再拿「人物照 + 平拍圖」換裝；
// 下身另外附原始照片當版型參考（平拍圖會失去穿著時的寬度與弧度）

// 試穿順序：內搭 → 外套 → 下身 → 鞋；配件不換
const SLOT_ORDER = ['top_inner', 'top_outer', 'bottom', 'shoes'];

/** 抽平拍圖的輸出尺寸：下身是長的，其他用正方形 */
export function flatSize(slotKey) {
  return slotKey === 'bottom' ? { w: 768, h: 1152 } : { w: 1024, h: 1024 };
}

/** 把一件衣服從原始照片抽成平拍商品圖的 prompt */
export function extractPrompt(item) {
  return (
    `從圖 1 把這件${item.name}單獨抽出來，做成平放的商品圖：純白背景，正面平放，整件完整入鏡置中。` +
    '保留原本的顏色、材質紋理、版型、長度和所有細節（領口、袖口、口袋、縫線、開衩）。' +
    '不要任何文字、logo、標籤、人、手或其他衣服。'
  );
}

/**
 * 依 job 的衣服排出參考圖順序並組 prompt。
 * items: [{ slotKey, name }]，只取 SLOT_ORDER 裡的部位，同部位只取第一件。
 * 回傳 refs: [{ kind: 'person' } | { kind: 'flat', index } | { kind: 'shape', index }]，
 * index 指回 items 的位置；圖的編號就是 refs 的順序 + 1。
 */
export function buildTryonPlan(items) {
  const picked = [];
  for (const slot of SLOT_ORDER) {
    const index = items.findIndex((it) => it.slotKey === slot);
    if (index !== -1) picked.push({ slot, index });
  }

  const refs = [{ kind: 'person' }];
  const lines = [];
  for (const { slot, index } of picked) {
    refs.push({ kind: 'flat', index });
    const n = refs.length;
    const name = items[index].name;
    if (slot === 'top_inner') lines.push(`上身改穿圖 ${n} 的${name}。`);
    if (slot === 'top_outer') lines.push(`外面套上圖 ${n} 的${name}，穿在上衣外面。`);
    if (slot === 'bottom') lines.push(`下身改穿圖 ${n} 的${name}。`);
    if (slot === 'shoes') lines.push(`腳上換成圖 ${n} 的${name}。`);
  }
  if (!picked.some((p) => p.slot === 'shoes')) lines.push('腳上保留圖 1 原本的鞋子。');

  const bottom = picked.find((p) => p.slot === 'bottom');
  if (bottom) {
    refs.push({ kind: 'shape', index: bottom.index });
    lines.push(
      `圖 ${refs.length} 是同一件下身的原始照片，褲子或裙子的寬度、弧度、長度、顏色深淺都照它；` +
        '照片裡的人、其他衣服、手、鞋和文字都不要。'
    );
  }

  const prompt = [
    '這是一張換裝編輯：輸出圖的構圖必須跟圖 1 一模一樣，只換衣服。人物在畫面中的位置、大小、相機角度、身體朝向都跟圖 1 相同。',
    '圖 1 的臉、五官、髮型、膚色、身高體型、站姿、手的位置、眼鏡和飾品、背景、光線都完全保持不變。',
    ...lines,
    '衣服的顏色、材質、版型、寬度、長度都照參考圖，要真的穿在這個人身上，跟著身形與姿勢有自然的皺褶、垂墜與陰影，不要像貼上去的；褲長蓋到鞋面時要自然堆在鞋上。',
    '不要任何文字或 logo。全身入鏡。',
  ].join('\n');

  return { prompt, refs };
}
