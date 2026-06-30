"""
Database fallback utilities.
"""
from django.db import connections
from django.db.utils import OperationalError

def check_mysql_connection():
    try:
        connection = connections['default']
        connection.ensure_connection()
        return True
    except OperationalError:
        return False
