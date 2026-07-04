# 同舟喵济 - 初始化数据库（建表 + 13 张图片入库）
# 用法: .\init-db.ps1 [-Force]
#   -Force  强制重新初始化（删除现有数据）
param([switch]$Force)

$ErrorActionPreference = "Stop"
Import-Module "$PSScriptRoot\..\lib\common.psm1"

Write-Host (Get-ScriptBanner "同舟喵济 - 初始化数据库") -ForegroundColor Cyan

# 检查 .env
if (-not (Test-BackendEnv)) {
    Write-Warn "未找到 backend/.env，从 .env.example 复制"
    Copy-Item (Join-Path $BACKEND_DIR ".env.example") (Join-Path $BACKEND_DIR ".env")
    Write-OK "已创建 backend/.env"
    Write-Warn "请修改 backend/.env 中的 DATABASE_URL/JWT_SECRET_KEY 后重新执行本脚本"
    exit 1
}

$python = Get-BackendPython
Push-Location $BACKEND_DIR
try {
    # 1. 检查 MySQL 连通性
    Write-Step "检查 MySQL 连接"
    $connTest = & $python -c @"
import sys
try:
    import pymysql
    c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', connect_timeout=3)
    cur = c.cursor()
    cur.execute('SELECT VERSION()')
    print(f'OK {cur.fetchone()[0]}')
    c.close()
except Exception as e:
    print(f'FAIL {e}')
"@ 2>&1
    if ($connTest -match "^OK") {
        Write-OK $connTest
    } else {
        Write-Err "MySQL 不可用: $connTest"
        Write-Info "请确认 MySQL 服务运行中，且 backend/.env 配置正确"
        exit 1
    }

    # 2. 创建数据库（如不存在）
    Write-Step "创建数据库 tongzhou_meow（如不存在）"
    & $python -c @"
import pymysql
c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', connect_timeout=3)
cur = c.cursor()
cur.execute('CREATE DATABASE IF NOT EXISTS tongzhou_meow DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
c.commit()
c.close()
print('OK')
"@ 2>&1 | ForEach-Object { Write-OK $_ }

    # 3. 检查现有数据
    Write-Step "检查现有数据"
    $existing = & $python -c @"
import pymysql
c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow')
cur = c.cursor()
cur.execute('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=%s', ('tongzhou_meow',))
tables = cur.fetchone()[0]
imgs = 0
if tables > 0:
    try:
        cur.execute('SELECT COUNT(*) FROM game_images')
        imgs = cur.fetchone()[0]
    except: pass
c.close()
print(f'tables={tables} images={imgs}')
"@ 2>&1
    Write-Info "现有: $existing"

    if ($existing -match "images=(\d+)" -and [int]$Matches[1] -gt 0 -and -not $Force) {
        Write-Warn "数据库已存在图片数据 (count=$($Matches[1]))"
        Write-Warn "如需重新初始化，请使用 -Force 参数"
        Write-OK "跳过初始化"
        exit 0
    }

    if ($Force) {
        Write-Step "强制模式：清理现有数据"
        & $python -c @"
import pymysql
c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow')
cur = c.cursor()
for t in ['game_saves', 'game_images', 'users']:
    cur.execute(f'DROP TABLE IF EXISTS {t}')
c.commit()
c.close()
print('OK')
"@ 2>&1 | ForEach-Object { Write-OK $_ }
    }

    # 4. 应用 Alembic 迁移
    Write-Step "应用 Alembic 迁移"
    $pip = Get-BackendPip
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    $pipList = & $pip list 2>&1 | Out-String
    $ErrorActionPreference = $prevEAP
    if (-not ($pipList -match "alembic")) {
        Write-Info "安装 alembic..."
        $prevEAP = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        & $pip install alembic 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
        $ErrorActionPreference = $prevEAP
    }
    $prevEAP = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & $python -m alembic upgrade head 2>&1 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    $ErrorActionPreference = $prevEAP
    if ($LASTEXITCODE -ne 0) { Write-Err "Alembic 迁移失败"; exit 1 }
    Write-OK "数据库表已创建"

    # 5. 入库 13 张图片
    Write-Step "入库 13 张图片（5 立绘 + 5 精灵 + 1 Boss + 1 海报 + 1 地图）"
    & $python init_db.py 2>&1 | ForEach-Object {
        if ($_ -match "成功|OK|inserted|complete") {
            Write-OK $_
        } elseif ($_ -match "error|fail|exception") {
            Write-Err $_
        } else {
            Write-Info $_
        }
    }
    if ($LASTEXITCODE -ne 0) { Write-Err "图片入库失败"; exit 1 }

    # 6. 验证
    Write-Step "验证初始化结果"
    $verify = & $python -c @"
import pymysql
c = pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow')
cur = c.cursor()
cur.execute('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=%s', ('tongzhou_meow',))
tables = cur.fetchone()[0]
cur.execute('SELECT COUNT(*) FROM game_images')
imgs = cur.fetchone()[0]
c.close()
print(f'tables={tables} images={imgs}')
"@ 2>&1
    Write-OK "结果: $verify"
    Write-Host ""
    Write-Host (Get-ScriptBanner "初始化完成") -ForegroundColor Green
    Write-Info "下一步: .\start.ps1 启动服务"
}
finally {
    Pop-Location
}
