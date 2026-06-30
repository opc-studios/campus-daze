"""
Chapter serializers.
"""
from rest_framework import serializers
from .models import Chapter, Scene, ChapterProgress

class SceneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scene
        fields = '__all__'

class ChapterSerializer(serializers.ModelSerializer):
    scenes = SceneSerializer(many=True, read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'name', 'description', 'order', 'required_level', 'unlocked', 'scenes']

class ChapterProgressSerializer(serializers.ModelSerializer):
    chapter_name = serializers.CharField(source='chapter.name', read_only=True)

    class Meta:
        model = ChapterProgress
        fields = ['id', 'chapter', 'chapter_name', 'current_scene', 'completed', 'completed_at']
