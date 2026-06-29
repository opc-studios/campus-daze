# Campus Daze (学术喵的奇幻之旅)

## 项目概述

回合制 RPG 游戏，前端使用 React + Redux，后端使用 FastAPI + Django REST Framework。

## 项目结构

```
campus-daze/
├── frontend/                 # React 前端
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/      # React 组件
│   │   │   ├── BattlePage.jsx
│   │   │   ├── CharacterPage.jsx
│   │   │   ├── CreateCharacterPage.jsx
│   │   │   ├── ExplorePage.jsx
│   │   │   ├── ForgotPasswordPage.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PlazaPage.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── PublicRoute.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── RestPage.jsx
│   │   │   ├── RewardsPage.jsx
│   │   │   └── TasksPage.jsx
│   │   ├── redux/          # Redux 状态管理
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.js
│   │   │   │   ├── characterSlice.js
│   │   │   │   └── gameSlice.js
│   │   │   └── store.js
│   │   ├── services/
│   │   │   └── api.js      # API 客户端配置
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── query/
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── api/                 # FastAPI 应用
│   │   ├── routers/        # API 路由
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── battle.py
│   │   │   ├── character.py
│   │   │   ├── map.py
│   │   │   ├── npc.py
│   │   │   ├── rest.py
│   │   │   ├── reward.py
│   │   │   └── task.py
│   │   ├── schemas/        # Pydantic 模型
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── battle.py
│   │   │   ├── character.py
│   │   │   ├── npc.py
│   │   │   └── task.py
│   │   ├── utils/           # 工具函数
│   │   │   ├── auth.py
│   │   │   ├── database.py
│   │   │   └── email.py
│   │   ├── websocket/       # WebSocket 处理器
│   │   │   ├── battle.py
│   │   │   └── chat.py
│   │   └── main.py          # FastAPI 入口
│   ├── django/              # Django REST 应用
│   │   ├── areas/           # 区域应用
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   ├── campus_daze/     # Django 项目配置
│   │   │   ├── asgi.py
│   │   │   ├── settings.py
│   │   │   ├── urls.py
│   │   │   └── wsgi.py
│   │   ├── characters/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── serializers.py
│   │   │   └── urls.py
│   │   ├── enemies/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   ├── npcs/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   ├── rest/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   ├── rewards/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   ├── tasks/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   └── urls.py
│   │   └── users/
│   │       ├── __init__.py
│   │       ├── models.py
│   │       ├── serializers.py
│   │       └── urls.py
│   ├── create_database.py
│   ├── create_password_reset_table.py
│   ├── import_sql.py
│   ├── init.sql
│   ├── requirements.txt
│   ├── test_api.py
│   └── .env               # 环境变量配置
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
│   ├── TECHNICAL_ARCHITECTURE.md
│   └── 学术喵的奇幻之旅.pdf
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
# 启动项目（自动初始化数据库、启动后端和Redis）
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
pip install -r requirements.txt
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000  # FastAPI 开发服务器
```

### 数据库（脚本已自动处理）

```bash
cd backend
python create_database.py           # 创建数据库
python create_password_reset_table.py  # 创建密码重置表
python init.sql                     # 初始化数据库
python import_sql.py                # 导入 SQL 数据
```

## 测试用户

默认测试账号：
- 用户名：test123
- 密码：123456

## 技术栈

### 前端
- React 18.2
- React-Redux 9.0
- Redux Toolkit 2.0
- React Router DOM 6.20
- Axios 1.6
- Tailwind CSS 3.4
- PostCSS 8.4
- Vite 5.0
- @vitejs/plugin-react 4.2
- Phaser 3.80 (游戏引擎)
- jQuery 3.7

### 后端
- FastAPI 0.110
- Uvicorn 0.28
- Django 5.0
- Django REST Framework 3.14
- SQLAlchemy 2.0
- Pydantic 2.5
- Pydantic Settings 2.1
- Redis 5.0
- WebSockets 12.0
- PyMySQL 1.1
- Python JOSE 3.3 (JWT)
- Passlib 1.7 (密码哈希)
- Email Validator 2.0
- Python Multipart 0.0.6
- Python Dotenv 1.0
- Aiofiles 23.2.1

## 环境配置

在 `backend/.env` 文件中配置以下环境变量：

```env
# JWT 配置
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# 数据库配置
DB_USER=root
DB_PASSWORD=your-db-password
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=campus_daze

# 邮件服务配置 (SMTP)
SMTP_SERVER=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-smtp-authorization-code
SMTP_FROM_EMAIL=your-email@example.com

# 前端 URL
FRONTEND_URL=http://localhost:3000
```

## 代码规范

### 前端 (JavaScript/JSX)
- 使用 React Hooks (useState, useEffect, useCallback, useMemo)
- 使用 Redux Toolkit 进行状态管理
- 组件使用 .jsx 扩展名
- 使用 async/await 处理异步操作
- 使用 axiosInstance 进行 API 调用

### 后端 (Python)
- FastAPI: 使用 Pydantic 模型进行请求/响应验证
- Django: 使用 DRF Serializers
- 遵循 PEP 8 代码风格
- 使用类型注解

### API 设计
- RESTful 风格
- 认证使用 JWT (Bearer Token)
- Token 刷新机制在 api.js 中实现
- WebSocket 用于实时战斗和聊天

### 状态管理 (Redux)
- authSlice: 认证状态 (accessToken, refreshToken, user)
- characterSlice: 角色数据
- gameSlice: 游戏状态 (当前区域、任务进度等)

## 核心功能模块

### 认证系统 (auth)
- 注册 POST /auth/register
- 登录 POST /auth/login
- Token 刷新 POST /auth/refresh
- 获取用户信息 GET /auth/me
- 忘记密码 POST /auth/forgot-password
- 重置密码 POST /auth/reset-password

### 角色系统 (characters)
- 创建角色 POST /characters
- 获取所有角色 GET /characters
- 获取角色详情 GET /characters/{id}
- 更新角色 PUT /characters/{id}
- 更新装备 PUT /characters/{id}/equipment
- 角色变形 POST /characters/{id}/transform

### 战斗系统 (battle)
- 开始战斗 POST /battle/start
- 攻击 POST /battle/{battleId}/attack
- 使用技能 POST /battle/{battleId}/skill
- 获取战斗结果 GET /battle/{battleId}/result
- WebSocket: /ws/battle/{battleId}

### 任务系统 (tasks)
- 获取任务列表 GET /tasks
- 获取任务详情 GET /tasks/{id}
- 接受任务 POST /tasks/{id}/accept
- 更新进度 PUT /tasks/{id}/progress
- 完成任务 POST /tasks/{id}/complete

### 地图系统 (map)
- 获取区域列表 GET /map/areas
- 获取区域详情 GET /map/areas/{id}
- 探索区域 POST /map/areas/{id}/explore

### NPC 系统 (npc)
- 获取 NPC 列表 GET /npc
- 获取对话 GET /npc/{id}/dialogue
- 响应对话 POST /npc/{id}/respond

### 奖励系统 (reward)
- 获取奖励列表 GET /rewards
- 领取奖励 POST /rewards/{id}/claim
- 获取成就 GET /rewards/achievements

### 休息系统 (rest)
- 开始休息 POST /rest/start
- 结束休息 POST /rest/end
- 获取离线收益 GET /rest/offline

## 配置说明

### API 代理 (vite.config.js)
- /api 代理到 http://localhost:8000
- /ws 代理到 ws://localhost:8000 (WebSocket)
- historyApiFallback 配置支持 React Router 单页应用路由

### 认证 Token 处理 (api.js)
- accessToken 存储在 localStorage
- refreshToken 存储在 localStorage
- 401 响应自动尝试刷新 token
- 刷新失败则清除 token 并重定向到首页

### 邮件服务配置
- 使用 SMTP 服务发送邮件
- 支持欢迎邮件和密码重置邮件
- 需要在 .env 文件中配置 SMTP 相关参数

## 注意事项

1. 前端开发服务器运行在端口 3000，后端 FastAPI 运行在端口 8000
2. Vite proxy 配置确保开发时 API 请求正确转发
3. maxRedirects: 0 防止 axios 自动重定向
4. Django 主要处理数据库模型的 CRUD，FastAPI 处理业务逻辑和 WebSocket
5. WebSocket 连接用于实时战斗和聊天功能
6. 密码重置功能需要配置 SMTP 服务
7. 所有敏感配置信息应存储在 backend/.env 文件中，不要提交到版本控制