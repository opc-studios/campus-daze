"""
Battle engine for combat logic.
"""
from .models import Battle

class BattleEngine:
    def __init__(self, battle):
        self.battle = battle
        self.character = battle.character
        self.enemy_id = battle.enemy_id

    def calculate_damage(self, attacker_attack, defender_defense):
        base_damage = max(1, attacker_attack - defender_defense)
        return base_damage

    def process_turn(self, action_type, **kwargs):
        if action_type == 'attack':
            damage = self.calculate_damage(self.character.attack, 5)
            return {'damage': damage, 'type': 'attack'}
        elif action_type == 'skill':
            skill_damage = kwargs.get('damage', 20)
            return {'damage': skill_damage, 'type': 'skill'}
        return {'damage': 0, 'type': 'unknown'}
