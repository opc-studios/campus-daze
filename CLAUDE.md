# Campus Daze (学术喵的奇幻之旅)

## 项目概述

回合制 RPG 游戏，前端使用 Vue 3 + Pinia，后端使用 Django REST Framework + FastAPI WebSocket。

## 项目结构

```
campus-daze/
├── frontend/                 # Vue 3 前端
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── modules/          # 业务模块
│   │   │   ├── users/        # 用户模块
│   │   │   │   └── views/
│   │   │   │       ├── LoginPage.vue
│   │   │   │       ├── RegisterPage.vue
│   │   │   │       └── UserCenter.vue
│   │   │   ├── characters/   # 角色模块
│   │   │   │   └── views/
│   │   │   │       └── CreateCharacter.vue
│   │   │   ├── maps/         # 地图模块
│   │   │   │   └── views/
│   │   │   │       ├── MapPage.vue
│   │   │   │       └── ExplorePage.vue
│   │   │   ├── gameplay/     # 游戏玩法模块
│   │   │   │   └── views/
│   │   │   │       ├── BattlePage.vue
│   │   │   │       ├── TasksPage.vue
│   │   │   │       ├── RewardsPage.vue
│   │   │   │       └── RestPage.vue
│   │   │   ├── dialogue/     # 对话模块
│   │   │   │   └── views/
│   │   │   │       └── DialoguePage.vue
│   │   │   ├── chapters/     # 章节模块
│   │   │   │   └── views/
│   │   │   │       └── ChaptersPage.vue
│   │   │   ├── stages/       # 关卡模块
│   │   │   │   └── views/
│   │   │   │       └── StagesPage.vue
│   │   │   └── saves/        # 存档模块
│   │   │       └── views/
│   │   │           └── SavesPage.vue
│   │   ├── stores/           # Pinia 状态管理
│   │   │   ├── user.js       # 用户状态
│   │   │   ├── character.js  # 角色状态
│   │   │   └── game.js       # 游戏状态
│   │   ├── api/              # API 客户端
│   │   │   └── index.js      # Axios 配置
│   │   ├── router/           # 路由配置
│   │   │   └── index.js      # Vue Router 配置
│   │   ├── assets/           # 静态资源
│   │   │   ├── sprites/      # 精灵图
│   │   │   ├── tiles/        # 地图瓦片
│   │   │   └── sounds/       # 音效
│   │   ├── App.vue           # 根组件
│   │   └── main.js           # 入口文件
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── core/                 # Django 项目配置
│   │   ├── settings/
│   │   │   └── base.py       # 基础配置
│   │   ├── urls.py           # 主路由
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── modules/              # 业务模块（Django Apps）
│   │   ├── users/            # 用户模块
│   │   │   ├── models.py     # User, Role, Permission
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── characters/       # 角色模块
│   │   │   ├── models.py     # Character, Equipment, Skill
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── maps/             # 地图模块
│   │   │   ├── models.py     # Area, MapTile, MapObject
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── chapters/         # 章节模块
│   │   │   ├── models.py     # Chapter, Scene, ChapterProgress
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── gameplay/         # 游戏玩法模块
│   │   │   ├── models.py     # Battle, Task, Reward, RestRecord
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── dialogue/         # 对话模块
│   │   │   ├── models.py     # NPC, Dialogue, NPCAffinity
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── stages/           # 关卡模块
│   │   │   ├── models.py     # Stage, Enemy, StageProgress
│   │   │   ├── views.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   └── saves/            # 存档模块
│   │       ├── models.py     # SaveSlot, SaveData
│   │       ├── views.py
│   │       ├── serializers.py
│   │       └── urls.py
│   ├── common/               # 公共工具模块
│   │   ├── auth/             # 认证工具
│   │   │   └── jwt_handler.py
│   │   └── database/         # 数据库工具
│   │       └── fallback.py
│   ├── api/                  # FastAPI 应用（WebSocket）
│   │   ├── main.py           # FastAPI 入口
│   │   ├── config.py         # 配置
│   │   └── routers/          # WebSocket 路由
│   │       ├── battle_ws.py  # 战斗 WebSocket
│   │       └── chat_ws.py    # 聊天 WebSocket
│   ├── manage.py             # Django 管理脚本
│   └── requirements/         # 依赖配置
│       └── base.txt
├── deploy/                   # 部署配置
│   ├── deploy.sh
│   ├── nginx.conf
│   ├── start.bat
│   ├── stop.bat
│   └── supervisord.conf
├── doc/                      # 文档
│   ├── PRD.md
│   └── TECHNICAL_ARCHITECTURE.md
├── .gitignore
├── LICENSE
└── README.md
```

## 常用命令

### 启动项目（推荐使用脚本）

**Windows：**
```bash
# 启动项目（自动初始化数据库、启动后端和前端）
deploy\start.bat

# 停止项目
deploy\stop.bat
```

**Linux/macOS：**
```bash
# 启动项目（自动初始化数据库、启动后端）
bash deploy/start.sh

# 停止项目
bash deploy/stop.sh
```

### 手动启动（开发调试用）

**前端：**
```bash
cd frontend
npm install
npm run dev      # 启动开发服务器 (http://localhost:3000)
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

**后端：**
```bash
cd backend
pip install -r requirements/base.txt
python manage.py runserver 0.0.0.0:8000  # Django 开发服务器
```

### 数据库（脚本已自动处理）

```bash
cd backend
python manage.py makemigrations  # 生成迁移文件
python manage.py migrate         # 执行迁移
python manage.py createsuperuser # 创建超级用户
```

## 测试用户

默认测试账号：
- 用户名：test123
- 密码：123456

## 技术栈

### 前端
- Vue 3.4
- Pinia 2.1
- Vue Router 4.2
- Axios 1.6
- Tailwind CSS 3.4
- PostCSS 8.4
- Vite 5.0
- @vitejs/plugin-vue 5.0
- Phaser 3.80 (游戏引擎)
- Three.js 0.170

### 后端
- Django 5.0
- Django REST Framework 3.14
- FastAPI 0.110
- Uvicorn 0.28
- Pydantic 2.5
- Pydantic Settings 2.1
- WebSockets 12.0
- PyMySQL 1.1
- Python JOSE 3.3 (JWT)
- Passlib 1.7 (密码哈希)
- Python Multipart 0.0.6
- Aiofiles 23.2.1

## 环境配置

在 `backend/.env` 文件中配置以下环境变量：

```env
# JWT 配置
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# 数据库配置
DB_USER=root
DB_PASSWORD=your-db-password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=campus_daze

# 前端 URL
FRONTEND_URL=http://localhost:3000
```

## 代码规范

### 前端 (Vue 3)
- 使用 Composition API 和 `<script setup>` 语法
- 使用 Pinia 进行状态管理
- 组件使用 `.vue` 扩展名
- 使用 async/await 处理异步操作
- 使用 api 实例进行 API 调用

### 后端 (Python)
- Django: 使用 DRF Serializers 和 Class-Based Views
- FastAPI: 用于 WebSocket 实时通信
- 遵循 PEP 8 代码风格
- 使用类型注解

### API 设计
- RESTful 风格
- 认证使用 JWT (Bearer Token)
- Token 刷新机制在前端 api/index.js 中实现
- WebSocket 用于实时战斗和聊天

### 状态管理 (Pinia)
- user.js: 认证状态 (accessToken, refreshToken, user)
- character.js: 角色数据
- game.js: 游戏状态 (当前区域、任务进度等)

## 核心功能模块

### 认证系统 (auth)
- 注册 POST /api/auth/register
- 登录 POST /api/auth/login
- Token 刷新 POST /api/auth/refresh
- 获取用户信息 GET /api/auth/me

### 角色系统 (characters)
- 创建角色 POST /api/characters
- 获取所有角色 GET /api/characters
- 获取角色详情 GET /api/characters/{id}
- 更新角色 PUT /api/characters/{id}
- 更新装备 PUT /api/characters/{id}/equipment
- 角色变形 POST /api/characters/{id}/transform

### 战斗系统 (gameplay)
- 开始战斗 POST /api/gameplay/battle/start
- 攻击 POST /api/gameplay/battle/{id}/attack
- 使用技能 POST /api/gameplay/battle/{id}/skill
- 获取战斗结果 GET /api/gameplay/battle/{id}/result
- WebSocket: /ws/battle/{battleId}

### 任务系统 (gameplay)
- 获取任务列表 GET /api/gameplay/tasks
- 获取任务详情 GET /api/gameplay/tasks/{id}
- 接受任务 POST /api/gameplay/tasks/{id}/accept
- 更新进度 PUT /api/gameplay/tasks/{id}/progress
- 完成任务 POST /api/gameplay/tasks/{id}/complete

### 地图系统 (maps)
- 获取区域列表 GET /api/maps/areas
- 获取区域详情 GET /api/maps/areas/{id}
- 探索区域 POST /api/maps/areas/{id}/explore

### NPC 系统 (dialogue)
- 获取 NPC 列表 GET /api/dialogue/npcs
- 获取对话 GET /api/dialogue/npcs/{id}/dialogue
- 响应对话 POST /api/dialogue/npcs/{id}/respond

### 奖励系统 (gameplay)
- 获取奖励列表 GET /api/gameplay/rewards
- 领取奖励 POST /api/gameplay/rewards/{id}/claim
- 获取成就 GET /api/gameplay/achievements

### 休息系统 (gameplay)
- 开始休息 POST /api/gameplay/rest/start
- 结束休息 POST /api/gameplay/rest/end
- 获取离线收益 GET /api/gameplay/rest/offline

## 配置说明

### API 代理 (vite.config.js)
- /api 代理到 http://localhost:8000
- /ws 代理到 ws://localhost:8000 (WebSocket)

### 认证 Token 处理 (api/index.js)
- accessToken 存储在 localStorage
- refreshToken 存储在 localStorage
- 401 响应自动清除 token 并重定向到登录页

## 注意事项

1. 前端开发服务器运行在端口 3000，后端 Django 运行在端口 8000
2. Vite proxy 配置确保开发时 API 请求正确转发
3. Django 处理所有 REST API 和数据库操作，FastAPI 仅处理 WebSocket
4. WebSocket 连接用于实时战斗和聊天功能
5. 所有敏感配置信息应存储在 backend/.env 文件中，不要提交到版本控制
