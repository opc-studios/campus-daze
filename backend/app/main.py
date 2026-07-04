import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from loguru import logger

from app.config import settings
from app.api import auth, health, ws, event, save, images, password_reset, configs


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("Run `alembic upgrade head` to initialize schema, or `python init_db.py` to seed images.")
    yield
    logger.info("Shutting down application")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(health.router)
app.include_router(ws.router)
app.include_router(event.router)
app.include_router(save.router)
app.include_router(images.router)
app.include_router(password_reset.router)
app.include_router(configs.router)


# ============================================================
# 生产模式：FastAPI StaticFiles 一体化托管前端 dist
# 不引入 Nginx——前端构建产物由后端单进程直接服务
# ============================================================
_dist_dir_str = settings.STATIC_DIST_DIR or str(Path(__file__).parent.parent.parent / "frontend" / "dist")
_dist_dir = Path(_dist_dir_str)
if _dist_dir.is_dir():
    _assets_dir = _dist_dir / "assets"
    if _assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(_assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        """SPA fallback：未匹配的 GET 请求返回静态文件或 index.html。

        API/WS 路径已由上面的 router 优先匹配，不会走到这里。
        """
        if full_path:
            candidate = _dist_dir / full_path
            if candidate.is_file():
                return FileResponse(str(candidate))
        index_path = _dist_dir / "index.html"
        if index_path.is_file():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Frontend dist not found")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
