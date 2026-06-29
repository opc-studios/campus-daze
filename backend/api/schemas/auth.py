from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr

class ForgotPasswordRequest(BaseModel):
    username: str
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    username: str
    new_password: str