from pydantic import BaseModel, EmailStr, Field


class SendCodeRequest(BaseModel):
    """发送验证码：用户名 + 邮箱双因子匹配。"""
    username: str = Field(..., min_length=3, max_length=32)
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """重置密码：用户名 + 验证码 + 新密码。"""
    username: str = Field(..., min_length=3, max_length=32)
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    new_password: str = Field(..., min_length=8, max_length=64)


class ResetPasswordResponse(BaseModel):
    message: str
