from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.utils.errors import AuthInvalidCredentials, AuthUsernameExists
from app.schemas.auth import UserResponse


def register(db: Session, username: str, password: str, nickname: str, email: str = None) -> dict:
    result = db.execute(select(User).where(User.username == username))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        raise AuthUsernameExists()

    if email:
        result = db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            raise AuthUsernameExists()

    hashed_password = hash_password(password)
    new_user = User(
        username=username,
        password_hash=hashed_password,
        nickname=nickname,
        email=email,
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


def login(db: Session, username: str, password: str) -> dict:
    result = db.execute(select(User).where(User.username == username))
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
