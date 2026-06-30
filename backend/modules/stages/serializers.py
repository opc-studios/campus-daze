"""
Stage serializers.
"""
from rest_framework import serializers
from .models import Stage, Enemy, StageProgress

class EnemySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enemy
        fields = '__all__'

class StageSerializer(serializers.ModelSerializer):
    enemies = serializers.SerializerMethodField()
    boss = serializers.SerializerMethodField()

    class Meta:
        model = Stage
        fields = ['id', 'name', 'description', 'chapter', 'order', 'required_level',
                  'enemy_ids', 'boss_id', 'reward_id', 'enemies', 'boss']

    def get_enemies(self, obj):
        if obj.enemy_ids:
            enemies = Enemy.objects.filter(id__in=obj.enemy_ids)
            return EnemySerializer(enemies, many=True).data
        return []

    def get_boss(self, obj):
        if obj.boss_id:
            try:
                boss = Enemy.objects.get(id=obj.boss_id)
                return EnemySerializer(boss).data
            except Enemy.DoesNotExist:
                return None
        return None

class StageProgressSerializer(serializers.ModelSerializer):
    stage_name = serializers.CharField(source='stage.name', read_only=True)

    class Meta:
        model = StageProgress
        fields = ['id', 'stage', 'stage_name', 'completed', 'best_score', 'attempts', 'completed_at']
