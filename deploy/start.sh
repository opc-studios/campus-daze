#!/bin/bash

APP_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
LOG_DIR="$BACKEND_DIR/logs"
VENV_DIR="$BACKEND_DIR/venv"
PID_DIR="/var/run/campus_daze"
BACKEND_PORT=8000

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e ""
echo -e "======================================"
echo -e "  Campus Daze - Startup Script"
echo -e "======================================"
echo -e ""

echo -e "[${BLUE}1/5${NC}] Creating log directories..."
mkdir -p "$LOG_DIR" "$PID_DIR"
echo -e "   [${GREEN}OK${NC}] Log directories created"

echo -e ""
echo -e "[${BLUE}2/5${NC}] Checking dependencies..."
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "   [${RED}FAIL${NC}] Python is not installed"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1 | cut -d' ' -f2)
echo -e "   [${GREEN}OK${NC}] Python $PYTHON_VERSION found"

if ! command -v npm &> /dev/null; then
    echo -e "   [${RED}FAIL${NC}] Node.js/npm is not installed"
    exit 1
fi
NPM_VERSION=$(npm --version)
echo -e "   [${GREEN}OK${NC}] npm $NPM_VERSION found"

echo -e ""
echo -e "[${BLUE}3/5${NC}] Initializing database..."
cd "$BACKEND_DIR"
if [ -f "$VENV_DIR/bin/python" ]; then
    "$VENV_DIR/bin/python" -c "from api.utils.database import init_sqlite_tables; init_sqlite_tables()"
else
    "$PYTHON_CMD" -c "from api.utils.database import init_sqlite_tables; init_sqlite_tables()"
fi
if [ $? -ne 0 ]; then
    echo -e "   [${RED}FAIL${NC}] Database initialization failed"
    exit 1
fi
echo -e "   [${GREEN}OK${NC}] Database initialized"

echo -e ""
echo -e "[${BLUE}4/5${NC}] Starting backend service on port $BACKEND_PORT..."
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t &> /dev/null; then
    echo -e "   [${YELLOW}WARN${NC}] Port $BACKEND_PORT is occupied, releasing..."
    lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t | xargs -r kill -9
fi

cd "$BACKEND_DIR"
if [ -f "$VENV_DIR/bin/uvicorn" ]; then
    nohup "$VENV_DIR/bin/uvicorn" api.main:app --host 0.0.0.0 --port $BACKEND_PORT --log-level info > "$LOG_DIR/backend.log" 2>&1 &
else
    nohup "$PYTHON_CMD" -m uvicorn api.main:app --host 0.0.0.0 --port $BACKEND_PORT --log-level info > "$LOG_DIR/backend.log" 2>&1 &
fi
BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_DIR/backend.pid"

wait_for_service() {
    local url="$1"
    local max_tries="$2"
    local try=0
    while [ $try -lt $max_tries ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
            return 0
        fi
        try=$((try + 1))
        echo -e "   Waiting for service... ($try/$max_tries)"
        sleep 2
    done
    return 1
}

if wait_for_service "http://localhost:$BACKEND_PORT" 10; then
    echo -e "   [${GREEN}OK${NC}] Backend service started (PID: $BACKEND_PID)"
else
    echo -e "   [${RED}FAIL${NC}] Backend service failed to start"
    kill "$BACKEND_PID" 2>/dev/null || true
    rm -f "$PID_DIR/backend.pid"
    exit 1
fi

echo -e ""
echo -e "[${BLUE}5/5${NC}] Starting frontend service..."
cd "$FRONTEND_DIR"
nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$PID_DIR/frontend.pid"
echo -e "   [${GREEN}OK${NC}] Frontend service started (PID: $FRONTEND_PID)"

echo -e ""
echo -e "======================================"
echo -e "  [${GREEN}ALL SERVICES STARTED${NC}]"
echo -e "======================================"
echo -e ""
echo -e "Backend API:     http://localhost:$BACKEND_PORT"
echo -e "Frontend:        http://localhost:3000"
echo -e "API Documentation: http://localhost:$BACKEND_PORT/docs"
echo -e ""
echo -e "Log files:"
echo -e "  - Backend: $LOG_DIR/backend.log"
echo -e "  - Frontend: $LOG_DIR/frontend.log"
echo -e ""