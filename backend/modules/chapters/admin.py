"""
Chapter admin configuration.
"""
from django.contrib import admin
from .models import Chapter, Scene, ChapterProgress

@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'required_level', 'unlocked']
    list_filter = ['unlocked']

@admin.register(Scene)
class SceneAdmin(admin.ModelAdmin):
    list_display = ['name', 'chapter', 'order']
    list_filter = ['chapter']

@admin.register(ChapterProgress)
class ChapterProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'chapter', 'completed', 'completed_at']
    list_filter = ['completed', 'chapter']
