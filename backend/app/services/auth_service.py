from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.utils.errors import AuthInvalidCredentials, AuthEmailExists
from app.schemas.auth import UserResponse
from datetime import timedelta
from app.config import settings


def register(db: Session, email: str, password: str, nickname: str) -> dict:
    result = db.execute(select(User).where(User.email == email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise AuthEmailExists()
    
    hashed_password = hash_password(password)
    new_user = User(
        email=email,
        password_hash=hashed_password,
        nickname=nickname,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": str(new_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(new_user),
    }


def login(db: Session, email: str, password: str) -> dict:
    result = db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(password, user.password_hash):
        raise AuthInvalidCredentials()
    
    if not user.is_active:
        raise AuthInvalidCredentials()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }


def refresh_token(db: Session, user_id: str) -> dict:
    result = db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise AuthInvalidCredentials()
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }
