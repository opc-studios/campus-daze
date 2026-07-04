from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from sqlalchemy.dialects.mysql import MEDIUMBLOB
from sqlalchemy.sql import func
from app.database import Base


class GameImage(Base):
    __tablename__ = "game_images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    entity_type = Column(String(32), nullable=False, comment="protagonist/monster/boss/item/archive/sprite")
    entity_key = Column(String(64), nullable=False, comment="如 lina / m_delay / boss_ai_prof")
    image_type = Column(String(32), nullable=False, default="portrait", comment="portrait/icon/cat_form 等")
    mime_type = Column(String(32), nullable=False, default="image/png")
    # MySQL 显式 MEDIUMBLOB（最大 16MB），其他后端 fallback 到 LargeBinary
    image_data = Column(MEDIUMBLOB, nullable=False, comment="图片二进制")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
