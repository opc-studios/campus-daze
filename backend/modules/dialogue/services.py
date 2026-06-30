"""
Dialogue business logic services.
"""
from .models import Dialogue, NPCAffinity, DialogueChoice
from .serializers import DialogueSerializer

def get_next_dialogue(npc, current_dialogue):
    if current_dialogue.next_dialogue_id:
        try:
            next_dialogue = Dialogue.objects.get(id=current_dialogue.next_dialogue_id, npc=npc)
            return {'dialogue': DialogueSerializer(next_dialogue).data}
        except Dialogue.DoesNotExist:
            pass
    return {'dialogue': None, 'message': 'Dialogue ended'}

def process_dialogue_choice(user, npc, dialogue, choice):
    affinity, _ = NPCAffinity.objects.get_or_create(
        user=user,
        npc=npc,
        defaults={'affinity': 0, 'dialogues_completed': 0}
    )
    affinity.affinity += choice.affinity_change
    affinity.save()
    if choice.next_dialogue_id:
        try:
            next_dialogue = Dialogue.objects.get(id=choice.next_dialogue_id, npc=npc)
            return {
                'dialogue': DialogueSerializer(next_dialogue).data,
                'affinity_change': choice.affinity_change,
                'current_affinity': affinity.affinity
            }
        except Dialogue.DoesNotExist:
            pass
    affinity.dialogues_completed += 1
    affinity.save()
    return {
        'dialogue': None,
        'affinity_change': choice.affinity_change,
        'current_affinity': affinity.affinity,
        'message': 'Dialogue ended'
    }

def update_affinity(user, npc, change):
    affinity, _ = NPCAffinity.objects.get_or_create(
        user=user,
        npc=npc,
        defaults={'affinity': 0, 'dialogues_completed': 0}
    )
    affinity.affinity += change
    affinity.save()
    return affinity
