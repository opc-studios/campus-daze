# 同舟喵济 - 部署脚本

> 本目录提供同舟喵济游戏项目的部署脚本，支持两种方式：
>
> 1. **本地直接部署**（推荐，无需 Docker）
> 2. **Docker 容器部署**（备选，需安装 Docker Desktop）

## 目录结构

```
deploy/
├── README.md                          # 本文件
├── lib/
│   └── common.psm1                    # PowerShell 共享函数库
├── local/                             # 本地直接部署（推荐）
│   ├── start.ps1                      # 一键启动（生产模式）
│   ├── start-dev.ps1                  # （通过 -Dev 参数实现）
│   ├── start-backend.ps1              # 单独启动后端
│   ├── start-frontend.ps1             # 单独启动前端
│   ├── stop.ps1                       # 停止所有服务
│   ├── restart.ps1                    # 重启服务
│   ├── status.ps1                     # 查看运行状态
│   ├── build-frontend.ps1             # 构建前端 dist
│   ├── init-db.ps1                    # 初始化数据库
│   ├── run-tests.ps1                  # 运行单元测试
│   └── logs/                          # 日志目录（运行时自动创建）
└── docker/                            # Docker 容器部署（备选）
    ├── deploy.ps1                     # Docker 一键部署脚本
    ├── docker-compose.prod.yml        # 生产 compose 文件
    ├── .env.docker.example            # 环境变量模板
```

> **架构说明**：项目**不引入 Nginx**。生产部署采用 FastAPI `StaticFiles` 一体化方案——后端单进程同时托管前端 `dist/` 静态资源、REST API 与 WebSocket。`backend/Dockerfile` 为多阶段构建（Node 构建前端 + Python 运行后端），无需独立前端容器。

## 一、本地直接部署（推荐）

### 适用场景

- Windows 10/11 开发环境
- 已安装 Python 3.12+、Node.js 20+、MySQL 8.x
- 不希望使用 Docker

### 快速开始

```powershell
# 1. 初始化数据库（首次运行，建表 + 13 张图片入库）
cd deploy\local
.\init-db.ps1

# 2. 一键启动（生产模式：前端 vite build + 后端 uvicorn）
.\start.ps1

# 3. 启动后自动打开浏览器
.\start.ps1 -Open

# 4. 查看运行状态
.\status.ps1

# 5. 停止服务
.\stop.ps1
```

### 开发模式

开发模式使用 `uvicorn --reload` + `vite dev`（热更新）：

```powershell
.\start.ps1 -Dev
```

### 详细命令

| 命令 | 说明 | 参数 |
|------|------|------|
| `.\start.ps1` | 一键启动 | `-Dev` 开发模式<br>`-Open` 启动后打开浏览器 |
| `.\stop.ps1` | 停止所有服务 | - |
| `.\restart.ps1` | 重启服务 | `-Dev` 开发模式 |
| `.\status.ps1` | 查看运行状态 | - |
| `.\start-backend.ps1` | 单独启动后端 | `-Dev` 开发模式 |
| `.\start-frontend.ps1` | 单独启动前端 | `-Dev` 开发模式 |
| `.\build-frontend.ps1` | 构建前端 dist | `-Clean` 清理后重建 |
| `.\init-db.ps1` | 初始化数据库 | `-Force` 强制重新初始化 |
| `.\run-tests.ps1` | 运行单元测试 | `-Frontend`/`-Backend`/`-All` |

### 默认端口

| 服务 | 端口 |
|------|------|
| 前端 | http://localhost:5173 |
| 后端 | http://localhost:8000 |
| MySQL | 127.0.0.1:3306 |

### 日志

日志文件保存在 `deploy/local/logs/`：
- `backend.log` / `backend.log.err` - 后端日志
- `frontend.log` / `frontend.log.err` - 前端日志
- `backend.pid` / `frontend.pid` - 进程 PID 文件

实时查看日志：
```powershell
Get-Content -Wait deploy\local\logs\backend.log
Get-Content -Wait deploy\local\logs\frontend.log
```

### 配置文件

#### 后端 `backend/.env`

从 `backend/.env.example` 复制，需修改：
- `DATABASE_URL` - MySQL 连接串（用户名/密码/数据库名）
- `JWT_SECRET_KEY` - JWT 密钥（生产环境必须修改）
- `CORS_ORIGINS` - 跨域允许的源

#### 前端 `frontend/.env`

```env
VITE_API_BASE=/api/v1
VITE_WS_BASE=/ws
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

## 二、Docker 容器部署（备选）

### 适用场景

- 已安装 Docker Desktop
- 希望一键部署完整环境（含 MySQL）
- 跨平台部署

### 快速开始

```powershell
cd deploy\docker

# 1. 复制环境变量模板并修改
copy .env.docker.example .env
notepad .env   # 修改密码/密钥

# 2. 一键部署（构建 + 启动 + 初始化数据库）
.\deploy.ps1

# 3. 查看状态
.\deploy.ps1 -Status

# 4. 查看日志
.\deploy.ps1 -Logs

# 5. 停止
.\deploy.ps1 -Down
```

### 详细命令

| 命令 | 说明 |
|------|------|
| `.\deploy.ps1` | 构建并启动（默认） |
| `.\deploy.ps1 -Build` | 仅构建镜像 |
| `.\deploy.ps1 -Up` | 构建并启动 |
| `.\deploy.ps1 -Down` | 停止并移除容器 |
| `.\deploy.ps1 -Status` | 查看容器状态 |
| `.\deploy.ps1 -Logs` | 查看日志（实时） |
| `.\deploy.ps1 -InitDb` | 重新初始化数据库 |

### Docker 服务架构

```
┌─────────────────────────────────────────────┐
│  Host Machine (Windows)                     │
│                                              │
│  ┌──────────────────────┐    ┌────────┐     │
│  │ backend              │───▶│ mysql  │     │
│  │ uvicorn + StaticFiles│    │  3306  │     │
│  │ :8000                │    └────────┘     │
│  │  (前端 + API + WS)   │                   │
│  └──────────────────────┘                   │
│       │                                      │
│       └── http://localhost:8000             │
└─────────────────────────────────────────────┘
```

### 端口映射

| 容器服务 | 容器端口 | 宿主机端口 |
|----------|----------|------------|
| backend (uvicorn + StaticFiles) | 8000 | 8000 (WEB_PORT) |
| mysql | 3306 | 3306 (MYSQL_PORT) |

### 数据卷

- `mysql_data` - MySQL 数据持久化

### 环境变量

详见 `.env.docker.example`：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `MYSQL_ROOT_PASSWORD` | change-this-root-password | MySQL root 密码 |
| `MYSQL_DATABASE` | tongzhou_meow | 数据库名 |
| `MYSQL_USER` | appuser | 应用用户 |
| `MYSQL_PASSWORD` | change-this-app-password | 应用密码 |
| `MYSQL_PORT` | 3306 | MySQL 宿主机端口 |
| `JWT_SECRET_KEY` | change-this-jwt-secret-key | JWT 密钥 |
| `WEB_PORT` | 80 | 前端宿主机端口 |

---

## 三、运维操作

### 备份数据库

```powershell
# 本地部署
mysqldump -u root -p tongzhou_meow > backup_$(Get-Date -Format 'yyyyMMdd').sql

# Docker 部署
docker exec campus_daze_mysql mysqldump -u root -p<password> tongzhou_meow > backup_$(Get-Date -Format 'yyyyMMdd').sql
```

### 恢复数据库

```powershell
# 本地部署
mysql -u root -p tongzhou_meow < backup_20260703.sql

# Docker 部署
docker exec -i campus_daze_mysql mysql -u root -p<password> tongzhou_meow < backup_20260703.sql
```

### 查看应用日志

```powershell
# 本地部署
Get-Content -Wait deploy\local\logs\backend.log
Get-Content -Wait deploy\local\logs\frontend.log

# Docker 部署
cd deploy\docker
.\deploy.ps1 -Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### 升级应用

```powershell
# 本地部署
cd deploy\local
.\stop.ps1
git pull origin main
.\build-frontend.ps1 -Clean   # 重新构建前端
.\start.ps1

# Docker 部署
cd deploy\docker
.\deploy.ps1 -Down
git pull origin main
.\deploy.ps1 -Build
.\deploy.ps1 -Up
```

---

## 四、故障排查

### 后端无法启动

1. 检查 MySQL 是否运行：`.\status.ps1`
2. 检查端口 8000 是否被占用：`netstat -ano | findstr :8000`
3. 查看后端日志：`Get-Content deploy\local\logs\backend.log.err`
4. 检查 `backend/.env` 配置是否正确

### 前端无法访问

1. 检查前端服务是否运行：`.\status.ps1`
2. 检查端口 5173 是否被占用
3. 查看前端日志：`Get-Content deploy\local\logs\frontend.log.err`
4. 确认 `frontend/.env` 中 API 地址正确

### 数据库连接失败

1. 确认 MySQL 服务运行中
2. 检查 `backend/.env` 中 `DATABASE_URL` 配置
3. 测试连接：`python -c "import pymysql; pymysql.connect(host='127.0.0.1', port=3306, user='root', password='123456', database='tongzhou_meow')"`
4. 必要时重新初始化：`.\init-db.ps1 -Force`

### 端口冲突

修改以下文件中的端口：
- `deploy/lib/common.psm1` 中的 `$BACKEND_PORT` 和 `$FRONTEND_PORT`
- `frontend/vite.config.ts` 中的 `port`
- `backend/app/main.py` 中的 `port`（如直接运行 python）

---

## 五、生产部署建议

1. **修改默认密码**：MySQL root 密码、JWT 密钥必须修改
2. **启用 HTTPS**：Uvicorn `--ssl-keyfile/--ssl-certfile` 直接终止 TLS（单人低并发无需 Nginx）
3. **限制 CORS**：将 `CORS_ORIGINS` 限制为实际域名
4. **日志轮转**：配置 logrotate 或 PowerShell 脚本定期清理日志
5. **数据库备份**：设置定时任务每日备份
6. **进程守护**：使用 Windows 服务或 NSSM 将 uvicorn 注册为系统服务
7. **资源监控**：监控 CPU/内存/磁盘使用情况
