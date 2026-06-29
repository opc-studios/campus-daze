from django.db import models

class Enemy(models.Model):
    area = models.ForeignKey('areas.Area', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    level = models.IntegerField()
    hp = models.IntegerField()
    max_hp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()
    exp_reward = models.IntegerField()
    coin_reward = models.IntegerField()
    is_boss = models.IntegerField(default=0)
    sprite_url = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name