"""
Character business logic services.
"""
from .models import Character

def create_character(user, name, template, profession):
    character = Character.objects.create(
        user=user,
        name=name,
        template=template,
        profession=profession,
        hp=template.base_hp,
        max_hp=template.base_hp,
        mp=50,
        max_mp=50,
        attack=template.base_attack,
        defense=template.base_defense,
        agility=template.base_agility,
        intelligence=template.base_intelligence
    )
    return character

def update_character_stats(character, update_data):
    allowed_fields = ['level', 'exp', 'hp', 'max_hp', 'mp', 'max_mp',
                      'attack', 'defense', 'agility', 'intelligence']
    for field in allowed_fields:
        if field in update_data:
            setattr(character, field, update_data[field])
    character.save()
    return character
