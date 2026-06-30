"""
Stage business logic services.
"""
from .models import StageProgress
from django.utils import timezone

def complete_stage(user, stage, score):
    progress, created = StageProgress.objects.get_or_create(
        user=user,
        stage=stage,
        defaults={'completed': False, 'best_score': 0, 'attempts': 0}
    )
    progress.attempts += 1
    if not progress.completed:
        progress.completed = True
        progress.completed_at = timezone.now()
    if score > progress.best_score:
        progress.best_score = score
    progress.save()
    return progress
