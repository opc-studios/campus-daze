"""
Stage system models.
"""
from django.db import models
from django.conf import settings

class Stage(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    chapter = models.ForeignKey('chapters.Chapter', on_delete=models.CASCADE, related_name='stages')
    order = models.IntegerField()
    required_level = models.IntegerField(default=1)
    enemy_ids = models.JSONField(default=list)
    boss_id = models.IntegerField(null=True, blank=True)
    reward_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['chapter', 'order']
        unique_together = ('chapter', 'order')

    def __str__(self):
        return f"{self.chapter.name} - {self.name}"

class Enemy(models.Model):
    name = models.CharField(max_length=100)
    area = models.ForeignKey('maps.Area', on_delete=models.CASCADE, related_name='enemies', null=True, blank=True)
    level = models.IntegerField(default=1)
    hp = models.IntegerField(default=100)
    max_hp = models.IntegerField(default=100)
    attack = models.IntegerField(default=10)
    defense = models.IntegerField(default=5)
    exp_reward = models.IntegerField(default=50)
    coin_reward = models.IntegerField(default=20)
    is_boss = models.BooleanField(default=False)
    sprite_url = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Lv.{self.level})"

class StageProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stage_progress')
    stage = models.ForeignKey(Stage, on_delete=models.CASCADE, related_name='progress')
    completed = models.BooleanField(default=False)
    best_score = models.IntegerField(default=0)
    attempts = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'stage')

    def __str__(self):
        return f"{self.user} - {self.stage.name} ({'completed' if self.completed else 'in progress'})"
