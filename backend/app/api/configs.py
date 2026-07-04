"""D.2 配表热更新 API：GET /api/configs/{name} + PUT /api/configs/{name}

- GET：返回 JSON 配置，附带 ETag（content_hash）。客户端可带 If-None-Match → 304
- PUT：管理员更新配置（递增 version，重算 hash）；当前实现无鉴权限制（开发态）
"""
import hashlib
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.game_config import GameConfig
from app.config import settings

router = APIRouter(prefix="/api/configs", tags=["configs"])

# 允许的配置名白名单（防止任意写入）
ALLOWED_CONFIG_NAMES = {
    "events",
    "puzzles",
    "chapters",
    "roles",
    "skills",
    "items",
    "monsters",
    "map-nodes",
    "archives",
}


@router.get("/{config_name}")
async def get_config(
    config_name: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """D.2.5 获取配置 JSON，支持 ETag + If-None-Match → 304。"""
    if config_name not in ALLOWED_CONFIG_NAMES:
        raise HTTPException(status_code=404, detail="Config not found")

    result = await db.execute(
        select(GameConfig).where(GameConfig.config_name == config_name)
    )
    cfg = result.scalar_one_or_none()

    # DB 未命中：fallback 读前端静态 JSON（首次启动未播种时）
    if not cfg:
        fallback_content = _read_fallback_json(config_name)
        if fallback_content is None:
            raise HTTPException(status_code=404, detail="Config not found")
        # 计算 hash 作为 ETag
        content_hash = hashlib.sha256(fallback_content.encode("utf-8")).hexdigest()
        etag = f'"{content_hash}"'
        if_none_match = request.headers.get("if-none-match")
        if if_none_match and if_none_match == etag:
            return JSONResponse(status_code=status.HTTP_304_NOT_MODIFIED)
        return JSONResponse(
            content=_parse_json(fallback_content),
            headers={"ETag": etag, "Cache-Control": "public, max-age=60"},
        )

    etag = f'"{cfg.content_hash}"'
    if_none_match = request.headers.get("if-none-match")
    if if_none_match and if_none_match == etag:
        return JSONResponse(status_code=status.HTTP_304_NOT_MODIFIED)

    return JSONResponse(
        content=_parse_json(cfg.content),
        headers={"ETag": etag, "Cache-Control": "public, max-age=60"},
    )


@router.put("/{config_name}")
async def put_config(
    config_name: str,
    payload: dict,
    db: AsyncSession = Depends(get_db),
):
    """D.2.5 更新配置（管理员）。payload 直接为 JSON 对象。"""
    if config_name not in ALLOWED_CONFIG_NAMES:
        raise HTTPException(status_code=404, detail="Config not found")

    import json
    content_str = json.dumps(payload, ensure_ascii=False)
    content_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    result = await db.execute(
        select(GameConfig).where(GameConfig.config_name == config_name)
    )
    cfg = result.scalar_one_or_none()
    if cfg:
        cfg.content = content_str
        cfg.content_hash = content_hash
        cfg.version = (cfg.version or 1) + 1
    else:
        cfg = GameConfig(
            config_name=config_name,
            content=content_str,
            content_hash=content_hash,
            version=1,
        )
        db.add(cfg)
    await db.commit()

    return {
        "config_name": config_name,
        "version": cfg.version,
        "content_hash": cfg.content_hash,
    }


def _read_fallback_json(config_name: str) -> str | None:
    """DB 未命中时，读 frontend/src/game/config/{config_name}.json 作为 fallback。"""
    config_dir = Path(settings.FRONTEND_CONFIG_DIR)
    file_path = config_dir / f"{config_name}.json"
    if not file_path.exists():
        return None
    return file_path.read_text(encoding="utf-8")


def _parse_json(content: str):
    import json
    return json.loads(content)
