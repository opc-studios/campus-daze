# 同舟喵济 - 重启服务
# 用法: .\restart.ps1 [-Dev]
param([switch]$Dev)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 重启服务") -ForegroundColor Yellow

Write-Step "停止现有服务"
& (Join-Path $LOCAL_DIR "stop.ps1")

Start-Sleep -Seconds 2

Write-Step "重新启动"
$startArgs = @()
if ($Dev) { $startArgs += "-Dev" }
& (Join-Path $LOCAL_DIR "start.ps1") @startArgs
