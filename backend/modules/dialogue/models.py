"""
Dialogue system models.
"""
from django.db import models
from django.conf import settings

class NPC(models.Model):
    name = models.CharField(max_length=100)
    area = models.ForeignKey('maps.Area', on_delete=models.CASCADE, related_name='npcs')
    avatar_url = models.CharField(max_length=255)
    affinity = models.IntegerField(default=0)
    dialogues_completed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

class Dialogue(models.Model):
    npc = models.ForeignKey(NPC, on_delete=models.CASCADE, related_name='dialogues')
    order = models.IntegerField()
    text = models.TextField()
    choices = models.JSONField(null=True, blank=True)
    next_dialogue_id = models.IntegerField(null=True, blank=True)
    reward_id = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['order']
        unique_together = ('npc', 'order')

    def __str__(self):
        return f"{self.npc.name} - Dialogue {self.order}"

class DialogueChoice(models.Model):
    dialogue = models.ForeignKey(Dialogue, on_delete=models.CASCADE, related_name='choice_set')
    choice_text = models.CharField(max_length=255)
    next_dialogue_id = models.IntegerField(null=True, blank=True)
    affinity_change = models.IntegerField(default=0)

    def __str__(self):
        return f"Choice: {self.choice_text[:30]}"

class NPCAffinity(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='npc_affinities')
    npc = models.ForeignKey(NPC, on_delete=models.CASCADE, related_name='user_affinities')
    affinity = models.IntegerField(default=0)
    dialogues_completed = models.IntegerField(default=0)
    last_interaction = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'npc')

    def __str__(self):
        return f"{self.user} - {self.npc.name} (Affinity: {self.affinity})"
