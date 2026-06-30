"""
Save system models.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone

class SaveSlot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='save_slots')
    name = models.CharField(max_length=100)
    slot_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'slot_number')
        ordering = ['slot_number']

    def __str__(self):
        return f"{self.user} - Slot {self.slot_number}: {self.name}"

class SaveData(models.Model):
    save_slot = models.ForeignKey(SaveSlot, on_delete=models.CASCADE, related_name='save_data')
    data_key = models.CharField(max_length=100)
    data_value = models.JSONField()
    saved_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('save_slot', 'data_key')

    def __str__(self):
        return f"{self.save_slot} - {self.data_key}"
