# Ollama Vision 圖片標籤腳本
param(
    [string]$ImagePath = "C:\Users\User\Desktop\Test_picture.png",
    [string]$OllamaUrl = "http://127.0.0.1:11434",
    [string]$Model = "llama3.2-vision:11b"
)

# 檢查圖片是否存在
if (-not (Test-Path $ImagePath)) {
    Write-Error "Image not found: $ImagePath"
    exit 1
}

# 驗證 OllamaUrl 只能是本地地址（防止圖片外送）
if ($OllamaUrl -notmatch "^http://127\.0\.0\.1:") {
    Write-Error "Security Error: OllamaUrl must be http://127.0.0.1 (local only). Got: $OllamaUrl"
    exit 1
}

# 讀取圖片並轉為 base64（不加 data:image 前綴）
$imageBytes = [System.IO.File]::ReadAllBytes($ImagePath)
$base64Image = [System.Convert]::ToBase64String($imageBytes)

# 構建請求 body
$body = @{
    model = $Model
    stream = $false
    format = @{
        type = "object"
        additionalProperties = $false
        required = @("category","color","pattern","material","style","season","occasion")
        properties = @{
            category = @{ type = "string" }
            color    = @{ type = "string" }
            pattern  = @{ type = "string" }
            material = @{ type = "string" }
            style    = @{ type = "string" }
            season   = @{ type = "string"; enum = @("spring","summer","autumn","winter","all_seasons") }
            occasion = @{ type = "string"; enum = @("casual","work","formal","sport","outdoor","date","home") }
        }
    }
    options = @{
        temperature = 0
    }
    messages = @(
        @{
            role = "user"
            content = "Analyze this clothing image. Respond ONLY with a JSON object containing these exact keys: category, color, pattern, material, style, season, occasion. No explanation, just JSON."
            images = @($base64Image)
        }
    )
} | ConvertTo-Json -Depth 10

# 調用 Ollama API
try {
    $response = Invoke-RestMethod -Uri "$OllamaUrl/api/chat" -Method POST -Body $body -ContentType "application/json"

    # 只輸出 assistant 的 content（JSON 部分）
    $content = $response.message.content

    # 驗證輸出是否為有效 JSON
    try {
        $jsonObj = $content | ConvertFrom-Json

        # Normalize（Trim + ToLowerInvariant）
        if ($jsonObj.season)   { $jsonObj.season   = $jsonObj.season.Trim().ToLowerInvariant() }
        if ($jsonObj.occasion) { $jsonObj.occasion = $jsonObj.occasion.Trim().ToLowerInvariant() }

        # Season 容錯映射
        $seasonMap = @{
            "fall" = "autumn"
            "all"  = "all_seasons"
        }
        if ($jsonObj.season -and $seasonMap.ContainsKey($jsonObj.season)) {
            $jsonObj.season = $seasonMap[$jsonObj.season]
        }

        # Occasion 容錯映射
        $occasionMap = @{
            "office"   = "work"
            "workwear" = "work"
            "athletic" = "sport"
        }
        if ($jsonObj.occasion -and $occasionMap.ContainsKey($jsonObj.occasion)) {
            $jsonObj.occasion = $occasionMap[$jsonObj.occasion]
        }

        # 二次驗證（enum + required 非空）
        $validSeasons   = @("spring","summer","autumn","winter","all_seasons")
        $validOccasions = @("casual","work","formal","sport","outdoor","date","home")

        foreach ($k in @("category","color","pattern","material","style","season","occasion")) {
            if (-not $jsonObj.PSObject.Properties.Name.Contains($k) -or [string]::IsNullOrWhiteSpace($jsonObj.$k)) {
                Write-Error "Invalid output: missing/empty key=$k"
                exit 1
            }
        }

        if ($validSeasons -notcontains $jsonObj.season) {
            Write-Error "Invalid season: $($jsonObj.season)"
            exit 1
        }
        if ($validOccasions -notcontains $jsonObj.occasion) {
            Write-Error "Invalid occasion: $($jsonObj.occasion)"
            exit 1
        }

        # 輸出驗證通過的 JSON
        Write-Output ($jsonObj | ConvertTo-Json -Compress)
    }
    catch {
        Write-Error "Invalid JSON output from API: $_"
        Write-Output $content
        exit 1
    }
}
catch {
    Write-Error "API call failed: $_"
    exit 1
}
