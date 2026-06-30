"""
Map business logic services.
"""
from .models import Area

def unlock_area(area_id):
    try:
        area = Area.objects.get(id=area_id)
        area.unlocked = True
        area.save()
        return area
    except Area.DoesNotExist:
        return None

def update_exploration(area_id, percent):
    try:
        area = Area.objects.get(id=area_id)
        area.exploration_percent = min(100, area.exploration_percent + percent)
        area.save()
        return area
    except Area.DoesNotExist:
        return None
