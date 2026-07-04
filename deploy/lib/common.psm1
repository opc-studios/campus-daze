# 同舟喵济 - PowerShell 共享函数库
# 用法：在脚本中 Import-Module "$PSScriptRoot\..\lib\common.psm1"

# ============================================================
# 路径定义
# ============================================================
$global:PROJECT_ROOT = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$global:BACKEND_DIR = Join-Path $PROJECT_ROOT "backend"
$global:FRONTEND_DIR = Join-Path $PROJECT_ROOT "frontend"
$global:DEPLOY_DIR = Join-Path $PROJECT_ROOT "deploy"
$global:LOCAL_DIR = Join-Path $DEPLOY_DIR "local"
$global:LOG_DIR = Join-Path $LOCAL_DIR "logs"
$global:PID_DIR = Join-Path $LOCAL_DIR "logs"

# 端口配置
$global:BACKEND_PORT = 8000
$global:FRONTEND_PORT = 5173

# PID 文件
$global:BACKEND_PID_FILE = Join-Path $PID_DIR "backend.pid"
$global:FRONTEND_PID_FILE = Join-Path $PID_DIR "frontend.pid"

# 日志文件
$global:BACKEND_LOG = Join-Path $LOG_DIR "backend.log"
$global:FRONTEND_LOG = Join-Path $LOG_DIR "frontend.log"

# ============================================================
# 颜色输出
# ============================================================
function Write-Info  { param([string]$Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "[OK]    $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Err   { param([string]$Msg) Write-Host "[ERROR] $Msg" -ForegroundColor Red }
function Write-Step  { param([string]$Msg) Write-Host "===> $Msg" -ForegroundColor White }

# ============================================================
# 确保目录存在
# ============================================================
function Ensure-Dirs {
    foreach ($d in @($LOG_DIR)) {
        if (-not (Test-Path $d)) {
            New-Item -ItemType Directory -Force -Path $d | Out-Null
        }
    }
}

# ============================================================
# 检查命令是否可用
# ============================================================
function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

# ============================================================
# 检查端口是否被占用（兼容 PowerShell 5.x，使用 netstat 避免 NetTCPIP 模块加载问题）
# ============================================================
function Test-PortInUse {
    param([int]$Port)
    # 使用 netstat 检查（最可靠，无模块依赖，无 TcpListener 的 SO_REUSEADDR 误判问题）
    try {
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $lines = netstat -ano -p TCP | Where-Object { $_ -match '^\s*TCP\s' }
        $ErrorActionPreference = $prevEAP
        foreach ($line in $lines) {
            $parts = $line -split '\s+' | Where-Object { $_ }
            if ($parts.Count -ge 4 -and $parts[1] -match ":$Port$" -and $parts[3] -eq 'LISTENING') {
                return $true
            }
        }
    } catch {
        # 忽略错误
    }
    return $false
}

# ============================================================
# 获取占用端口的进程（通过 netstat 解析）
# ============================================================
function Get-PortProcess {
    param([int]$Port)
    try {
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $lines = netstat -ano -p TCP | Where-Object { $_ -match '^\s*TCP\s' }
        $ErrorActionPreference = $prevEAP
        foreach ($line in $lines) {
            $parts = $line -split '\s+' | Where-Object { $_ }
            if ($parts.Count -ge 4 -and $parts[1] -match ":$Port$" -and $parts[3] -eq 'LISTENING') {
                $procId = [int]$parts[4]
                return Get-Process -Id $procId -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # 忽略错误
    }
    return $null
}

# ============================================================
# 健康检查 - 后端
# ============================================================
function Test-BackendHealth {
    param([int]$TimeoutSec = 3)
    try {
        $r = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/health" -TimeoutSec $TimeoutSec
        return $r.status -eq "healthy"
    } catch {
        return $false
    }
}

# ============================================================
# 健康检查 - 前端
# ============================================================
function Test-FrontendHealth {
    param([int]$TimeoutSec = 3)
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$FRONTEND_PORT" -TimeoutSec $TimeoutSec -UseBasicParsing
        return $r.StatusCode -eq 200
    } catch {
        return $false
    }
}

# ============================================================
# 等待服务就绪
# ============================================================
function Wait-Service {
    param(
        [string]$Name,
        [scriptblock]$Test,
        [int]$TimeoutSec = 30
    )
    $elapsed = 0
    while ($elapsed -lt $TimeoutSec) {
        if (& $Test) {
            Write-OK "$Name 已就绪 (等待 ${elapsed}s)"
            return $true
        }
        Start-Sleep -Seconds 1
        $elapsed++
    }
    Write-Err "$Name 在 ${TimeoutSec}s 内未就绪"
    return $false
}

# ============================================================
# 保存 PID
# ============================================================
function Save-PID {
    param([string]$File, [int]$PID)
    Set-Content -Path $File -Value $PID -Encoding ASCII
}

# ============================================================
# 读取 PID
# ============================================================
function Read-PID {
    param([string]$File)
    if (Test-Path $File) {
        $v = (Get-Content $File -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        if ($v -match '^\d+$') { return [int]$v }
    }
    return $null
}

# ============================================================
# 安全停止进程（按 PID）
# ============================================================
function Stop-PID {
    param([int]$ProcessId, [string]$Name = "process")
    if (-not $ProcessId) { return $false }
    $p = Get-Process -Id $ProcessId -ErrorAction SilentlyContinue
    if (-not $p) { return $false }
    try {
        Stop-Process -Id $ProcessId -Force -ErrorAction Stop
        Write-OK "已停止 $Name (PID=$ProcessId)"
        return $true
    } catch {
        Write-Warn "停止 $Name (PID=$ProcessId) 失败: $($_.Exception.Message)"
        return $false
    }
}

# ============================================================
# 检查依赖工具
# ============================================================
function Test-Dependencies {
    Write-Step "检查依赖工具"
    $missing = @()
    foreach ($t in @('python','node','npm')) {
        if (Test-Command $t) {
            $v = & $t --version 2>&1 | Select-Object -First 1
            Write-OK ("{0,-8} {1}" -f $t, $v)
        } else {
            Write-Err "缺少 $t"
            $missing += $t
        }
    }
    if ($missing.Count -gt 0) {
        Write-Err "缺失依赖，请先安装: $($missing -join ', ')"
        return $false
    }
    return $true
}

# ============================================================
# 检查 Python 虚拟环境
# ============================================================
function Test-Venv {
    $venv = Join-Path $BACKEND_DIR ".venv"
    $venvScripts = Join-Path $venv "Scripts"
    return (Test-Path (Join-Path $venvScripts "python.exe"))
}

# ============================================================
# 获取后端 Python 命令（优先虚拟环境）
# ============================================================
function Get-BackendPython {
    $venv = Join-Path $BACKEND_DIR ".venv\Scripts\python.exe"
    if (Test-Path $venv) { return $venv }
    return "python"
}

function Get-BackendPip {
    $venv = Join-Path $BACKEND_DIR ".venv\Scripts\pip.exe"
    if (Test-Path $venv) { return $venv }
    return "pip"
}

# ============================================================
# 检查后端 .env 是否存在
# ============================================================
function Test-BackendEnv {
    return (Test-Path (Join-Path $BACKEND_DIR ".env"))
}

# ============================================================
# 检查前端 dist 是否存在
# ============================================================
function Test-FrontendDist {
    return (Test-Path (Join-Path $FRONTEND_DIR "dist\index.html"))
}

# ============================================================
# 获取当前脚本所在路径（用于显示）
# ============================================================
function Get-ScriptBanner {
    param([string]$Title)
    $line = "=" * 60
    return "$line`n  $Title`n$line"
}

Export-ModuleMember -Function `
    Write-Info, Write-OK, Write-Warn, Write-Err, Write-Step, `
    Ensure-Dirs, Test-Command, Test-PortInUse, Get-PortProcess, `
    Test-BackendHealth, Test-FrontendHealth, Wait-Service, `
    Save-PID, Read-PID, Stop-PID, Test-Dependencies, `
    Test-Venv, Get-BackendPython, Get-BackendPip, `
    Test-BackendEnv, Test-FrontendDist, Get-ScriptBanner `
    -Variable PROJECT_ROOT, BACKEND_DIR, FRONTEND_DIR, DEPLOY_DIR, `
    LOCAL_DIR, LOG_DIR, PID_DIR, `
    BACKEND_PORT, FRONTEND_PORT, `
    BACKEND_PID_FILE, FRONTEND_PID_FILE, `
    BACKEND_LOG, FRONTEND_LOG
