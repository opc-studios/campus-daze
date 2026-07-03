from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshRequest, TokenResponse, UserResponse
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.security import decode_token
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

    return auth_service.refresh_token(db, user_id)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "登出成功"}
