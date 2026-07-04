"""密码重置 API：POST /api/auth/password/send-code + POST /api/auth/password/reset"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.password_reset import (
    SendCodeRequest,
    ResetPasswordRequest,
    ResetPasswordResponse,
)
from app.services.email_service import send_password_reset_code, verify_password_reset_code
from app.utils.errors import AuthInvalidCredentials
from app.utils.security import hash_password

router = APIRouter(prefix="/api/auth/password", tags=["password-reset"])


@router.post("/send-code")
async def send_reset_code(body: SendCodeRequest, db: AsyncSession = Depends(get_db)):
    """发送密码重置验证码到用户邮箱。用户名 + 邮箱必须匹配。"""
    result = await db.execute(
        select(User).where(User.username == body.username, User.email == body.email)
    )
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        # 安全考虑：不暴露用户是否存在（统一返回成功）
        return {"message": "若用户名和邮箱匹配，验证码已发送"}

    await send_password_reset_code(db, user.email, user.id)
    return {"message": "若用户名和邮箱匹配，验证码已发送"}


@router.post("/reset", response_model=ResetPasswordResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """校验验证码并重置密码。"""
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise AuthInvalidCredentials()

    ok = await verify_password_reset_code(db, user.id, body.code)
    if not ok:
        raise AuthInvalidCredentials("验证码无效或已过期")

    user.password_hash = hash_password(body.new_password)
    await db.commit()
    return ResetPasswordResponse(message="密码重置成功")
