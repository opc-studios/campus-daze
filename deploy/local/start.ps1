# 同舟喵济 - 一键启动（生产模式）
# 用法: .\start.ps1 [-Dev] [-SkipBuild] [-Open]
#   -Dev        开发模式（uvicorn --reload + vite dev 热更新）
#   -SkipBuild  跳过前端构建（生产模式下复用现有 dist）
#   -Open       启动完成后打开浏览器
param(
    [switch]$Dev,
    [switch]$SkipBuild,
    [switch]$Open
)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 一键启动") -ForegroundColor Cyan
Write-Info "模式: $(if ($Dev) { '开发' } else { '生产' })"
Ensure-Dirs

# 1. 检查依赖
if (-not (Test-Dependencies)) { exit 1 }

# 2. 检查 MySQL
Write-Step "检查 MySQL 连接"
$python = Get-BackendPython
$mysqlCheck = & $python -c @"
import sys
try:
    import pymysql
    c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow', connect_timeout=3)
    cur = c.cursor()
    cur.execute('SELECT VERSION()')
    v = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM game_images')
    n = cur.fetchone()[0]
    c.close()
    print(f'OK {v} images={n}')
except Exception as e:
    print(f'FAIL {e}')
"@ 2>&1
if ($mysqlCheck -match "^OK") {
    Write-OK "MySQL: $mysqlCheck"
} else {
    Write-Err "MySQL 不可用: $mysqlCheck"
    Write-Info "请确认 MySQL 服务运行中，且 backend/.env 中 DATABASE_URL 配置正确"
    Write-Info "或执行 .\init-db.ps1 初始化数据库"
    exit 1
}

# 3. 启动后端
Write-Step "启动后端服务"
$backendArgs = @()
if ($Dev) { $backendArgs += "-Dev" }
& (Join-Path $LOCAL_DIR "start-backend.ps1") @backendArgs
if ($LASTEXITCODE -ne 0) { Write-Err "后端启动失败"; exit 1 }

# 4. 启动前端
Write-Step "启动前端服务"
$frontendArgs = @()
if ($Dev) { $frontendArgs += "-Dev" }
& (Join-Path $LOCAL_DIR "start-frontend.ps1") @frontendArgs
if ($LASTEXITCODE -ne 0) { Write-Err "前端启动失败"; exit 1 }

# 5. 完成
Write-Host ""
Write-Host (Get-ScriptBanner "部署完成") -ForegroundColor Green
Write-OK "前端: http://localhost:$FRONTEND_PORT"
Write-OK "后端: http://localhost:$BACKEND_PORT/api/health"
Write-Info "停止服务: .\stop.ps1"
Write-Info "查看状态: .\status.ps1"
Write-Info "查看日志: deploy\local\logs\"

if ($Open) {
    Write-Step "打开浏览器"
    Start-Process "http://localhost:$FRONTEND_PORT/login"
}
