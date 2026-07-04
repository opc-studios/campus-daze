# 同舟喵济 - Docker 一键部署脚本
# 用法: .\deploy.ps1 [-Build] [-Up] [-Down] [-Logs] [-Status] [-InitDb]
#   -Build   构建镜像
#   -Up      启动容器（含构建）
#   -Down    停止并移除容器
#   -Logs    查看日志
#   -Status  查看容器状态
#   -InitDb  初始化数据库（建表 + 图片入库）
#
# 默认行为: -Up（构建并启动）

param(
    [switch]$Build,
    [switch]$Up,
    [switch]$Down,
    [switch]$Logs,
    [switch]$Status,
    [switch]$InitDb
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$composeFile = Join-Path $scriptDir "docker-compose.prod.yml"
$envFile = Join-Path $scriptDir ".env"

# 默认行为
if (-not ($Build -or $Up -or $Down -or $Logs -or $Status -or $InitDb)) {
    $Up = $true
}

function Write-Info  { param([string]$Msg) Write-Host "[INFO]  $Msg" -ForegroundColor Cyan }
function Write-OK    { param([string]$Msg) Write-Host "[OK]    $Msg" -ForegroundColor Green }
function Write-Warn  { param([string]$Msg) Write-Host "[WARN]  $Msg" -ForegroundColor Yellow }
function Write-Err   { param([string]$Msg) Write-Host "[ERROR] $Msg" -ForegroundColor Red }

# 检查 docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Err "未检测到 docker，请先安装 Docker Desktop"
    Write-Info "下载: https://www.docker.com/products/docker-desktop"
    exit 1
}

# 检查 docker compose
$composeCmd = "docker compose"
try {
    & docker compose version 2>&1 | Out-Null
} catch {
    $composeCmd = "docker-compose"
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Err "未检测到 docker compose"
        exit 1
    }
}
Write-OK "Compose 命令: $composeCmd"

# 检查 .env
if (-not (Test-Path $envFile)) {
    Write-Warn "未找到 .env，从 .env.docker.example 复制"
    Copy-Item (Join-Path $scriptDir ".env.docker.example") $envFile
    Write-OK "已创建 $envFile"
    Write-Warn "请修改其中的密码/密钥后重新运行"
    Write-Info "或继续使用默认值（仅测试环境推荐）"
}

# ============================================================
# 执行操作
# ============================================================

if ($Build) {
    Write-Info "构建镜像..."
    & $composeCmd -f $composeFile build
    if ($LASTEXITCODE -ne 0) { Write-Err "构建失败"; exit 1 }
    Write-OK "构建完成"
}

if ($Up) {
    Write-Info "启动容器（含构建）..."
    & $composeCmd -f $composeFile up -d --build
    if ($LASTEXITCODE -ne 0) { Write-Err "启动失败"; exit 1 }
    Write-OK "容器已启动"

    Write-Info "等待 MySQL 健康检查..."
    Start-Sleep -Seconds 10

    # 初始化数据库（仅首次）
    Write-Info "执行数据库初始化..."
    & $composeCmd -f $composeFile exec -T backend python init_db.py 2>&1 | ForEach-Object {
        Write-Host "  $_" -ForegroundColor Gray
    }

    Write-Host ""
    Write-OK "部署完成"
    Write-OK "前端 + API: http://localhost:8000"
    Write-Info "查看日志: .\deploy.ps1 -Logs"
    Write-Info "停止服务: .\deploy.ps1 -Down"
}

if ($Down) {
    Write-Info "停止并移除容器..."
    & $composeCmd -f $composeFile down
    if ($LASTEXITCODE -ne 0) { Write-Err "停止失败"; exit 1 }
    Write-OK "容器已停止"
}

if ($Logs) {
    Write-Info "查看日志（Ctrl+C 退出）..."
    & $composeCmd -f $composeFile logs -f
}

if ($Status) {
    & $composeCmd -f $composeFile ps
}

if ($InitDb) {
    Write-Info "初始化数据库..."
    & $composeCmd -f $composeFile exec -T backend python -m alembic upgrade head
    & $composeCmd -f $composeFile exec -T backend python init_db.py
    Write-OK "初始化完成"
}
