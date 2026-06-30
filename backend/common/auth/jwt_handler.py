"""
JWT token handler for authentication.
"""
from datetime import datetime, timedelta
from jose import JWTError, jwt
from django.conf import settings
from rest_framework import authentication, exceptions

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_LIFETIME_MINUTES)
    to_encode.update({'exp': expire, 'type': 'access'})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_TOKEN_LIFETIME_DAYS)
    to_encode.update({'exp': expire, 'type': 'refresh'})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

class JWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:]
        payload = verify_token(token)
        if not payload:
            raise exceptions.AuthenticationFailed('Invalid token')
        from modules.users.models import User
        try:
            user = User.objects.get(id=payload.get('user_id'))
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')
        return (user, token)
