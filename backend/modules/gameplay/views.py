"""
Gameplay API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    BattleSerializer, TaskSerializer, TaskProgressSerializer,
    RewardSerializer, AchievementSerializer, CharacterAchievementSerializer,
    RestRecordSerializer, EnemySerializer
)
from .models import Battle, Task, TaskProgress, Reward, Achievement, CharacterAchievement, RestRecord
from modules.stages.models import Enemy
from .services import start_battle, process_battle_action, complete_battle, start_rest, end_rest
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_enemies(request):
    enemies = Enemy.objects.all()
    return Response(EnemySerializer(enemies, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_battle_view(request, character_id):
    enemy_id = request.data.get('enemy_id')
    if not enemy_id:
        return Response({'error': 'enemy_id required'}, status=status.HTTP_400_BAD_REQUEST)
    battle = start_battle(character_id, enemy_id)
    if not battle:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(BattleSerializer(battle).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def battle_action(request, battle_id):
    action_type = request.data.get('action')
    try:
        battle = Battle.objects.get(id=battle_id)
        result = process_battle_action(battle, action_type, request.data)
        return Response(result)
    except Battle.DoesNotExist:
        return Response({'error': 'Battle not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def battle_result(request, battle_id):
    try:
        battle = Battle.objects.get(id=battle_id)
        result = complete_battle(battle)
        return Response(result)
    except Battle.DoesNotExist:
        return Response({'error': 'Battle not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_tasks(request):
    task_type = request.query_params.get('type')
    tasks = Task.objects.all()
    if task_type:
        tasks = tasks.filter(type=int(task_type))
    return Response(TaskSerializer(tasks, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_task(request, task_id, character_id):
    try:
        task = Task.objects.get(id=task_id)
        progress, created = TaskProgress.objects.get_or_create(
            character_id=character_id,
            task=task,
            defaults={'status': 1}
        )
        if not created:
            return Response({'error': 'Task already accepted'}, status=status.HTTP_400_BAD_REQUEST)
        return Response(TaskProgressSerializer(progress).data, status=status.HTTP_201_CREATED)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_task_progress(request, task_id, character_id):
    try:
        progress = TaskProgress.objects.get(character_id=character_id, task_id=task_id)
        progress.progress = request.data.get('progress', progress.progress)
        if progress.progress >= 100:
            progress.status = 2
            progress.completed_at = timezone.now()
        progress.save()
        return Response(TaskProgressSerializer(progress).data)
    except TaskProgress.DoesNotExist:
        return Response({'error': 'Task progress not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, task_id, character_id):
    try:
        progress = TaskProgress.objects.get(character_id=character_id, task_id=task_id)
        if progress.status != 2:
            return Response({'error': 'Task not completed'}, status=status.HTTP_400_BAD_REQUEST)
        reward = Reward.objects.get(id=progress.task.reward_id) if progress.task.reward_id else None
        progress.delete()
        return Response({'rewards': RewardSerializer(reward).data if reward else None})
    except TaskProgress.DoesNotExist:
        return Response({'error': 'Task progress not found'}, status=status.HTTP_404_NOT_FOUND)
    except Reward.DoesNotExist:
        return Response({'error': 'Reward not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_rewards(request):
    rewards = Reward.objects.all()
    return Response(RewardSerializer(rewards, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_achievements(request):
    achievements = Achievement.objects.all()
    return Response(AchievementSerializer(achievements, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_character_achievements(request, character_id):
    achievements = CharacterAchievement.objects.filter(character_id=character_id)
    return Response(CharacterAchievementSerializer(achievements, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_rest_view(request, character_id):
    rest = start_rest(character_id)
    if not rest:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(RestRecordSerializer(rest).data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def end_rest_view(request, rest_id):
    rest = end_rest(rest_id)
    if not rest:
        return Response({'error': 'Rest record not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(RestRecordSerializer(rest).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_offline_rewards(request, character_id):
    rests = RestRecord.objects.filter(character_id=character_id, end_time__isnull=True)
    total_coins = sum(r.coins_earned for r in rests)
    total_exp = sum(r.exp_earned for r in rests)
    total_food = sum(r.cat_food_earned for r in rests)
    return Response({
        'coins': total_coins,
        'exp': total_exp,
        'cat_food': total_food
    })
