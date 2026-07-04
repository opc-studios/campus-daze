# 同舟喵济 - 启动前端服务
# 用法: .\start-frontend.ps1 [-Dev]
#   -Dev  开发模式（vite dev，热更新）
#   默认  生产模式（vite build + vite preview）
param([switch]$Dev)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 前端启动") -ForegroundColor Cyan
Ensure-Dirs

# 检查端口
if (Test-PortInUse $FRONTEND_PORT) {
    $proc = Get-PortProcess $FRONTEND_PORT
    if ($proc) {
        Write-Warn "端口 $FRONTEND_PORT 已被占用 (PID=$($proc.Id), $($proc.ProcessName))"
    }
    Write-Err "请先执行 .\stop.ps1 停止现有服务"
    exit 1
}

# 检查 node_modules
Push-Location $FRONTEND_DIR
try {
    if (-not (Test-Path "node_modules")) {
        Write-Step "首次运行，安装前端依赖..."
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        npm install 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        $ErrorActionPreference = $prevEAP
        if ($LASTEXITCODE -ne 0) { Write-Err "npm install 失败"; exit 1 }
    } else {
        Write-OK "前端依赖已安装"
    }

    if ($Dev) {
        # 开发模式
        Write-Step "启动 vite dev server [开发模式] -> http://localhost:$FRONTEND_PORT"
        Write-Info "日志: $FRONTEND_LOG"

        # npm 是 .cmd 脚本，必须用 cmd.exe /c 启动，否则 Start-Process 报错 "%1 is not a valid Win32 application"
        $proc = Start-Process -FilePath "cmd.exe" `
            -ArgumentList @("/c", "npm", "run", "dev") `
            -WorkingDirectory $FRONTEND_DIR `
            -RedirectStandardOutput $FRONTEND_LOG `
            -RedirectStandardError "$FRONTEND_LOG.err" `
            -WindowStyle Hidden `
            -PassThru

        Save-PID $FRONTEND_PID_FILE $proc.Id
        Write-OK "前端进程已启动 (PID=$($proc.Id))"
    } else {
        # 生产模式：先 build 再 preview
        if (-not (Test-FrontendDist)) {
            Write-Step "未找到 dist，执行 vite build..."
            $prevEAP = $ErrorActionPreference
            $ErrorActionPreference = "Continue"
            npm run build 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
            $ErrorActionPreference = $prevEAP
            if ($LASTEXITCODE -ne 0) { Write-Err "vite build 失败"; exit 1 }
        } else {
            Write-OK "前端 dist 已存在"
        }

        Write-Step "启动 vite preview [生产模式] -> http://localhost:$FRONTEND_PORT"
        Write-Info "日志: $FRONTEND_LOG"

        # npm 是 .cmd 脚本，必须用 cmd.exe /c 启动
        $proc = Start-Process -FilePath "cmd.exe" `
            -ArgumentList @("/c", "npm", "run", "preview", "--", "--port", "$FRONTEND_PORT", "--host") `
            -WorkingDirectory $FRONTEND_DIR `
            -RedirectStandardOutput $FRONTEND_LOG `
            -RedirectStandardError "$FRONTEND_LOG.err" `
            -WindowStyle Hidden `
            -PassThru

        Save-PID $FRONTEND_PID_FILE $proc.Id
        Write-OK "前端进程已启动 (PID=$($proc.Id))"
    }

    # 等待健康检查
    $ok = Wait-Service -Name "前端" -Test { Test-FrontendHealth } -TimeoutSec 30
    if (-not $ok) {
        Write-Err "前端启动失败，请查看日志: $FRONTEND_LOG"
        Write-Info "最近 20 行错误日志:"
        if (Test-Path "$FRONTEND_LOG.err") {
            Get-Content "$FRONTEND_LOG.err" -Tail 20 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        }
        exit 1
    }
    Write-OK "前端就绪: http://localhost:$FRONTEND_PORT"
}
finally {
    Pop-Location
}
