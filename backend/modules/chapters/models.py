"""
Chapter management models.
"""
from django.db import models
from django.conf import settings

class Chapter(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.IntegerField(unique=True)
    required_level = models.IntegerField(default=1)
    unlocked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class Scene(models.Model):
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='scenes')
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    order = models.IntegerField()
    dialogue_id = models.IntegerField(null=True, blank=True)
    background_url = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ('chapter', 'order')

    def __str__(self):
        return f"{self.chapter.name} - {self.name}"

class ChapterProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chapter_progress')
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE, related_name='progress')
    current_scene = models.ForeignKey(Scene, on_delete=models.SET_NULL, null=True, blank=True)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'chapter')

    def __str__(self):
        return f"{self.user} - {self.chapter} ({'completed' if self.completed else 'in progress'})"
