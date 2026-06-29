#!/bin/bash

set -e

APP_DIR="/opt/campus-daze"
FRONTEND_DIR="/var/www/campus-daze/frontend"
LOG_DIR="/var/log/campus_daze"
VENV_DIR="$APP_DIR/venv"
USER="www-data"

echo "======================================"
echo "  学术喵的奇幻之旅 - 部署脚本"
echo "======================================"

echo ""
echo "[1/7] 创建目录结构..."
mkdir -p "$APP_DIR"
mkdir -p "$FRONTEND_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "/var/run/campus_daze"

echo "[2/7] 安装系统依赖..."
apt-get update
apt-get install -y python3 python3-venv python3-dev nginx redis-server supervisor mysql-server git curl nodejs npm

echo "[3/7] 创建Python虚拟环境..."
python3 -m venv "$VENV_DIR"
"$VENV_DIR/bin/pip" install --upgrade pip

echo "[4/7] 安装Python依赖..."
cd "$APP_DIR/backend"
"$VENV_DIR/bin/pip" install -r requirements.txt

echo "[5/7] 构建前端..."
cd "$APP_DIR/frontend"
npm install
npm run build
cp -r dist/* "$FRONTEND_DIR/"

echo "[6/7] 配置Nginx..."
cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/campus-daze
ln -sf /etc/nginx/sites-available/campus-daze /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "[7/7] 配置Supervisor..."
cp "$APP_DIR/deploy/supervisord.conf" /etc/supervisor/conf.d/campus-daze.conf

echo ""
echo "======================================"
echo "  部署完成!"
echo "======================================"
echo ""
echo "下一步操作:"
echo "  1. 配置数据库连接 (编辑 $APP_DIR/backend/.env)"
echo "  2. 初始化数据库 (运行 $APP_DIR/backend/init.sql)"
echo "  3. 启动服务: supervisorctl start campus-daze"
echo "  4. 重启Nginx: systemctl restart nginx"
echo ""
echo "日志位置:"
echo "  - 后端日志: $LOG_DIR/backend.log"
echo "  - Nginx日志: /var/log/nginx/campus_daze_access.log"
echo ""