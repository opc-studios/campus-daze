from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.security import decode_token
from app.utils.errors import AuthInvalidToken, AuthRefreshExpired
from app.config import settings
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    result = auth_service.register(db, request.email, request.password, request.nickname)
    return result


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    result = auth_service.login(db, request.email, request.password)
    return result


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    
    if payload is None or payload.get("type") != "refresh":
        raise AuthInvalidToken()
    
    exp_timestamp = payload.get("exp")
    if exp_timestamp and datetime.utcnow().timestamp() > exp_timestamp:
        raise AuthRefreshExpired()
    
    user_id = payload.get("sub")
    if user_id is None:
        raise AuthInvalidToken()
    
    result = auth_service.refresh_token(db, user_id)
    return result


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "登出成功"}
