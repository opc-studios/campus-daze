"""
Save business logic services.
"""
from .models import SaveSlot, SaveData
from django.utils import timezone

def create_save_slot(user, name):
    slot_number = user.save_slots.count() + 1
    slot = SaveSlot.objects.create(
        user=user,
        name=name,
        slot_number=slot_number
    )
    return slot

def save_data_to_slot(slot, data_key, data_value):
    save_data, created = SaveData.objects.update_or_create(
        save_slot=slot,
        data_key=data_key,
        defaults={'data_value': data_value, 'saved_at': timezone.now()}
    )
    return save_data

def load_data_from_slot(slot, data_key):
    try:
        return SaveData.objects.get(save_slot=slot, data_key=data_key)
    except SaveData.DoesNotExist:
        return None
