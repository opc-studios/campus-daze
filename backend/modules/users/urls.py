"""
User URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('refresh/', views.refresh_token, name='refresh-token'),
    path('me/', views.get_current_user, name='current-user'),
    path('me/update/', views.update_user, name='update-user'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/', views.reset_password, name='reset-password'),
]
