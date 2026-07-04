# ============================================================
# 同舟喵济 - 一体化 Dockerfile（多阶段构建）
# 不引入 Nginx——前端 dist 由 FastAPI StaticFiles 托管
# ============================================================

# ----- 阶段 1：构建前端 -----
FROM node:20-alpine AS frontend-builder

WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# ----- 阶段 2：安装 Python 依赖 -----
FROM python:3.12-slim AS backend-builder

WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# ----- 阶段 3：运行时镜像 -----
FROM python:3.12-slim

WORKDIR /app

# 运行时系统依赖（MySQL 客户端库）
RUN apt-get update && apt-get install -y --no-install-recommends \
    default-libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制 pip 已安装的包
COPY --from=backend-builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# 复制后端代码
COPY backend/ .

# 复制前端构建产物到 static_dist（由 FastAPI StaticFiles 托管）
COPY --from=frontend-builder /build/dist /app/static_dist
ENV STATIC_DIST_DIR=/app/static_dist

# 复制前端配置（init_db.py 需要读取 frontend/src/game/config 与 assets）
COPY frontend/src/game/config /app/../frontend/src/game/config
COPY frontend/public/assets/characters /app/../frontend/public/assets/characters

EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health', timeout=5)" || exit 1

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
