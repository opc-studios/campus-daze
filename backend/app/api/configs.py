import hashlib
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game_config import GameConfig
from app.config import settings

router = APIRouter(prefix="/api/configs", tags=["configs"])

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
    db: Session = Depends(get_db),
):
    if config_name not in ALLOWED_CONFIG_NAMES:
        raise HTTPException(status_code=404, detail="Config not found")

    result = db.execute(
        select(GameConfig).where(GameConfig.config_name == config_name)
    )
    cfg = result.scalar_one_or_none()

    if not cfg:
        fallback_content = _read_fallback_json(config_name)
        if fallback_content is None:
            raise HTTPException(status_code=404, detail="Config not found")
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
    db: Session = Depends(get_db),
):
    if config_name not in ALLOWED_CONFIG_NAMES:
        raise HTTPException(status_code=404, detail="Config not found")

    import json
    content_str = json.dumps(payload, ensure_ascii=False)
    content_hash = hashlib.sha256(content_str.encode("utf-8")).hexdigest()

    result = db.execute(
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
    db.commit()

    return {
        "config_name": config_name,
        "version": cfg.version,
        "content_hash": cfg.content_hash,
    }


def _read_fallback_json(config_name: str) -> str | None:
    config_dir = Path(settings.FRONTEND_CONFIG_DIR)
    file_path = config_dir / f"{config_name}.json"
    if not file_path.exists():
        return None
    return file_path.read_text(encoding="utf-8")


def _parse_json(content: str):
    import json
    return json.loads(content)