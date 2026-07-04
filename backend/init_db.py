"""
同舟喵济 - 数据库种子脚本

执行：cd backend && python init_db.py

功能：
1. 异步建表（与 alembic 互补）
2. 扫描 frontend/public/assets/characters/ 写入 5 张主角立绘
3. 扫描 frontend/public/assets/sprites/ 写入 5 张精灵图集
4. 写入陆教授 Boss 立绘占位（用 lina 立绘占位）
幂等：基于 (entity_type, entity_key, image_type) 唯一索引去重
"""
import asyncio
import sys
from pathlib import Path
from loguru import logger

# 添加 backend 目录到 path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.database import engine, AsyncSessionLocal, Base
from app.models.user import User
from app.models.game_save import GameSave
from app.models.game_image import GameImage
from sqlalchemy import select
from app.config import settings


# 角色 ID 列表
ROLE_IDS = ["lina", "ayu", "zhixia", "jiangxun", "laodeng"]
CHARACTERS_DIR = Path(settings.CHARACTERS_ASSET_DIR)
SPRITES_DIR = CHARACTERS_DIR.parent / "sprites"


async def create_tables():
    """异步建表（dev 友好；生产请用 alembic upgrade head）"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables created (if not exist)")


async def seed_image(
    db,
    entity_type: str,
    entity_key: str,
    image_type: str,
    file_path: Path,
    mime_type: str = "image/png",
    force: bool = False,
):
    """幂等写入一张图片到 game_images 表

    force=True 时，若记录已存在则先删除再重新插入（用于强制更新立绘）
    """
    if not file_path.exists():
        logger.warning(f"File not found: {file_path}")
        return False

    # 查重
    result = await db.execute(
        select(GameImage).where(
            GameImage.entity_type == entity_type,
            GameImage.entity_key == entity_key,
            GameImage.image_type == image_type,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        if force:
            logger.info(f"Force update: deleting existing {entity_type}/{entity_key}/{image_type}")
            await db.delete(existing)
            await db.commit()
        else:
            logger.debug(f"Skip (exists): {entity_type}/{entity_key}/{image_type}")
            return False

    with open(file_path, "rb") as f:
        image_data = f.read()

    if not image_data:
        logger.warning(f"Empty image data: {file_path}")
        return False

    new_image = GameImage(
        entity_type=entity_type,
        entity_key=entity_key,
        image_type=image_type,
        mime_type=mime_type,
        image_data=image_data,
    )
    db.add(new_image)
    await db.commit()
    logger.info(f"Seeded: {entity_type}/{entity_key}/{image_type} ({len(image_data)} bytes)")
    return True


async def seed_all():
    """执行所有种子任务"""
    await create_tables()

    async with AsyncSessionLocal() as db:
        seeded = 0

        # 1) 5 张主角立绘（force=True 强制更新，确保使用最新版本）
        for role_id in ROLE_IDS:
            portrait_path = CHARACTERS_DIR / f"{role_id}.png"
            ok = await seed_image(db, "protagonist", role_id, "portrait", portrait_path, force=True)
            if ok:
                seeded += 1

        # 2) 5 张主角精灵图集（force=True）
        for role_id in ROLE_IDS:
            sprite_path = SPRITES_DIR / f"{role_id}.png"
            ok = await seed_image(db, "sprite_sheet", role_id, "sprites", sprite_path, force=True)
            if ok:
                seeded += 1

        # 3) 陆教授 Boss 立绘占位（用 lina 立绘占位并打 log，force=True）
        boss_portrait = CHARACTERS_DIR / "lina.png"
        ok = await seed_image(db, "boss", "boss_ai_prof", "portrait", boss_portrait, force=True)
        if ok:
            seeded += 1
            logger.warning("Boss 立绘占位使用 lina.png，素材页未提供陆教授立绘")

        # 4) 主海报（可选入库，便于热更）
        poster_path = CHARACTERS_DIR.parent / "poster" / "gdd-cover.png"
        ok = await seed_image(db, "system", "poster", "background", poster_path)
        if ok:
            seeded += 1

        # 5) 第一章地图底图（可选入库）
        map_path = CHARACTERS_DIR.parent / "maps" / "ch1-zhonghe-plaza.png"
        ok = await seed_image(db, "map", "ch1_zhonghe_plaza", "background", map_path)
        if ok:
            seeded += 1

        # 统计
        result = await db.execute(select(GameImage))
        all_images = result.scalars().all()
        logger.info(f"==== Seeded {seeded} new images. Total in DB: {len(all_images)} ====")
        for img in all_images:
            logger.info(
                f"  - {img.entity_type}/{img.entity_key}/{img.image_type} "
                f"({len(img.image_data) if img.image_data else 0} bytes)"
            )

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed_all())
