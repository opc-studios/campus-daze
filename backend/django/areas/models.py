from django.db import models

class Area(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    unlocked = models.IntegerField(default=0)
    exploration_percent = models.IntegerField(default=0)
    map_url = models.CharField(max_length=255)
    order = models.IntegerField()
    
    def __str__(self):
        return self.name