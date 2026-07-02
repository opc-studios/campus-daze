# Campus Daze (学术喵的奇幻之旅)

## 项目概述

2D 像素风回合制网页 RPG 游戏——"樱花同济篇 · 出科考试"。

- 前端：Vue 3 + Vite 5 + Phaser 3 + Tailwind CSS 3.4 + Pinia + Vue Router
- 后端：FastAPI + SQLAlchemy 2.0（异步） + MySQL 8.x
- 5 位主角（莉娜/阿宇/知夏/江寻/老登）× 4 种职业（学霸/学渣/卷王/课代表）
- 角色立绘存于数据库 `game_images` 表（MEDIUMBLOB）

## 项目结构

```
campus-daze/
├── frontend/                 # Vue 3 + Vite 前端
│   ├── public/
│   │   ├── assets/
│   │   │   └── characters/  # 6 张角色立绘源文件
│   │   │       ├── lina_portrait.png
│   │   │       ├── ayu_portrait.png
│   │   │       ├── zhixia_portrait.png
│   │   │       ├── jiangxun_portrait.png
│   │   │       ├── laodeng_portrait.png
│   │   │       └── professor_lu_portrait.jpg
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   │   ├── auth.ts      # 认证接口
│   │   │   ├── character.ts # 角色接口
│   │   │   ├── client.ts    # axios 实例 + JWT 拦截器
│   │   │   └── image.ts     # 角色图加载
│   │   ├── game/            # Phaser 游戏层
│   │   │   ├── Game.ts      # Phaser 配置入口
│   │   │   └── scenes/
│   │   │       ├── BootScene.ts       # 引导
│   │   │       ├── PreloaderScene.ts  # 资源预加载 + 立绘加载
│   │   │       ├── WorldScene.ts      # 世界探索（tilemap + 移动 + NPC + 战斗触发）
│   │   │       ├── BattleScene.ts     # 回合制战斗
│   │   │       ├── DialogueScene.ts   # 对话（打字机效果）
│   │   │       └── UIScene.ts         # 持久化 HUD
│   │   ├── router/
│   │   │   └── index.ts     # 路由 + 守卫
│   │   ├── stores/          # Pinia
│   │   │   ├── auth.ts      # 认证状态
│   │   │   └── game.ts      # 5主角/4职业元数据 + 当前角色
│   │   ├── views/
│   │   │   ├── LoginView.vue       # 登录（用户名 + 密码）
│   │   │   ├── RegisterView.vue    # 注册（用户名 + 邮箱可选）
│   │   │   ├── CharSelectView.vue  # 角色选择（立绘展示）
│   │   │   └── GameView.vue        # 游戏容器（Phaser 挂载点）
│   │   ├── App.vue
│   │   ├── main.ts
│   │   ├── index.css        # Tailwind + 全局样式
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts       # Vite 配置 + API/WS 代理
│   ├── tailwind.config.js   # 主题色：樱花粉/校园蓝/学术紫
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── .env
├── backend/                  # FastAPI 单体后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 入口
│   │   ├── config.py        # Pydantic Settings
│   │   ├── db.py            # SQLAlchemy 引擎 + 会话
│   │   ├── models.py        # ORM 模型（含 game_images 表）
│   │   ├── schemas.py       # Pydantic 请求/响应模型
│   │   ├── security.py      # JWT + bcrypt
│   │   ├── deps.py          # 依赖注入（get_current_user）
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── auth.py      # 注册/登录/刷新/me
│   │       ├── professions.py # 4 种职业
│   │       ├── characters.py  # 角色 CRUD
│   │       ├── images.py    # 角色立绘读取
│   │       └── system.py    # 健康检查
│   ├── init_db.py           # 建表 + 4职业 + 6张立绘导入
│   ├── requirements.txt
│   └── .env.example
├── deploy/                   # 部署配置
│   ├── deploy.sh
│   ├── nginx.conf
│   ├── start.bat
│   ├── start.sh
│   ├── stop.bat
│   ├── stop.sh
│   └── supervisord.conf
├── doc/                      # 文档
│   ├── PRD.md
│   ├── 学术喵_技术设计与开发方案.md
│   └── 学术喵的奇幻之旅.pdf
├── _char_backup/             # 角色图备份（可删除）
├── .gitignore
├── CLAUDE.md
├── LICENSE
└── README.md
```

## 常用命令

### 启动开发环境

**后端（FastAPI）：**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
copy .env.example .env         # Windows，编辑 .env 填入 MySQL 密码
python init_db.py              # 初始化数据库（建表 + 职业数据 + 角色立绘）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端（Vue 3 + Vite）：**
```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

### 一键启动脚本

**Windows：** `deploy\start.bat`
**Linux/macOS：** `bash deploy/start.sh`

### 停止

**Windows：** `deploy\stop.bat`
**Linux/macOS：** `bash deploy/stop.sh`

## 测试用户

注册流程：用户名 + 密码 → 创建角色 → 进入游戏（邮箱可选）

## 技术栈

### 前端
- Vue 3.4 + Vite 5.2
- Phaser 3.80（2D 像素 RPG 引擎）
- Pinia 2.1（状态管理）
- Vue Router 4.3
- Axios 1.7
- Tailwind CSS 3.4 + PostCSS
- TypeScript 5.4
- Socket.IO Client 4.7（P1 阶段多人在线）

### 后端
- FastAPI 0.110
- Uvicorn 0.28
- SQLAlchemy 2.0（异步 ORM）
- aiomysql 0.2 / PyMySQL 1.1
- Pydantic 2.5 + Pydantic Settings 2.1
- Python JOSE 3.3（JWT）
- bcrypt 4.1.2（密码哈希）
- MySQL 8.x
- Redis 5.0（P1 阶段：会话/排行榜）
- WebSockets 12.0（P1 阶段：实时战斗/聊天）

## 环境配置

### 前端 `frontend/.env`
```env
VITE_API_BASE=/api/v1
VITE_WS_BASE=/ws
```

### 后端 `backend/.env`（从 `.env.example` 复制后修改）
```env
SECRET_KEY=your-secret-key
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=campus_daze
CORS_ORIGINS=["http://localhost:3000"]
CHARACTERS_ASSET_DIR=../frontend/public/assets/characters
```

## 代码规范

### 前端 (TypeScript/Vue)
- 组件使用 `.vue` 扩展名，`<script setup lang="ts">`
- Pinia stores 使用组合式 API（setup 风格）
- 路径别名：`@/`、`@game/`、`@api/`、`@stores/`、`@views/`、`@components/`
- Phaser 场景继承 `Phaser.Scene`，参考 labs.phaser.io 样例模式
- 使用 axiosInstance 进行 API 调用，401 自动刷新 token

### 后端 (Python)
- FastAPI：使用 Pydantic 模型进行请求/响应验证
- SQLAlchemy 2.0：使用 `Mapped` + `mapped_column` 类型注解风格
- 全部异步：`async def` + `AsyncSession`
- 遵循 PEP 8

### API 设计
- RESTful 风格
- 统一前缀 `/api/v1`
- 认证使用 JWT（Bearer Token）
- 角色图通过 `GET /api/v1/images/{entity_type}/{entity_key}?type=portrait` 读取

## 核心功能模块

### 认证系统 (`/api/v1/auth`)
- 注册 `POST /auth/register`（用户名 + 密码，邮箱可选）
- 登录 `POST /auth/login`（用户名 + 密码）
- 刷新 token `POST /auth/refresh`
- 获取用户信息 `GET /auth/me`

### 职业系统 (`/api/v1/professions`)
- 获取职业列表 `GET /professions`

### 角色系统 (`/api/v1/characters`)
- 创建角色 `POST /characters`
- 获取所有角色 `GET /characters`
- 获取角色详情 `GET /characters/{id}`

### 游戏图片系统 (`/api/v1/images`)
- 获取图片 `GET /images/{entity_type}/{entity_key}?type=portrait`
- 6 张图片：5 位主角立绘 + 陆教授 Boss 立绘

### 健康检查
- `GET /api/v1/health`

## 配置说明

### API 代理 (`vite.config.ts`)
- `/api` 代理到 `http://127.0.0.1:8000`
- `/ws` 代理到 `ws://127.0.0.1:8000`
- `/socket.io` 代理到 `http://127.0.0.1:8000`

### 认证 Token 处理 (`src/api/client.ts`)
- accessToken 与 refreshToken 存于 localStorage
- 401 自动尝试刷新 token（单飞机制，避免并发刷新）
- 刷新失败则登出并跳转登录页

### 角色图加载流程
1. `init_db.py` 把 `frontend/public/assets/characters/` 下 6 张图片写入 `game_images.image_data`（MEDIUMBLOB）
2. 前端 `getImageUrl('protagonist', 'lina', 'portrait')` 构造请求 URL
3. Phaser `PreloaderScene` 通过 `this.load.image(key, url)` 加载到纹理缓存
4. `WorldScene` / `BattleScene` 通过 `this.add.image(...)` 展示立绘

## 注意事项

1. 前端开发服务器运行在端口 3000，后端 FastAPI 运行在端口 8000
2. Vite proxy 配置确保开发时 API 请求正确转发
3. 后端统一使用 FastAPI，已移除 Django
4. 数据库使用 MySQL 8.x，字符集 utf8mb4
5. 角色立绘存于数据库（MEDIUMBLOB，最大 16MB）
6. 密码重置功能需要配置 SMTP 服务
7. 所有敏感配置信息应存储在 `backend/.env` 文件中，不要提交到版本控制
8. WebSocket/Socket.IO 在 P1 阶段启用（多人在线同屏）
