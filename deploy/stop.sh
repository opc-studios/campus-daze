#!/bin/bash

PID_DIR="/var/run/campus_daze"
BACKEND_PORT=8000
FRONTEND_PORT=3000

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e ""
echo -e "======================================"
echo -e "  Campus Daze - Shutdown Script"
echo -e "======================================"
echo -e ""

stop_process() {
    local pid_file="$1"
    local process_name="$2"
    local port="$3"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null
            echo -e "   [${GREEN}OK${NC}] $process_name stopped (PID: $pid)"
        else
            echo -e "   [${YELLOW}SKIP${NC}] $process_name PID $pid not found"
        fi
        rm -f "$pid_file"
    elif [ -n "$port" ] && lsof -Pi ":$port" -sTCP:LISTEN -t &> /dev/null; then
        lsof -Pi ":$port" -sTCP:LISTEN -t | xargs -r kill -9
        echo -e "   [${GREEN}OK${NC}] $process_name stopped (by port $port)"
    else
        echo -e "   [${YELLOW}SKIP${NC}] $process_name not running"
    fi
}

echo -e "[${BLUE}1/3${NC}] Stopping backend service (port $BACKEND_PORT)..."
stop_process "$PID_DIR/backend.pid" "Backend service" "$BACKEND_PORT"

echo -e ""
echo -e "[${BLUE}2/3${NC}] Stopping frontend service (port $FRONTEND_PORT)..."
stop_process "$PID_DIR/frontend.pid" "Frontend service" "$FRONTEND_PORT"

echo -e ""
echo -e "[${BLUE}3/3${NC}] Cleaning up orphaned processes..."
if pgrep -f "uvicorn api.main:app" &> /dev/null; then
    pkill -f "uvicorn api.main:app"
    echo -e "   [${GREEN}OK${NC}] Orphaned uvicorn processes cleaned up"
fi

if pgrep -f "npm run dev" &> /dev/null; then
    pkill -f "npm run dev"
    echo -e "   [${GREEN}OK${NC}] Orphaned npm processes cleaned up"
fi

rm -rf "$PID_DIR"/*.pid 2>/dev/null || true

echo -e ""
echo -e "======================================"
echo -e "  [${GREEN}ALL SERVICES STOPPED${NC}]"
echo -e "======================================"
echo -e ""