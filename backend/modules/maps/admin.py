"""
Map admin configuration.
"""
from django.contrib import admin
from .models import Area, MapTile, MapObject

@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    list_display = ['name', 'unlocked', 'exploration_percent', 'order']
    list_filter = ['unlocked']

@admin.register(MapTile)
class MapTileAdmin(admin.ModelAdmin):
    list_display = ['area', 'x', 'y', 'tile_type', 'walkable']
    list_filter = ['area', 'walkable']

@admin.register(MapObject)
class MapObjectAdmin(admin.ModelAdmin):
    list_display = ['name', 'area', 'object_type', 'x', 'y']
    list_filter = ['area', 'object_type']
