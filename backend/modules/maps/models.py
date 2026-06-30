"""
Map management models.
"""
from django.db import models

class Area(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    unlocked = models.BooleanField(default=False)
    exploration_percent = models.IntegerField(default=0)
    map_url = models.CharField(max_length=255)
    order = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class MapTile(models.Model):
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='tiles')
    x = models.IntegerField()
    y = models.IntegerField()
    tile_type = models.CharField(max_length=50)
    walkable = models.BooleanField(default=True)
    event_id = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('area', 'x', 'y')

    def __str__(self):
        return f"{self.area.name} ({self.x},{self.y})"

class MapObject(models.Model):
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='map_objects')
    name = models.CharField(max_length=100)
    object_type = models.CharField(max_length=50)
    x = models.IntegerField()
    y = models.IntegerField()
    sprite_url = models.CharField(max_length=255)
    interactable = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} in {self.area.name}"
