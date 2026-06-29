from django.db import models

class Task(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=500)
    type = models.IntegerField()
    difficulty = models.IntegerField()
    order = models.IntegerField()
    required_level = models.IntegerField(default=1)
    objectives = models.JSONField()
    reward_id = models.IntegerField(null=True)
    next_task_id = models.IntegerField(null=True)
    
    def __str__(self):
        return self.name

class TaskProgress(models.Model):
    character = models.ForeignKey('characters.GameCharacter', on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    status = models.IntegerField(default=0)
    completed_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return f"{self.character.name} - {self.task.name}"