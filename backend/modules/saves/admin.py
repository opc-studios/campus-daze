"""
Save admin configuration.
"""
from django.contrib import admin
from .models import SaveSlot, SaveData

@admin.register(SaveSlot)
class SaveSlotAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'slot_number', 'created_at', 'updated_at']
    list_filter = ['user']

@admin.register(SaveData)
class SaveDataAdmin(admin.ModelAdmin):
    list_display = ['save_slot', 'data_key', 'saved_at']
    list_filter = ['save_slot']
