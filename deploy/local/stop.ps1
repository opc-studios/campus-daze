# 同舟喵济 - 停止所有服务
# 用法: .\stop.ps1
$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 停止服务") -ForegroundColor Yellow
Ensure-Dirs

$stopped = 0

# 1. 通过 PID 文件停止前端
$frontPID = Read-PID $FRONTEND_PID_FILE
if ($frontPID -and (Stop-PID $frontPID "前端")) {
    $stopped++
}
Remove-Item $FRONTEND_PID_FILE -ErrorAction SilentlyContinue

# 2. 通过 PID 文件停止后端
$backPID = Read-PID $BACKEND_PID_FILE
if ($backPID -and (Stop-PID $backPID "后端")) {
    $stopped++
}
Remove-Item $BACKEND_PID_FILE -ErrorAction SilentlyContinue

# 3. 兜底：通过端口查找仍占用的进程
Write-Step "兜底检查端口占用"
foreach ($entry in @(
    @{ Port = $FRONTEND_PORT; Name = "前端" },
    @{ Port = $BACKEND_PORT;  Name = "后端" }
)) {
    if (Test-PortInUse $entry.Port) {
        $p = Get-PortProcess $entry.Port
        if ($p) {
            Write-Warn "$($entry.Name) 端口 $($entry.Port) 仍被占用 (PID=$($p.Id), $($p.ProcessName))"
            try {
                Stop-Process -Id $p.Id -Force -ErrorAction Stop
                Write-OK "已强制停止 $($entry.Name) (PID=$($p.Id))"
                $stopped++
            } catch {
                Write-Err "无法停止 PID=$($p.Id): $($_.Exception.Message)"
            }
        }
    }
}

# 4. 杀掉残留的 node/uvicorn 子进程（仅本机路径相关）
Write-Step "清理残留子进程"
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try { $_.Path -and $_.Path.StartsWith($PROJECT_ROOT) } catch { $false }
}
foreach ($n in $nodeProcs) {
    try { Stop-Process -Id $n.Id -Force; Write-OK "已停止 node (PID=$($n.Id))"; $stopped++ } catch {}
}

if ($stopped -eq 0) {
    Write-Info "无运行中的服务"
} else {
    Write-OK "共停止 $stopped 个进程"
}
