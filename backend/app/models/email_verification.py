from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.database import Base


class EmailVerification(Base):
    """密码重置验证码记录表。"""
    __tablename__ = "email_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code_hash = Column(String(128), nullable=False)  # bcrypt 哈希后的 6 位验证码
    purpose = Column(String(32), nullable=False)     # password_reset / email_bind
    expires_at = Column(DateTime, nullable=False, index=True)
    consumed_at = Column(DateTime, nullable=True)    # 已使用时间（None=未使用）
    created_at = Column(DateTime, nullable=False, server_default=func.now())
