"""
Gameplay admin configuration.
"""
from django.contrib import admin
from .models import Battle, Task, TaskProgress, Reward, Achievement, CharacterAchievement, RestRecord

@admin.register(Battle)
class BattleAdmin(admin.ModelAdmin):
    list_display = ['id', 'character', 'enemy_id', 'result', 'turn_count', 'start_time']
    list_filter = ['result']

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'difficulty', 'order', 'required_level']
    list_filter = ['type', 'difficulty']

@admin.register(TaskProgress)
class TaskProgressAdmin(admin.ModelAdmin):
    list_display = ['character', 'task', 'progress', 'status', 'completed_at']
    list_filter = ['status']

@admin.register(Reward)
class RewardAdmin(admin.ModelAdmin):
    list_display = ['name', 'coin_amount', 'exp_amount', 'cat_food_amount']

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['name', 'condition_type', 'condition_value', 'order']

@admin.register(CharacterAchievement)
class CharacterAchievementAdmin(admin.ModelAdmin):
    list_display = ['character', 'achievement', 'progress', 'unlocked', 'unlocked_at']
    list_filter = ['unlocked']

@admin.register(RestRecord)
class RestRecordAdmin(admin.ModelAdmin):
    list_display = ['character', 'start_time', 'end_time', 'coins_earned', 'exp_earned']
