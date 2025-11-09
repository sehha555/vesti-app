// ========================================
// Figma UI 整合到 Next.js 專案 (Node.js 版本 - 跨平台)
// ========================================
// 使用方式: node migrate-figma-ui.js

const fs = require('fs');
const path = require('path');

console.log('🚀 開始整合 Figma UI 到 Next.js 專案...\n');

// 定義路徑變數
const FIGMA_DIR = 'figma-export';
const WEB_APP = path.join('apps', 'web');
const COMPONENTS_DIR = path.join(WEB_APP, 'app', 'components');
const PAGES_DIR = path.join(WEB_APP, 'app');

// 檢查 Figma 匯出資料夾是否存在
if (!fs.existsSync(FIGMA_DIR)) {
  console.error('❌ 錯誤: 找不到', FIGMA_DIR, '資料夾');
  console.error('請將 Figma 匯出的資料夾命名為 figma-export 並放在專案根目錄');
  process.exit(1);
}

// ========================================
// 步驟 1: 建立目錄結構
// ========================================
console.log('📁 步驟 1/6: 建立目錄結構...');

const directories = [
  path.join(COMPONENTS_DIR, 'ui'),
  path.join(COMPONENTS_DIR, 'sections'),
  path.join(COMPONENTS_DIR, 'pages'),
  path.join(WEB_APP, 'app', 'styles'),
  path.join(WEB_APP, 'app', 'wardrobe'),
  path.join(WEB_APP, 'app', 'analysis'),
  path.join(WEB_APP, 'app', 'store'),
  path.join(WEB_APP, 'app', 'profile'),
  path.join(WEB_APP, 'app', 'explore'),
  path.join(WEB_APP, 'app', 'tryon'),
];

directories.forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

console.log('✅ 目錄結構建立完成\n');

// ========================================
// 步驟 2: 複製全域樣式
// ========================================
console.log('🎨 步驟 2/6: 複製全域樣式...');

const globalCssPath = path.join(FIGMA_DIR, 'styles', 'global.css');
if (fs.existsSync(globalCssPath)) {
  fs.copyFileSync(globalCssPath, path.join(WEB_APP, 'app', 'globals.css'));
  console.log('✅ globals.css 已複製');
} else {
  console.log('⚠️  找不到 global.css，跳過');
}

const indexCssPath = path.join(FIGMA_DIR, 'index.css');
if (fs.existsSync(indexCssPath)) {
  fs.copyFileSync(indexCssPath, path.join(WEB_APP, 'app', 'styles', 'index.css'));
  console.log('✅ index.css 已複製');
}

console.log('');

// ========================================
// 步驟 3: 複製 UI 元件
// ========================================
console.log('🧩 步驟 3/6: 複製 UI 元件...');

const uiComponents = [
  'BottomNavigation',
  'Button',
  'Card',
  'Input',
  'Badge',
  'Avatar',
];

uiComponents.forEach((component) => {
  const sourcePath = path.join(FIGMA_DIR, 'components', `${component}.tsx`);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(
      sourcePath,
      path.join(COMPONENTS_DIR, 'ui', `${component}.tsx`)
    );
    console.log(`  ✅ ${component}.tsx`);
  }
});

console.log('');

// ========================================
// 步驟 4: 複製 Section 元件
// ========================================
console.log('📦 步驟 4/6: 複製 Section 元件...');

const sectionComponents = [
  'WeatherSection',
  'QuickFunctionCards',
  'DailyOutfitSection',
  'PersonalizedSection',
];

sectionComponents.forEach((component) => {
  const sourcePath = path.join(FIGMA_DIR, 'components', `${component}.tsx`);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(
      sourcePath,
      path.join(COMPONENTS_DIR, 'sections', `${component}.tsx`)
    );
    console.log(`  ✅ ${component}.tsx`);
  }
});

console.log('');

// ========================================
// 步驟 5: 複製頁面元件到對應路由
// ========================================
console.log('📄 步驟 5/6: 複製頁面元件...');

const pageMapping = {
  WardrobePage: path.join(PAGES_DIR, 'wardrobe', 'page.tsx'),
  AnalysisPage: path.join(PAGES_DIR, 'analysis', 'page.tsx'),
  StorePage: path.join(PAGES_DIR, 'store', 'page.tsx'),
  ProfilePage: path.join(PAGES_DIR, 'profile', 'page.tsx'),
  ExplorePage: path.join(PAGES_DIR, 'explore', 'page.tsx'),
  TryOnPage: path.join(PAGES_DIR, 'tryon', 'page.tsx'),
};

Object.entries(pageMapping).forEach(([page, dest]) => {
  const sourcePath = path.join(FIGMA_DIR, 'components', `${page}.tsx`);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, dest);
    console.log(`  ✅ ${page} -> ${dest}`);
  }
});

// AINavigatorTab
const aiNavPath = path.join(FIGMA_DIR, 'components', 'AINavigatorTab.tsx');
if (fs.existsSync(aiNavPath)) {
  fs.copyFileSync(
    aiNavPath,
    path.join(COMPONENTS_DIR, 'pages', 'AINavigatorTab.tsx')
  );
  console.log('  ✅ AINavigatorTab -> components/pages/');
}

console.log('');

// ========================================
// 步驟 6: 複製其他元件
// ========================================
console.log('🔧 步驟 6/6: 複製其他元件...');

const componentsPath = path.join(FIGMA_DIR, 'components');
if (fs.existsSync(componentsPath)) {
  const files = fs.readdirSync(componentsPath);

  files.forEach((file) => {
    if (!file.endsWith('.tsx')) return;

    const alreadyCopied =
      fs.existsSync(path.join(COMPONENTS_DIR, 'ui', file)) ||
      fs.existsSync(path.join(COMPONENTS_DIR, 'sections', file)) ||
      fs.existsSync(path.join(COMPONENTS_DIR, 'pages', file));

    if (!alreadyCopied) {
      fs.copyFileSync(
        path.join(componentsPath, file),
        path.join(COMPONENTS_DIR, 'pages', file)
      );
      console.log(`  ✅ ${file} -> components/pages/`);
    }
  });
}

// ========================================
// 完成
// ========================================
console.log('\n✨ 整合完成！\n');
console.log('📋 下一步操作：');
console.log('1. 執行修復腳本: node scripts/fix-imports.js');
console.log('2. 檢查 apps/web/app/layout.tsx');
console.log('3. 檢查 apps/web/app/page.tsx');
console.log('4. 執行: cd apps/web && npm run dev');
console.log('');
