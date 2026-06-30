"""
Test settings with MySQL fallback to SQLite.
"""
from .base import *

DEBUG = True
ALLOWED_HOSTS = ['*']

try:
    import pymysql
    pymysql.install_as_MySQLdb()
    from django.db import connections
    connections['default'].ensure_connection()
except Exception:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
