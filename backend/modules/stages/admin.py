"""
Stage admin configuration.
"""
from django.contrib import admin
from .models import Stage, Enemy, StageProgress

@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ['name', 'chapter', 'order', 'required_level']
    list_filter = ['chapter']

@admin.register(Enemy)
class EnemyAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'hp', 'attack', 'is_boss']
    list_filter = ['is_boss', 'area']

@admin.register(StageProgress)
class StageProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'stage', 'completed', 'best_score', 'attempts']
    list_filter = ['completed', 'stage']
