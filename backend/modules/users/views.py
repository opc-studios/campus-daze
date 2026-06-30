"""
User API views.
"""
import secrets
from datetime import datetime, timedelta
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import User
from .serializers import (
    UserRegisterSerializer, UserLoginSerializer, UserSerializer,
    TokenSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
)
from .services import create_tokens, refresh_access_token

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = create_tokens(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        user = authenticate(username=username, password=password)
        if user:
            tokens = create_tokens(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': tokens
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_token(request):
    refresh_token = request.data.get('refresh_token')
    if not refresh_token:
        return Response({'error': 'Refresh token required'}, status=status.HTTP_400_BAD_REQUEST)
    new_token = refresh_access_token(refresh_token)
    if new_token:
        return Response({'access_token': new_token, 'token_type': 'Bearer'})
    return Response({'error': 'Invalid refresh token'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    return Response(UserSerializer(request.user).data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_user(request):
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        username = serializer.validated_data['username']
        try:
            user = User.objects.get(username=username)
            reset_token = secrets.token_urlsafe(32)
            user.reset_token = reset_token
            user.reset_token_created_at = timezone.now()
            user.save(update_fields=['reset_token', 'reset_token_created_at'])
            return Response({
                'reset_token': reset_token,
                'message': '重置令牌已生成，请在24小时内使用'
            })
        except User.DoesNotExist:
            return Response({'error': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        reset_token = serializer.validated_data['reset_token']
        new_password = serializer.validated_data['new_password']
        try:
            user = User.objects.get(reset_token=reset_token)
            if not user.reset_token_created_at:
                return Response({'error': '重置令牌无效'}, status=status.HTTP_400_BAD_REQUEST)
            if timezone.now() - user.reset_token_created_at > timedelta(hours=24):
                return Response({'error': '重置令牌已过期'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.reset_token = None
            user.reset_token_created_at = None
            user.save(update_fields=['password', 'reset_token', 'reset_token_created_at'])
            return Response({'message': '密码已重置成功'})
        except User.DoesNotExist:
            return Response({'error': '重置令牌无效'}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
