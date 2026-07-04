from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.dialects.mysql import MEDIUMTEXT
from sqlalchemy.sql import func
from app.database import Base


class GameConfig(Base):
    """D.2 配表热更新：游戏配置 JSON 入库。

    config_name: events / puzzles / chapters / roles 等
    content: JSON 文本（MEDIUMTEXT，最大 16MB）
    version: 单调递增版本号
    content_hash: SHA256，用于 ETag 校验
    """
    __tablename__ = "game_configs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    config_name = Column(String(64), unique=True, nullable=False, index=True)
    content = Column(MEDIUMTEXT, nullable=False, comment="JSON 配置文本")
    version = Column(Integer, nullable=False, default=1)
    content_hash = Column(String(64), nullable=False, comment="SHA256 of content")
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
