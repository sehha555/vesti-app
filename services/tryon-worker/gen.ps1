# 用 stable-diffusion.cpp + Qwen-Image 2.1 生一張圖（試穿 worker 與手動實驗共用）
# 注意：Qwen-Image 2.1 是非商用授權，App 給別人用或收費前要換 Qwen-Image-Edit-2511（只改這支）
# prompt 檔要存成 UTF-8（PowerShell 5 讀無 BOM 的中文會壞，這裡指定 UTF8 讀）
param(
  [string]$PromptFile,
  [string[]]$Refs = @(),
  [string]$Out,
  [int]$W = 896,
  [int]$H = 1184,
  [int]$Seed = 42,
  [int]$Steps = 6,
  [string]$SD = 'C:\Users\User\ai\sd-cpp'
)
$prompt = '<lora:viggle-turbo-6step-r128:1>' + (Get-Content -Raw -Encoding UTF8 $PromptFile).Trim()
$refArgs = @()
foreach ($r in $Refs) { $refArgs += '-r'; $refArgs += $r }
$started = Get-Date
& "$SD\bin\sd-cli.exe" --diffusion-model "$SD\models\qwen_image_2.1-Q8_0.gguf" --vae "$SD\models\qwen_image_2.1_vae_bf16.safetensors" --llm "$SD\models\Qwen3VL-8B-Instruct-Q4_K_M.gguf" --llm_vision "$SD\models\mmproj-Qwen3VL-8B-Instruct-F16.gguf" --lora-model-dir "$SD\models\lora" @refArgs -p $prompt -W $W -H $H --steps $Steps --cfg-scale 1.0 --sampling-method euler --offload-to-cpu --fa -s $Seed -o $Out 2>&1 | Select-String -Pattern 'ERROR|error|save result' | ForEach-Object { $_.Line }
"done in $([int]((Get-Date) - $started).TotalSeconds)s -> $Out"
