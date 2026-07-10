from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.game_image import GameImage
from app.utils.errors import ImageNotFound

router = APIRouter(prefix="/api/images", tags=["images"])


@router.get("/{entity_type}/{entity_key}")
async def get_image(
    entity_type: str,
    entity_key: str,
    type: str = "portrait",
    db: Session = Depends(get_db),
):
    result = db.execute(
        select(GameImage).where(
            GameImage.entity_type == entity_type,
            GameImage.entity_key == entity_key,
            GameImage.image_type == image_type_safe(type),
        )
    )
    image = result.scalar_one_or_none()
    if not image:
        raise ImageNotFound()

    return Response(
        content=image.image_data,
        media_type=image.mime_type,
        headers={"Cache-Control": "public, max-age=86400"},
    )


def image_type_safe(raw: str) -> str:
    allow = {"portrait", "icon", "cat_form", "sprite", "map", "poster", "boss"}
    return raw if raw in allow else "portrait"