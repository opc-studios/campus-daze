from django.db import models

class CharacterTemplate(models.Model):
    name = models.CharField(max_length=50)
    cat_type = models.CharField(max_length=50)
    personality = models.CharField(max_length=100)
    battle_role = models.CharField(max_length=50)
    base_hp = models.IntegerField()
    base_attack = models.IntegerField()
    base_defense = models.IntegerField()
    base_agility = models.IntegerField()
    base_intelligence = models.IntegerField()
    sprite_url = models.CharField(max_length=255)
    
    def __str__(self):
        return self.name

class Profession(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    skill_bonus = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class GameCharacter(models.Model):
    user = models.ForeignKey('users.User', on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    character_template = models.ForeignKey(CharacterTemplate, on_delete=models.CASCADE)
    profession = models.ForeignKey(Profession, on_delete=models.CASCADE)
    level = models.IntegerField(default=1)
    exp = models.IntegerField(default=0)
    hp = models.IntegerField()
    max_hp = models.IntegerField()
    mp = models.IntegerField()
    max_mp = models.IntegerField()
    attack = models.IntegerField()
    defense = models.IntegerField()
    agility = models.IntegerField()
    intelligence = models.IntegerField()
    current_form = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class EquipmentTemplate(models.Model):
    name = models.CharField(max_length=50)
    slot = models.IntegerField()
    rarity = models.IntegerField()
    attack_bonus = models.IntegerField(default=0)
    defense_bonus = models.IntegerField(default=0)
    hp_bonus = models.IntegerField(default=0)
    mp_bonus = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name

class Equipment(models.Model):
    character = models.ForeignKey(GameCharacter, on_delete=models.CASCADE)
    slot = models.IntegerField()
    equipment_template = models.ForeignKey(EquipmentTemplate, on_delete=models.CASCADE)
    level = models.IntegerField(default=1)
    
    def __str__(self):
        return f"{self.character.name} - {self.equipment_template.name}"

class SkillTemplate(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    damage = models.IntegerField()
    mp_cost = models.IntegerField()
    cooldown = models.IntegerField()
    range = models.IntegerField()
    skill_type = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name

class Skill(models.Model):
    character = models.ForeignKey(GameCharacter, on_delete=models.CASCADE)
    skill_template = models.ForeignKey(SkillTemplate, on_delete=models.CASCADE)
    level = models.IntegerField(default=1)
    cooldown_remaining = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.character.name} - {self.skill_template.name}"