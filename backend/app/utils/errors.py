from fastapi import HTTPException, status


class AuthInvalidCredentials(HTTPException):
    def __init__(self, detail: str = None):
        message = detail or "用户名或密码错误"
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "AUTH_INVALID_CREDENTIALS", "message": message},
        )


class AuthUsernameExists(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "AUTH_USERNAME_EXISTS", "message": "用户名已注册"},
        )


class AuthEmailExists(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "AUTH_EMAIL_EXISTS", "message": "邮箱已注册"},
        )


class AuthInvalidToken(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "AUTH_INVALID_TOKEN", "message": "JWT 无效或过期"},
        )


class AuthRefreshExpired(HTTPException):
    def __init__(self, detail: str = None):
        message = detail or "刷新令牌过期"
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error_code": "AUTH_REFRESH_EXPIRED", "message": message},
        )


class SaveNotFound(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "SAVE_NOT_FOUND", "message": "无存档（新用户）"},
        )


class SaveVersionMismatch(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error_code": "SAVE_VERSION_MISMATCH", "message": "乐观锁冲突"},
        )


class SaveValidationFailed(HTTPException):
    def __init__(self, details: dict = None):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": "SAVE_VALIDATION_FAILED",
                "message": "ProgressValidator 拒绝",
                "details": details,
            },
        )


class SaveRoleLocked(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error_code": "SAVE_ROLE_LOCKED", "message": "试图修改已锁定 roleId"},
        )


class RateLimitExceeded(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"error_code": "RATE_LIMIT_EXCEEDED", "message": "请求过于频繁"},
        )


class ImageNotFound(HTTPException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error_code": "IMAGE_NOT_FOUND", "message": "请求的立绘/图标不存在"},
        )
