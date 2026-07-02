from sqlalchemy import Column, BigInteger, String, Integer, JSON, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from app.database import Base
import enum


class RoleIdEnum(str, enum.Enum):
    lina = "lina"
    ayu = "ayu"
    zhixia = "zhixia"
    jiangxun = "jiangxun"
    laodeng = "laodeng"


class GameSave(Base):
    __tablename__ = "game_saves"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    role_id = Column(Enum(RoleIdEnum), nullable=False)
    state_json = Column(JSON, nullable=False, comment="完整 GameState")
    state_version = Column(Integer, nullable=False, default=1, comment="乐观锁版本")
    schema_version = Column(Integer, nullable=False, default=1, comment="GameState schema 版本")
    checksum = Column(String(64), nullable=True, comment="state_json 摘要防篡改")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
