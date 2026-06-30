"""
Character management models.
"""
from django.db import models
from django.conf import settings

class CharacterTemplate(models.Model):
    name = models.CharField(max_length=50)
    cat_type = models.CharField(max_length=50)
    personality = models.CharField(max_length=100)
    battle_role = models.CharField(max_length=50)
    base_hp = models.IntegerField(default=100)
    base_attack = models.IntegerField(default=10)
    base_defense = models.IntegerField(default=5)
    base_agility = models.IntegerField(default=5)
    base_intelligence = models.IntegerField(default=5)
    sprite_url = models.CharField(max_length=255)

    def __str__(self):
        return self.name

class Profession(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    skill_bonus = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.name

class Character(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='characters')
    name = models.CharField(max_length=50)
    template = models.ForeignKey(CharacterTemplate, on_delete=models.PROTECT, related_name='characters')
    profession = models.ForeignKey(Profession, on_delete=models.PROTECT, related_name='characters')
    level = models.IntegerField(default=1)
    exp = models.IntegerField(default=0)
    hp = models.IntegerField(default=100)
    max_hp = models.IntegerField(default=100)
    mp = models.IntegerField(default=50)
    max_mp = models.IntegerField(default=50)
    attack = models.IntegerField(default=10)
    defense = models.IntegerField(default=5)
    agility = models.IntegerField(default=5)
    intelligence = models.IntegerField(default=5)
    current_form = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Lv.{self.level})"

class EquipmentTemplate(models.Model):
    name = models.CharField(max_length=100)
    slot = models.IntegerField()
    rarity = models.IntegerField(default=1)
    attack_bonus = models.IntegerField(default=0)
    defense_bonus = models.IntegerField(default=0)
    hp_bonus = models.IntegerField(default=0)
    mp_bonus = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Equipment(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='equipment')
    template = models.ForeignKey(EquipmentTemplate, on_delete=models.PROTECT, related_name='instances')
    level = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.template.name} (Lv.{self.level})"

class SkillTemplate(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    damage = models.IntegerField(default=0)
    mp_cost = models.IntegerField(default=10)
    cooldown = models.IntegerField(default=0)
    range = models.IntegerField(default=1)
    skill_type = models.CharField(max_length=50)

    def __str__(self):
        return self.name

class Skill(models.Model):
    character = models.ForeignKey(Character, on_delete=models.CASCADE, related_name='skills')
    template = models.ForeignKey(SkillTemplate, on_delete=models.PROTECT, related_name='instances')
    level = models.IntegerField(default=1)
    cooldown_remaining = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.template.name} (Lv.{self.level})"
