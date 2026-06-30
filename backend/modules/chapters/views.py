"""
Chapter API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import ChapterSerializer, SceneSerializer, ChapterProgressSerializer
from .models import Chapter, ChapterProgress, Scene
from django.utils import timezone

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_chapters(request):
    chapters = Chapter.objects.all()
    return Response(ChapterSerializer(chapters, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chapter(request, chapter_id):
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        return Response(ChapterSerializer(chapter).data)
    except Chapter.DoesNotExist:
        return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chapter_progress(request):
    progress = ChapterProgress.objects.filter(user=request.user)
    return Response(ChapterProgressSerializer(progress, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def advance_scene(request, chapter_id):
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        progress, _ = ChapterProgress.objects.get_or_create(user=request.user, chapter=chapter)
        scenes = list(chapter.scenes.all())
        if not scenes:
            return Response({'error': 'No scenes in chapter'}, status=status.HTTP_400_BAD_REQUEST)
        if progress.current_scene:
            current_idx = next((i for i, s in enumerate(scenes) if s.id == progress.current_scene.id), -1)
            next_idx = current_idx + 1
        else:
            next_idx = 0
        if next_idx >= len(scenes):
            progress.completed = True
            progress.completed_at = timezone.now()
            progress.save()
            return Response({'status': 'chapter_completed', 'progress': ChapterProgressSerializer(progress).data})
        progress.current_scene = scenes[next_idx]
        progress.save()
        return Response({
            'scene': SceneSerializer(scenes[next_idx]).data,
            'progress': ChapterProgressSerializer(progress).data
        })
    except Chapter.DoesNotExist:
        return Response({'error': 'Chapter not found'}, status=status.HTTP_404_NOT_FOUND)
