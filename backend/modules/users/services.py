"""
User business logic services.
"""
from common.auth.jwt_handler import create_access_token, create_refresh_token, verify_token

def create_tokens(user):
    payload = {'user_id': user.id, 'email': user.email}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    return {
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer'
    }

def refresh_access_token(refresh_token_str):
    payload = verify_token(refresh_token_str)
    if not payload or payload.get('type') != 'refresh':
        return None
    from .models import User
    try:
        user = User.objects.get(id=payload.get('user_id'))
        new_payload = {'user_id': user.id, 'email': user.email}
        return create_access_token(new_payload)
    except User.DoesNotExist:
        return None
