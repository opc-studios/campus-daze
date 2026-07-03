from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str
    email: Optional[EmailStr] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    nickname: str
    is_active: bool

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
