from django.db import models

class NPC(models.Model):
    area = models.ForeignKey('areas.Area', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    avatar_url = models.CharField(max_length=255)
    affinity = models.IntegerField(default=0)
    dialogues_completed = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name

class Dialogue(models.Model):
    npc = models.ForeignKey(NPC, on_delete=models.CASCADE)
    order = models.IntegerField()
    text = models.TextField()
    choices = models.JSONField()
    next_dialogue_id = models.IntegerField(null=True)
    reward_id = models.IntegerField(null=True)
    
    def __str__(self):
        return f"{self.npc.name} - {self.order}"