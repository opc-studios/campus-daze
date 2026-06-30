"""
Save serializers.
"""
from rest_framework import serializers
from .models import SaveSlot, SaveData

class SaveDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaveData
        fields = ['id', 'data_key', 'data_value', 'saved_at']

class SaveSlotSerializer(serializers.ModelSerializer):
    save_data = SaveDataSerializer(many=True, read_only=True)

    class Meta:
        model = SaveSlot
        fields = ['id', 'name', 'slot_number', 'created_at', 'updated_at', 'save_data']
