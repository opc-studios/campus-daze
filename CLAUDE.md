# 同舟喵济 - 项目开发指南

## 项目概述

《同舟喵济》是一款以同济大学校园为背景的放置类 RPG 游戏。玩家扮演五只学术喵之一，通过挂机学习、探索章节地图、参与战斗等方式积累学分，最终完成学业。

## 技术栈

### 前端
- **框架**: Vue 3 + TypeScript + Vite
- **游戏引擎**: Phaser 3
- **状态管理**: Pinia
- **样式**: Tailwind CSS
- **HTTP 客户端**: Axios
- **测试**: Vitest

### 后端
- **框架**: FastAPI
- **ORM**: SQLAlchemy 2.0
- **数据库**: SQLite (开发) / MySQL 8.x (生产)
- **认证**: JWT (python-jose)
- **密码加密**: bcrypt (passlib)
- **日志**: Loguru
- **实时通信**: WebSocket
- **测试**: pytest + pytest-asyncio

## 项目结构

```
campus-daze/
├── backend/              # 后端服务
│   ├── app/
│   │   ├── api/         # API 路由 (auth, save, ws, event, health)
│   │   ├── models/      # 数据库模型 (User, GameSave)
│   │   ├── schemas/     # Pydantic 数据验证
│   │   ├── services/    # 业务逻辑 (auth, save, event, reward, progress_validator)
│   │   ├── utils/       # 工具函数 (security, errors)
│   │   ├── config.py    # 配置管理
│   │   ├── database.py  # 数据库连接
│   │   └── main.py      # FastAPI 应用入口
│   ├── tests/           # 后端测试
│   └── requirements.txt
│
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── api/         # API 调用封装
│   │   ├── components/  # Vue 组件
│   │   ├── composables/ # 组合式函数 (useWebSocket, useIdle, useOfflineReward)
│   │   ├── game/        # Phaser 游戏逻辑
│   │   │   ├── config/  # 游戏配置 JSON (角色、技能、怪物、地图、事件、物品)
│   │   │   ├── scenes/  # Phaser 场景 (BootScene, MapExploreScene, CombatOverlayScene)
│   │   │   ├── systems/ # 游戏系统 (MapFogSystem, MonsterAISystem, FormSwitchSystem)
│   │   │   └── combat/  # 战斗系统 (simulator, formulas, skill-runner)
│   │   ├── stores/      # Pinia 状态管理 (user, game)
│   │   ├── views/       # 页面视图 (Login, Register, CharSelect, Home, Growth, Map, Inventory, Archive)
│   │   └── style.css    # 全局样式
│   ├── tests/           # 前端测试
│   └── package.json
│
├── docker-compose.yml   # Docker 部署配置
└── doc/                 # 项目文档
```

## 开发命令

### 后端开发

```bash
cd backend

# 启动开发服务器 (SQLite)
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 运行测试
python -m pytest tests/ -v --tb=short -p no:playwright

# 安装依赖
pip install -r requirements.txt
```

### 前端开发

```bash
cd frontend

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 类型检查
npm run type-check

# 安装依赖
npm install
```

### 访问地址

- 前端开发服务器: http://localhost:5174 (或 5173)
- 后端 API: http://localhost:8000
- API 文档: http://localhost:8000/docs

## 核心功能模块

### 1. 认证系统
- 邮箱密码注册登录
- JWT Token 认证 (access_token + refresh_token)
- WebSocket 连接认证

### 2. 存档系统
- 云存档读写 (GET/PUT /api/save)
- 乐观锁版本控制 (state_version)
- 完整 GameState 持久化

### 3. 战斗系统
- 回合制自动战斗
- 战斗公式: 伤害、暴击、闪避、命中
- 技能系统: 普攻 + 2 主动技能
- 战斗速度控制: 1x / 2x / 跳过

### 4. 地图探索
- 章节地图节点系统
- 迷雾系统 (MapFogSystem)
- 怪物 AI (巡逻、警戒、追击、脱战)
- 形态切换 (人形态/猫形态)

### 5. 挂机系统
- 学习/实习任务
- 在线/离线收益计算
- 离线收益上限 8 小时

### 6. 实时通信
- WebSocket 推送随机事件和奖励通知
- 自动重连机制 (指数退避)
- HTTP API 回退保障

## 重要约束

### API 开发
- API 参数必须前后端一致
- 使用 Pydantic Schema 进行数据验证
- 错误响应格式: `{ error_code, message, details? }`

### 数据处理
- 数据加载使用 `res || []` 防止空响应错误
- Axios 响应直接使用 `res`，不要假设 `res.data` 层

### WebSocket
- 消息格式: `{ type, data }`
- 消息类型: ping, heartbeat, random_event, reward, system
- 连接断开自动重连 (指数退避)
- 关键奖励通知要有 HTTP 回退

### UI 样式
- 使用统一的 CSS 类:
  - `.game-card-neon` - 游戏卡片
  - `.floating-particles` - 浮动粒子效果
  - `.exp-bar` - 经验条
  - `.stat-panel` - 属性面板
  - `.game-button` - 游戏按钮

### 数据库
- 本地开发使用 SQLite
- 生产环境使用 MySQL 8.x
- 数据库表自动创建 (Base.metadata.create_all)

## CORS 配置

后端 CORS 允许的前端源:
- http://localhost:5173
- http://localhost:5174
- http://localhost:3000

## 测试覆盖

### 后端测试
- 认证功能 (注册、登录)
- 存档读写
- WebSocket 连接管理
- 进度验证器

### 前端测试
- 战斗公式计算
- 战斗模拟器
- 游戏状态管理

## 部署

使用 Docker Compose 部署:

```bash
docker-compose up -d
```

服务:
- MySQL 8.0 (生产环境)
- 后端 API (FastAPI)
- 前端 (Nginx 静态托管)

## 文档参考

- 技术设计: `doc/学术喵_技术设计与开发方案.md`
- 游戏设计: `doc/tongji_academic_cat_gdd_初版.md`
