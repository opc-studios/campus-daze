# 同舟喵济 - 构建前端 dist
# 用法: .\build-frontend.ps1 [-Clean]
#   -Clean  清理 dist 后重新构建
param([switch]$Clean)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 构建前端") -ForegroundColor Cyan

Push-Location $FRONTEND_DIR
try {
    if (-not (Test-Path "node_modules")) {
        Write-Step "首次运行，安装前端依赖..."
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        npm install 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        $ErrorActionPreference = $prevEAP
        if ($LASTEXITCODE -ne 0) { Write-Err "npm install 失败"; exit 1 }
    }

    if ($Clean -and (Test-Path "dist")) {
        Write-Step "清理 dist 目录"
        Remove-Item "dist" -Recurse -Force
    }

    Write-Step "执行 vite build"
    $start = Get-Date
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    npm run build 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    $ErrorActionPreference = $prevEAP
    $elapsed = (Get-Date) - $start
    if ($LASTEXITCODE -ne 0) { Write-Err "vite build 失败"; exit 1 }

    if (Test-Path "dist\index.html") {
        $size = (Get-ChildItem "dist" -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeKB = [math]::Round($size / 1KB, 2)
        Write-OK "构建成功 (用时 $([math]::Round($elapsed.TotalSeconds, 2))s, 总大小 $sizeKB KB)"
        Write-Info "输出: $FRONTEND_DIR\dist"
    } else {
        Write-Err "构建产物缺失: dist\index.html"
        exit 1
    }
}
finally {
    Pop-Location
}
