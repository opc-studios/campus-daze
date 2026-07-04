# 同舟喵济 - 启动后端服务（生产模式）
# 用法: .\start-backend.ps1 [-Dev]
#   -Dev  开发模式（uvicorn --reload）
param([switch]$Dev)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 后端启动") -ForegroundColor Cyan
Ensure-Dirs

# 检查端口
if (Test-PortInUse $BACKEND_PORT) {
    $proc = Get-PortProcess $BACKEND_PORT
    if ($proc) {
        Write-Warn "端口 $BACKEND_PORT 已被占用 (PID=$($proc.Id), $($proc.ProcessName))"
    } else {
        Write-Warn "端口 $BACKEND_PORT 已被占用"
    }
    Write-Err "请先执行 .\stop.ps1 停止现有服务"
    exit 1
}

# 检查 .env
if (-not (Test-BackendEnv)) {
    Write-Warn "未找到 backend/.env，从 .env.example 复制"
    Copy-Item (Join-Path $BACKEND_DIR ".env.example") (Join-Path $BACKEND_DIR ".env")
    Write-OK "已创建 backend/.env，请按需修改数据库/JWT 配置"
}

# 检查依赖
$python = Get-BackendPython
Write-Step "使用 Python: $python"
Push-Location $BACKEND_DIR
try {
    Write-Step "检查后端依赖（首次运行较慢）"
    $pip = Get-BackendPip
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $pipList = & $pip list 2>&1 | Out-String
    $ErrorActionPreference = $prevEAP
    if ($pipList -match "fastapi") {
        Write-OK "后端依赖已安装"
    } else {
        Write-Info "安装后端依赖..."
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $pip install -r requirements.txt 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        $ErrorActionPreference = $prevEAP
        if ($LASTEXITCODE -ne 0) { Write-Err "依赖安装失败"; exit 1 }
    }

    # 启动 uvicorn
    $mode = if ($Dev) { "开发 (reload)" } else { "生产" }
    Write-Step "启动 uvicorn [$mode] -> http://localhost:$BACKEND_PORT"
    Write-Info "日志: $BACKEND_LOG"

    $args = @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "$BACKEND_PORT")
    if ($Dev) { $args += "--reload" }

    # 后台启动，重定向输出到日志
    $proc = Start-Process -FilePath $python `
        -ArgumentList $args `
        -WorkingDirectory $BACKEND_DIR `
        -RedirectStandardOutput $BACKEND_LOG `
        -RedirectStandardError "$BACKEND_LOG.err" `
        -WindowStyle Hidden `
        -PassThru

    Save-PID $BACKEND_PID_FILE $proc.Id
    Write-OK "后端进程已启动 (PID=$($proc.Id))"

    # 等待健康检查
    $ok = Wait-Service -Name "后端" -Test { Test-BackendHealth } -TimeoutSec 30
    if (-not $ok) {
        Write-Err "后端启动失败，请查看日志: $BACKEND_LOG"
        Write-Info "最近 20 行错误日志:"
        if (Test-Path "$BACKEND_LOG.err") {
            Get-Content "$BACKEND_LOG.err" -Tail 20 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
        exit 1
    }
    Write-OK "后端就绪: http://localhost:$BACKEND_PORT/api/health"
}
finally {
    Pop-Location
}
