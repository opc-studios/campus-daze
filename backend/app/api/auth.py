from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    RefreshRequest,
    LogoutRequest,
    TokenResponse,
    UserResponse,
)
from app.dependencies import get_current_user
from app.models.user import User
from app.models.revoked_token import RevokedToken
from app.utils.security import decode_token, decode_token_jti, get_token_exp
from app.utils.errors import AuthInvalidToken, AuthRefreshExpired
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    return auth_service.register(
        db, request.username, request.password, request.nickname, request.email
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    return auth_service.login(db, request.username, request.password)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(request.refresh_token)

    if payload is None or payload.get("type") != "refresh":
        raise AuthInvalidToken()

    exp_timestamp = payload.get("exp")
    if exp_timestamp and datetime.utcnow().timestamp() > exp_timestamp:
        raise AuthRefreshExpired()

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthInvalidToken()

    jti = payload.get("jti")
    if jti:
        blacklisted = db.execute(
            select(RevokedToken).where(RevokedToken.refresh_token_jti == jti)
        )
        if blacklisted.scalar_one_or_none() is not None:
            raise AuthRefreshExpired("refresh token 已失效")

    return auth_service.refresh_token(db, user_id)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(
    body: LogoutRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    jti = decode_token_jti(body.refresh_token)
    if not jti:
        return {"message": "登出成功"}

    existing = db.execute(
        select(RevokedToken).where(RevokedToken.refresh_token_jti == jti)
    )
    if existing.scalar_one_or_none() is None:
        exp = get_token_exp(body.refresh_token) or datetime.utcnow()
        db.add(
            RevokedToken(
                user_id=current_user.id,
                refresh_token_jti=jti,
                expires_at=exp,
            )
        )
        db.commit()

    return {"message": "登出成功"}