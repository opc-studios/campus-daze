"""
Gameplay business logic services.
"""
from .models import Battle, RestRecord
from modules.characters.models import Character
from django.utils import timezone

def start_battle(character_id, enemy_id):
    try:
        character = Character.objects.get(id=character_id)
        battle = Battle.objects.create(
            character=character,
            enemy_id=enemy_id,
            result=0,
            turn_count=0
        )
        return battle
    except Character.DoesNotExist:
        return None

def process_battle_action(battle, action_type, data):
    battle.turn_count += 1
    if action_type == 'attack':
        damage = battle.character.attack
        return {'action': 'attack', 'damage': damage, 'turn': battle.turn_count}
    elif action_type == 'skill':
        skill_id = data.get('skill_id')
        damage = data.get('damage', 20)
        return {'action': 'skill', 'skill_id': skill_id, 'damage': damage, 'turn': battle.turn_count}
    return {'action': action_type, 'turn': battle.turn_count}

def complete_battle(battle):
    battle.end_time = timezone.now()
    battle.result = 1 if battle.turn_count > 0 else 2
    battle.save()
    rewards = {
        'exp': 100 if battle.result == 1 else 0,
        'coins': 50 if battle.result == 1 else 0
    }
    return {
        'battle': {
            'id': battle.id,
            'result': battle.result,
            'turn_count': battle.turn_count
        },
        'rewards': rewards
    }

def start_rest(character_id):
    try:
        character = Character.objects.get(id=character_id)
        rest = RestRecord.objects.create(
            character=character,
            start_time=timezone.now()
        )
        return rest
    except Character.DoesNotExist:
        return None

def end_rest(rest_id):
    try:
        rest = RestRecord.objects.get(id=rest_id)
        rest.end_time = timezone.now()
        duration_hours = (rest.end_time - rest.start_time).total_seconds() / 3600
        rest.coins_earned = int(duration_hours * 10)
        rest.exp_earned = int(duration_hours * 20)
        rest.cat_food_earned = int(duration_hours * 5)
        rest.save()
        return rest
    except RestRecord.DoesNotExist:
        return None
