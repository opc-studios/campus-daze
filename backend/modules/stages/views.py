"""
Stage API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import StageSerializer, EnemySerializer, StageProgressSerializer
from .models import Stage, Enemy, StageProgress
from .services import complete_stage
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_stages(request):
    chapter_id = request.query_params.get('chapter_id')
    stages = Stage.objects.all()
    if chapter_id:
        stages = stages.filter(chapter_id=chapter_id)
    return Response(StageSerializer(stages, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stage(request, stage_id):
    try:
        stage = Stage.objects.get(id=stage_id)
        return Response(StageSerializer(stage).data)
    except Stage.DoesNotExist:
        return Response({'error': 'Stage not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_enemies(request):
    area_id = request.query_params.get('area_id')
    is_boss = request.query_params.get('is_boss')
    enemies = Enemy.objects.all()
    if area_id:
        enemies = enemies.filter(area_id=area_id)
    if is_boss is not None:
        enemies = enemies.filter(is_boss=is_boss.lower() == 'true')
    return Response(EnemySerializer(enemies, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_enemy(request, enemy_id):
    try:
        enemy = Enemy.objects.get(id=enemy_id)
        return Response(EnemySerializer(enemy).data)
    except Enemy.DoesNotExist:
        return Response({'error': 'Enemy not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stage_progress(request):
    progress = StageProgress.objects.filter(user=request.user)
    return Response(StageProgressSerializer(progress, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_stage_view(request, stage_id):
    score = request.data.get('score', 0)
    try:
        stage = Stage.objects.get(id=stage_id)
        progress = complete_stage(request.user, stage, score)
        return Response(StageProgressSerializer(progress).data)
    except Stage.DoesNotExist:
        return Response({'error': 'Stage not found'}, status=status.HTTP_404_NOT_FOUND)
