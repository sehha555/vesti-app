// ========================================
// 修復 import 路徑的 Node.js 腳本
// ========================================
// 使用方式: node scripts/fix-imports.js

const fs = require('fs');
const path = require('path');

const WEB_APP = 'apps/web/app';

// 需要修復的檔案模式
const importMappings = {
  // 將 './components/XXX' 改為正確的路徑
  './components/BottomNavigation': '@/components/ui/BottomNavigation',
  './components/WeatherSection': '@/components/sections/WeatherSection',
  './components/QuickFunctionCards': '@/components/sections/QuickFunctionCards',
  './components/DailyOutfitSection': '@/components/sections/DailyOutfitSection',
  './components/PersonalizedSection': '@/components/sections/PersonalizedSection',
  './components/WardrobePage': '@/wardrobe/page',
  './components/AnalysisPage': '@/analysis/page',
  './components/StorePage': '@/store/page',
  './components/ProfilePage': '@/profile/page',
  './components/ExplorePage': '@/explore/page',
  './components/TryOnPage': '@/tryon/page',
  './components/AINavigatorTab': '@/components/pages/AINavigatorTab',
  './components/ui/sonner': 'sonner',
};

function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // 修復 import 路徑
  for (const [oldPath, newPath] of Object.entries(importMappings)) {
    const regex = new RegExp(
      `from ['"]${oldPath.replace(/\//g, '\\/')}['"]`,
      'g'
    );
    if (content.match(regex)) {
      content = content.replace(regex, `from "${newPath}"`);
      modified = true;
    }
  }

  // 如果是頁面檔案，確保有 'use client' (如果使用了 hooks)
  if (
    (content.includes('useState') ||
      content.includes('useEffect') ||
      content.includes('useRouter')) &&
    !content.includes("'use client'")
  ) {
    content = "'use client'\n\n" + content;
    modified = true;
  }

  // 儲存修改
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`✅ 修復: ${filePath}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (fixImports(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('🔧 開始修復 import 路徑...\n');
const fixedCount = walkDir(WEB_APP);
console.log(`\n✨ 完成！共修復 ${fixedCount} 個檔案`);
