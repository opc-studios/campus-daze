"""
Chapter business logic services.
"""
from .models import Chapter, ChapterProgress
from django.utils import timezone

def unlock_chapter(chapter_id):
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        chapter.unlocked = True
        chapter.save()
        return chapter
    except Chapter.DoesNotExist:
        return None

def complete_chapter(user, chapter_id):
    try:
        chapter = Chapter.objects.get(id=chapter_id)
        progress, _ = ChapterProgress.objects.get_or_create(user=user, chapter=chapter)
        progress.completed = True
        progress.completed_at = timezone.now()
        progress.save()
        return progress
    except Chapter.DoesNotExist:
        return None
