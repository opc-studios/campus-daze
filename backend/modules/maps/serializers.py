"""
Map serializers.
"""
from rest_framework import serializers
from .models import Area, MapTile, MapObject

class AreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Area
        fields = '__all__'

class MapTileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapTile
        fields = '__all__'

class MapObjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = MapObject
        fields = '__all__'
