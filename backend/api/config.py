"""
FastAPI configuration.
"""
import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    JWT_SECRET_KEY: str = os.environ.get('JWT_SECRET_KEY', 'django-insecure-change-me')
    JWT_ALGORITHM: str = 'HS256'

settings = Settings()
