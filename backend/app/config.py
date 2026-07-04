from pydantic_settings import BaseSettings
from typing import Optional
from pathlib import Path


# 后端根目录（backend/）
BASE_DIR = Path(__file__).resolve().parent.parent
# 项目根目录（campus-daze/）
PROJECT_ROOT = BASE_DIR.parent
# 前端配置目录（用于读取 events.json 等）
FRONTEND_CONFIG_DIR = PROJECT_ROOT / "frontend" / "src" / "game" / "config"
# 角色立绘静态目录
CHARACTERS_ASSET_DIR_DEFAULT = PROJECT_ROOT / "frontend" / "public" / "assets" / "characters"


class Settings(BaseSettings):
    APP_NAME: str = "同舟喵济"
    APP_VERSION: str = "1.0.0"

    # MySQL 8.x 异步驱动（aiomysql）
    DATABASE_URL: str = "mysql+aiomysql://root:123456@127.0.0.1:3306/tongzhou_meow?charset=utf8mb4"
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_RECYCLE: int = 3600

    JWT_SECRET_KEY: str = "your-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]

    # 前端配置/资源目录
    FRONTEND_CONFIG_DIR: str = str(FRONTEND_CONFIG_DIR)
    CHARACTERS_ASSET_DIR: str = str(CHARACTERS_ASSET_DIR_DEFAULT)

    # 前端 dist 目录（生产模式由 FastAPI StaticFiles 托管；为空时检查默认路径）
    # Docker 部署时设为 /app/static_dist
    STATIC_DIST_DIR: str = ""

    # SMTP 邮件服务（C.1，仅用于密码重置）
    SMTP_HOST: str = "smtp.qq.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""                       # 授权码，非登录密码
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "同舟喵济"
    SMTP_USE_TLS: bool = True
    SMTP_VERIFY_CODE_TTL_MINUTES: int = 15        # 验证码有效期
    SMTP_VERIFY_CODE_LENGTH: int = 6

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
