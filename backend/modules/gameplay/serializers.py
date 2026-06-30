"""
Gameplay serializers.
"""
from rest_framework import serializers
from .models import Battle, Task, TaskProgress, Reward, Achievement, CharacterAchievement, RestRecord
from modules.stages.models import Enemy

class EnemySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enemy
        fields = '__all__'

class BattleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Battle
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class TaskProgressSerializer(serializers.ModelSerializer):
    task_name = serializers.CharField(source='task.name', read_only=True)

    class Meta:
        model = TaskProgress
        fields = ['id', 'task', 'task_name', 'progress', 'status', 'completed_at']

class RewardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reward
        fields = '__all__'

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = '__all__'

class CharacterAchievementSerializer(serializers.ModelSerializer):
    achievement_name = serializers.CharField(source='achievement.name', read_only=True)

    class Meta:
        model = CharacterAchievement
        fields = ['id', 'achievement', 'achievement_name', 'progress', 'unlocked', 'unlocked_at']

class RestRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RestRecord
        fields = '__all__'
