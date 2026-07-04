# 同舟喵济 - 查看服务状态
# 用法: .\status.ps1
$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 服务状态") -ForegroundColor Cyan
Ensure-Dirs

# 后端状态
Write-Step "后端服务"
$backPID = Read-PID $BACKEND_PID_FILE
if (Test-BackendHealth) {
    try {
        $h = Invoke-RestMethod -Uri "http://localhost:$BACKEND_PORT/api/health" -TimeoutSec 3
        Write-OK "状态: $($h.status) | 版本: $($h.version)"
    } catch {
        Write-OK "状态: 运行中"
    }
    if ($backPID) { Write-Info "PID: $backPID" }
    $p = Get-PortProcess $BACKEND_PORT
    if ($p) { Write-Info "进程: $($p.ProcessName) (PID=$($p.Id))" }
} else {
    Write-Err "状态: 未运行"
    if ($backPID) { Write-Warn "上次 PID: $backPID（进程已退出）" }
}

# 前端状态
Write-Step "前端服务"
$frontPID = Read-PID $FRONTEND_PID_FILE
if (Test-FrontendHealth) {
    Write-OK "状态: 运行中"
    if ($frontPID) { Write-Info "PID: $frontPID" }
    $p = Get-PortProcess $FRONTEND_PORT
    if ($p) { Write-Info "进程: $($p.ProcessName) (PID=$($p.Id))" }
} else {
    Write-Err "状态: 未运行"
    if ($frontPID) { Write-Warn "上次 PID: $frontPID（进程已退出）" }
}

# 数据库状态
Write-Step "MySQL 数据库"
$python = Get-BackendPython
$dbCheck = & $python -c @"
import sys
try:
    import pymysql
    c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow', connect_timeout=3)
    cur = c.cursor()
    cur.execute('SELECT VERSION()')
    v = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM users')
    users = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM game_saves')
    saves = cur.fetchone()[0]
    cur.execute('SELECT COUNT(*) FROM game_images')
    images = cur.fetchone()[0]
    c.close()
    print(f'OK version={v} users={users} saves={saves} images={images}')
except Exception as e:
    print(f'FAIL {e}')
"@ 2>&1
if ($dbCheck -match "^OK") {
    Write-OK $dbCheck
} else {
    Write-Err "数据库不可用: $dbCheck"
}

# 端口监听
Write-Step "端口监听"
foreach ($port in @($FRONTEND_PORT, $BACKEND_PORT, 3306)) {
    if (Test-PortInUse $port) {
        $p = Get-PortProcess $port
        if ($p) {
            Write-OK "端口 $port : 监听中 ($($p.ProcessName))"
        } else {
            Write-OK "端口 $port : 监听中"
        }
    } else {
        Write-Warn "端口 $port : 未监听"
    }
}

# 日志文件
Write-Step "日志文件"
foreach ($log in @($BACKEND_LOG, $FRONTEND_LOG)) {
    if (Test-Path $log) {
        $size = (Get-Item $log).Length
        $time = (Get-Item $log).LastWriteTime
        Write-Info "$log ($size bytes, $time)"
    } else {
        Write-Info "$log (不存在)"
    }
}

Write-Host ""
Write-Host "提示：" -ForegroundColor Gray
Write-Host "  停止服务: .\stop.ps1" -ForegroundColor Gray
Write-Host "  重启服务: .\restart.ps1" -ForegroundColor Gray
Write-Host "  查看日志: Get-Content -Wait $BACKEND_LOG" -ForegroundColor Gray
