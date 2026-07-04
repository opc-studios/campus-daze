# 同舟喵济 (Tongzhou Meow)

## 项目概述

2D 像素风回合制网页 RPG 游戏——"同济校园冒险"。

- 前端：Vue 3 + Vite 5 + Phaser 3.80 + Pinia + Tailwind CSS（@tailwindcss/vite）+ Vue Router
- 后端：FastAPI + SQLAlchemy 2.0（异步） + MySQL 8.x + 原生 WebSocket
- 5 位主角（莉娜/阿宇/知夏/江寻/老登）× 5 战斗定位（召唤流/连击流/暴击流/穿透流/反震流）
- 5 章节（序章 + 第一章~终章），每章含地图节点/事件/解密/Boss
- 角色立绘存于数据库 `game_images` 表（MEDIUMBLOB ≤16MB）+ 前端静态目录双分发

## 项目结构

```
campus-daze/
├── frontend/                 # Vue 3 + Vite 前端
│   ├── public/
│   │   ├── assets/
│   │   │   ├── characters/  # 5 立绘（lina/ayu/zhixia/jiangxun/laodeng .png）
│   │   │   ├── sprites/     # 5 精灵图（同上命名，行走动画）
│   │   │   ├── maps/        # 3 Ch1 地图（ch1-tileset/ch1-props-atlas/ch1-zhonghe-plaza .png）
│   │   │   ├── effects/     # 1 特效（lina-projectiles.png）
│   │   │   ├── poster/      # 1 海报（gdd-cover.png）
│   │   │   └── videos/      # 1 视频（lina-animation.mp4）
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/             # API 客户端
│   │   │   ├── auth.ts      # 认证接口
│   │   │   ├── client.ts    # axios 实例 + JWT 拦截器（401 自动刷新）
│   │   │   ├── event.ts     # 随机事件接口
│   │   │   ├── image.ts     # 角色图 URL 构造
│   │   │   └── save.ts      # 存档接口
│   │   ├── components/      # 业务组件
│   │   │   ├── EventModal.vue
│   │   │   ├── IdlePanel.vue
│   │   │   ├── OfflineRewardPanel.vue
│   │   │   ├── PuzzleModal.vue
│   │   │   ├── RewardNotification.vue
│   │   │   └── ui/          # 基础控件（BaseButton/BaseModal/ProgressBar/ResourceBar）
│   │   ├── composables/     # 组合式函数
│   │   │   ├── useIdle.ts          # 挂机学习/实习
│   │   │   ├── useOfflineReward.ts # 离线收益
│   │   │   └── useWebSocket.ts     # 原生 WebSocket 连接
│   │   ├── game/            # Phaser 游戏层
│   │   │   ├── config.ts    # Phaser 配置入口（场景列表 + 物理引擎）
│   │   │   ├── scenes/
│   │   │   │   ├── BootScene.ts            # 引导 + JSON 配置注入 Phaser cache
│   │   │   │   ├── PreloaderScene.ts       # 资源预加载（立绘/精灵/地图/海报）
│   │   │   │   ├── MapExploreScene.ts      # 地图探索（节点移动 + 雾气 + 战斗触发）
│   │   │   │   └── CombatOverlayScene.ts   # 回合制战斗覆盖层
│   │   │   ├── systems/    # 游戏系统
│   │   │   │   ├── FormSwitchSystem.ts     # 人/猫双形态切换
│   │   │   │   ├── MapFogSystem.ts         # 地图雾气揭示
│   │   │   │   └── MonsterAISystem.ts      # 怪物 AI（alert/leash）
│   │   │   ├── combat/     # 战斗逻辑
│   │   │   │   ├── formulas.ts    # 伤害/命中公式
│   │   │   │   ├── simulator.ts   # 战斗模拟器
│   │   │   │   ├── skill-runner.ts # 技能执行器
│   │   │   │   └── types.ts       # 战斗类型定义
│   │   │   └── config/     # 9 个 JSON 配置（运行时注入）
│   │   │       ├── archives.json   # 校史图鉴
│   │   │       ├── chapters.json   # 5 章节
│   │   │       ├── events.json     # 16 随机事件
│   │   │       ├── items.json      # 道具
│   │   │       ├── map-nodes.json  # 地图节点（4 章节 × 9 节点）
│   │   │       ├── monsters.json   # 怪物（普通 + Boss）
│   │   │       ├── puzzles.json    # 解密
│   │   │       ├── roles.json      # 5 角色
│   │   │       └── skills.json     # 技能
│   │   ├── router/
│   │   │   └── index.ts     # 路由 + 守卫（/login /register /char-select /home /growth /inventory /archive /map）
│   │   ├── stores/          # Pinia
│   │   │   ├── user.ts      # 认证状态（token/user）
│   │   │   └── game.ts      # GameState + 5 角色元数据 + 当前角色
│   │   ├── types/
│   │   │   └── game.ts      # 游戏类型定义（FormType/RoleId/GameState 等）
│   │   ├── views/
│   │   │   ├── LoginView.vue       # 登录（用户名 + 密码）
│   │   │   ├── RegisterView.vue    # 注册（用户名 + 密码，邮箱可选）
│   │   │   ├── CharSelectView.vue  # 角色选择（立绘 + roles.json）
│   │   │   ├── HomeView.vue        # 主页（7 热点 + 海报背景 + SVG）
│   │   │   ├── GrowthView.vue      # 成长（角色立绘 + 属性）
│   │   │   ├── InventoryView.vue   # 背包（道具 + 携带槽）
│   │   │   ├── ArchiveView.vue     # 图鉴（校史收集）
│   │   │   └── MapView.vue         # 地图容器（Phaser 挂载点）
│   │   ├── App.vue
│   │   ├── main.ts          # 注入 events.json/puzzles.json 到 window.__gameConfigs
│   │   ├── style.css        # Tailwind + 全局样式
│   │   └── vite-env.d.ts
│   ├── tests/               # 单元测试
│   │   ├── combat/formulas.test.ts
│   │   ├── combat/simulator.test.ts
│   │   └── stores/game.test.ts
│   ├── index.html
│   ├── package.json         # name: campus-daze-frontend v2.0.0
│   ├── vite.config.ts       # 端口 5173 + @tailwindcss/vite + /api /ws 代理
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   └── .env                 # VITE_API_BASE / VITE_WS_BASE / VITE_API_URL / VITE_WS_URL
├── backend/                  # FastAPI 单体后端
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI 入口（lifespan + loguru + 6 路由）
│   │   ├── config.py        # Pydantic Settings（DATABASE_URL/JWT_*/CORS_ORIGINS 等）
│   │   ├── database.py      # create_async_engine + async_sessionmaker
│   │   ├── dependencies.py  # 依赖注入（get_current_user 等）
│   │   ├── api/             # API 路由
│   │   │   ├── auth.py      # /api/auth（register/login/refresh/me）
│   │   │   ├── event.py     # /api/event（随机事件触发）
│   │   │   ├── health.py    # /api/health
│   │   │   ├── images.py    # /api/images/{entity_type}/{entity_key}
│   │   │   ├── save.py      # /api/save（load/save 乐观锁）
│   │   │   └── ws.py        # /ws/game（WebSocket + 闲置调度器）
│   │   ├── models/          # ORM 模型
│   │   │   ├── game_image.py # game_images 表（MEDIUMBLOB）
│   │   │   ├── game_save.py  # game_saves 表（JSON + version 乐观锁）
│   │   │   └── user.py       # users 表
│   │   ├── schemas/         # Pydantic 模型
│   │   │   ├── auth.py       # 注册/登录请求响应
│   │   │   ├── common.py     # 通用响应
│   │   │   └── game_state.py # GameState（player/combat/map/progress 等）
│   │   ├── services/        # 业务服务
│   │   │   ├── auth_service.py         # 注册/登录/JWT 签发
│   │   │   ├── event_service.py        # 随机事件触发（懒加载避免循环导入）
│   │   │   ├── notification_service.py # 通知推送
│   │   │   ├── progress_validator.py   # 进度校验
│   │   │   ├── reward_service.py       # 奖励发放
│   │   │   └── save_service.py         # 存档读写（乐观锁）
│   │   └── utils/           # 工具
│   │       ├── errors.py    # 自定义异常
│   │       └── security.py  # JWT + bcrypt
│   ├── alembic/             # 数据库迁移
│   │   ├── env.py           # 异步迁移配置（create_async_engine + run_sync）
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py  # 3 表（users/game_saves/game_images）
│   ├── alembic.ini
│   ├── scripts/
│   │   └── validate_balance.py  # 数值平衡校验
│   ├── tests/               # 后端测试
│   │   ├── conftest.py
│   │   ├── test_auth.py
│   │   ├── test_progress_validator.py
│   │   ├── test_save.py
│   │   └── test_websocket.py
│   ├── init_db.py           # 建表 + 13 张图片入库（5 立绘 + 5 精灵 + 1 Boss + 1 海报 + 1 地图）
│   ├── requirements.txt
│   ├── pytest.ini
│   ├── Dockerfile
│   └── .env.example
├── doc/                      # 文档
│   ├── tongji_academic_cat_gdd_初版.md   # 游戏设计文档（GDD）
│   ├── 学术喵_技术设计与开发方案v1.md     # 技术设计文档
│   └── 学术喵的奇幻之旅.pdf
├── docker-compose.yml       # 容器编排
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
python -m venv .venv
.venv\Scripts\activate           # Windows
# source .venv/bin/activate      # Linux/macOS
pip install -r requirements.txt
copy .env.example .env           # Windows，编辑 .env 配置 MySQL
python init_db.py                # 初始化数据库（建表 + 13 张图片入库）
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**前端（Vue 3 + Vite）：**
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

### 数据库迁移
```bash
cd backend
alembic upgrade head              # 应用迁移
alembic revision --autogenerate -m "描述"  # 生成新迁移
```

### 测试
```bash
# 前端单元测试
cd frontend && npx vitest

# 后端单元测试
cd backend && pytest
```

## 测试用户

注册流程：用户名 + 密码 → 创建角色 → 进入游戏（邮箱可选）

## 技术栈

### 前端
- Vue 3.4 + Vite 5.2
- Phaser 3.80（2D 像素 RPG 引擎）
- Pinia 2.1（状态管理）
- Vue Router 4.3
- Axios 1.7
- Tailwind CSS（@tailwindcss/vite 插件，无 tailwind.config.js）
- TypeScript 5.4
- 原生 WebSocket（服务端推送随机事件/奖励通知）

### 后端
- FastAPI 0.110
- Uvicorn 0.28
- SQLAlchemy 2.0（异步 ORM，Mapped + mapped_column 风格）
- aiomysql 0.3 / PyMySQL 1.1
- Pydantic 2.5 + Pydantic Settings 2.1
- Python JOSE 3.3（JWT）
- bcrypt 4.1.2（密码哈希）
- MySQL 8.x（数据库 `tongzhou_meow`，字符集 utf8mb4）
- Alembic 1.13（异步迁移）
- loguru（日志）
- 原生 WebSocket（实时推送 + 闲置调度器）

## 环境配置

### 前端 `frontend/.env`
```env
VITE_API_BASE=/api/v1
VITE_WS_BASE=/ws
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 后端 `backend/.env`（从 `.env.example` 复制后修改）
```env
APP_NAME=同舟喵济
APP_VERSION=1.0.0
DATABASE_URL=mysql+aiomysql://root:123456@127.0.0.1:3306/tongzhou_meow?charset=utf8mb4
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20
DB_POOL_RECYCLE=3600
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:5173","http://localhost:5174","http://localhost:3000"]
FRONTEND_CONFIG_DIR=../frontend/src/game/config
CHARACTERS_ASSET_DIR=../frontend/public/assets/characters
```

## 代码规范

### 前端 (TypeScript/Vue)
- 组件使用 `.vue` 扩展名，`<script setup lang="ts">`
- Pinia stores 使用组合式 API（setup 风格）
- 路径别名：`@/`、`@game/`、`@api/`、`@stores/`、`@views/`、`@components/`
- Phaser 场景继承 `Phaser.Scene`，参考 labs.phaser.io 样例模式
- 使用 axiosInstance 进行 API 调用，401 自动刷新 token
- 游戏配置 JSON 位于 `src/game/config/`，运行时注入 Phaser cache
- Tailwind 通过 `@tailwindcss/vite` 插件集成（无 postcss.config.js / tailwind.config.js）

### 后端 (Python)
- FastAPI：使用 Pydantic 模型进行请求/响应验证
- SQLAlchemy 2.0：使用 `Mapped` + `mapped_column` 类型注解风格
- 全部异步：`async def` + `AsyncSession`
- 路由统一前缀 `/api`（每个 router 自行声明 prefix）
- 遵循 PEP 8

### API 设计
- RESTful 风格
- 统一前缀 `/api`
- 认证使用 JWT（Bearer Token）
- 角色图通过 `GET /api/images/{entity_type}/{entity_key}?type={image_type}` 读取

## 核心功能模块

### 认证系统 (`/api/auth`)
- 注册 `POST /api/auth/register`（用户名 + 密码，邮箱可选）
- 登录 `POST /api/auth/login`（用户名 + 密码）
- 刷新 token `POST /api/auth/refresh`
- 获取用户信息 `GET /api/auth/me`

### 存档系统 (`/api/save`)
- 加载存档 `GET /api/save`（返回 GameState）
- 保存存档 `POST /api/save`（乐观锁，version 冲突拒绝）

### 随机事件 (`/api/event`)
- 触发事件 `POST /api/event/trigger`（基于场景：idle/map）
- 16 个事件配置（`events.json`）

### 游戏图片系统 (`/api/images`)
- 获取图片 `GET /api/images/{entity_type}/{entity_key}?type={image_type}`
- entity_type：`protagonist` / `sprite_sheet` / `boss` / `map` / `system`
- 13 张图片：5 立绘 + 5 精灵 + 1 Boss 占位 + 1 海报 + 1 地图

### WebSocket (`/ws/game`)
- 连接：`ws://host:port/ws/game?token={JWT}`
- 服务端推送：随机事件、奖励通知
- 闲置调度器：600 秒触发，30% 概率推送事件

### 健康检查
- `GET /api/health`

## 配置说明

### API 代理 (`vite.config.ts`)
- `/api` 代理到 `http://localhost:8000`
- `/ws` 代理到 `ws://localhost:8000`

### 认证 Token 处理 (`src/api/client.ts`)
- accessToken 与 refreshToken 存于 localStorage
- 401 自动尝试刷新 token（单飞机制，避免并发刷新）
- 刷新失败则登出并跳转登录页

### 立绘加载流程
1. `init_db.py` 把 `frontend/public/assets/` 下 13 张图片写入 `game_images.image_data`（MEDIUMBLOB）
2. 前端 `PreloaderScene` 通过 `this.load.image(key, url)` 加载到 Phaser 纹理缓存
3. `MapExploreScene` / `CombatOverlayScene` 通过 `this.add.sprite` / `this.add.image` 展示
4. 大地图背景与海报走前端静态目录（`/assets/maps/`、`/assets/poster/`）

### 游戏配置注入
- `main.ts` 在启动时读取 `events.json` / `puzzles.json` 并挂载到 `window.__gameConfigs`
- `BootScene` 把 9 个 JSON 配置注入 Phaser `cache.json`
- 各场景通过 `this.cache.json.get('events')` 等方式读取

## 注意事项

1. 前端开发服务器运行在端口 5173，后端 FastAPI 运行在端口 8000
2. Vite proxy 配置确保开发时 API/WebSocket 请求正确转发
3. 数据库使用 MySQL 8.x，数据库名 `tongzhou_meow`，字符集 utf8mb4
4. 角色立绘存于数据库（MEDIUMBLOB，最大 16MB）；大地图背景走前端静态目录
5. WebSocket 使用原生实现（非 Socket.IO），用于服务端推送随机事件/奖励通知
6. 密码重置功能需要配置 SMTP 服务（P1）
7. 所有敏感配置信息应存储在 `backend/.env` 文件中，不要提交到版本控制
8. 游戏配置 JSON 位于 `frontend/src/game/config/`，修改后需重启 dev server
9. **基础设施约束（重要）**：阿里云仅提供 ECS（服务器）+ MySQL + 基础环境。**全阶段不引入 Nginx / Redis / OSS / CDN** 等额外中间件。生产部署采用 FastAPI `StaticFiles` 一体化方案——后端单进程（Uvicorn）同时托管前端 `dist/` 静态资源、REST API 与 WebSocket；`backend/Dockerfile` 为多阶段构建（Node 构建前端 + Python 运行后端），无需独立前端容器
