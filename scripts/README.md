# Scripts

專案使用的各類 scripts 說明。

## tests/ - 測試 Scripts

用於執行各類測試的 scripts：
- `smoke.sh` - 煙霧測試（基本功能檢查）
- `smoke_api.sh` - API 煙霧測試
- `test_daily_outfit_plans_api.sh` - 日常穿搭計畫 API 測試
- `test-api.sh` - 通用 API 測試
- `test-api.js` - Node.js API 測試工具
- `test-qwen-vl.js` - Qwen VL 模型測試

## tools/ - 工具 Scripts

專案維護與開發工具：
- `fix-imports.js` - 修復 import 路徑
- `migrate-figma-ui.js` - Figma UI 遷移工具

## setup/ - 設置 Scripts

環境與工具設置：
- `ollama_vision_tag.ps1` - Ollama Vision 模型標籤設置（PowerShell）

## 執行方式

```bash
# 測試
bash scripts/tests/smoke.sh
bash scripts/tests/smoke_api.sh

# 工具
node scripts/tools/fix-imports.js

# 設置 (PowerShell)
.scripts/setup/ollama_vision_tag.ps1
```
