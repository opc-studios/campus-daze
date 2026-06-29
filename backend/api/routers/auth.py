import os
import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import text

from ..schemas.auth import UserCreate, UserLogin, Token, UserResponse, ForgotPasswordRequest, ResetPasswordRequest
from ..utils.auth import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from ..utils.database import get_db
from ..utils.email import send_welcome_email, send_new_password_email

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.execute(text("SELECT * FROM users_user WHERE id = :user_id"), {"user_id": user_id}).fetchone()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/register")
async def register(user: UserCreate, db: Session = Depends(get_db)):
    existing_username = db.execute(text("SELECT * FROM users_user WHERE username = :username"), {"username": user.username}).fetchone()
    if existing_username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
    
    hashed_password = get_password_hash(user.password)
    db.execute(
        text("INSERT INTO users_user (username, email, password_hash) VALUES (:username, :email, :password_hash)"),
        {"username": user.username, "email": user.email, "password_hash": hashed_password}
    )
    db.commit()
    
    user_data = db.execute(text("SELECT * FROM users_user WHERE username = :username"), {"username": user.username}).fetchone()
    access_token = create_access_token(data={"user_id": user_data.id})
    refresh_token = create_refresh_token(data={"user_id": user_data.id})
    
    return {
        "user": {"id": user_data.id, "username": user_data.username, "email": user_data.email},
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    username = form_data.username
    
    user = db.execute(text("SELECT * FROM users_user WHERE username = :username"), {"username": username}).fetchone()
    
    if user is None or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"user_id": user.id})
    refresh_token = create_refresh_token(data={"user_id": user.id})
    
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")
    
    user_id = payload.get("user_id")
    user = db.execute(text("SELECT * FROM users_user WHERE id = :user_id"), {"user_id": user_id}).fetchone()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    
    new_access_token = create_access_token(data={"user_id": user.id})
    return {"access_token": new_access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email}

@router.post("/forgot-password")
async def forgot_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT * FROM users_user WHERE username = :username"),
        {"username": request.username}
    ).fetchone()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Username not found")
    
    hashed_password = get_password_hash(request.new_password)
    
    db.execute(
        text("UPDATE users_user SET password_hash = :password_hash WHERE id = :user_id"),
        {"password_hash": hashed_password, "user_id": user.id}
    )
    db.commit()
    
    return {"message": "Password reset successfully"}

@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT * FROM users_user WHERE username = :username"),
        {"username": request.username}
    ).fetchone()
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Username not found")
    
    hashed_password = get_password_hash(request.new_password)
    
    db.execute(
        text("UPDATE users_user SET password_hash = :password_hash WHERE id = :user_id"),
        {"password_hash": hashed_password, "user_id": user.id}
    )
    db.commit()
    
    return {"message": "Password reset successfully"}