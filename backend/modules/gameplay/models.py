"""
Gameplay models: Battle, Task, Reward, RestRecord.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

class Battle(models.Model):
    character = models.ForeignKey('characters.Character', on_delete=models.CASCADE, related_name='battles')
    enemy_id = models.IntegerField()
    result = models.IntegerField(default=0)  # 0=ongoing, 1=win, 2=lose
    turn_count = models.IntegerField(default=0)
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Battle {self.id} - {'Win' if self.result == 1 else 'Lose' if self.result == 2 else 'Ongoing'}"

class Task(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    type = models.IntegerField()  # 1=main, 2=side
    difficulty = models.IntegerField(default=1)
    order = models.IntegerField()
    required_level = models.IntegerField(default=1)
    objectives = models.JSONField()
    reward_id = models.IntegerField(null=True, blank=True)
    next_task_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class TaskProgress(models.Model):
    character = models.ForeignKey('characters.Character', on_delete=models.CASCADE, related_name='task_progress')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='progress')
    progress = models.IntegerField(default=0)
    status = models.IntegerField(default=0)  # 0=not started, 1=in progress, 2=completed
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('character', 'task')

    def __str__(self):
        return f"{self.character.name} - {self.task.name} ({self.status})"

class Reward(models.Model):
    name = models.CharField(max_length=100)
    coin_amount = models.IntegerField(default=0)
    exp_amount = models.IntegerField(default=0)
    cat_food_amount = models.IntegerField(default=0)
    skill_book_id = models.IntegerField(null=True, blank=True)
    equipment_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    condition_type = models.CharField(max_length=50)
    condition_value = models.IntegerField()
    reward_id = models.IntegerField(null=True, blank=True)
    order = models.IntegerField()

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class CharacterAchievement(models.Model):
    character = models.ForeignKey('characters.Character', on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='character_achievements')
    progress = models.IntegerField(default=0)
    unlocked = models.BooleanField(default=False)
    unlocked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('character', 'achievement')

class RestRecord(models.Model):
    character = models.ForeignKey('characters.Character', on_delete=models.CASCADE, related_name='rest_records')
    start_time = models.DateTimeField(default=timezone.now)
    end_time = models.DateTimeField(null=True, blank=True)
    coins_earned = models.IntegerField(default=0)
    exp_earned = models.IntegerField(default=0)
    cat_food_earned = models.IntegerField(default=0)

    def __str__(self):
        return f"Rest {self.id} - {self.character.name}"
