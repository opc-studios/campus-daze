from django.db import models

class Reward(models.Model):
    name = models.CharField(max_length=50)
    coin_amount = models.IntegerField(default=0)
    exp_amount = models.IntegerField(default=0)
    cat_food_amount = models.IntegerField(default=0)
    skill_book_id = models.IntegerField(null=True)
    equipment_id = models.IntegerField(null=True)
    
    def __str__(self):
        return self.name

class Achievement(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    condition_type = models.IntegerField()
    condition_value = models.IntegerField()
    reward_id = models.IntegerField(null=True)
    order = models.IntegerField()
    
    def __str__(self):
        return self.name

class CharacterAchievement(models.Model):
    character = models.ForeignKey('characters.GameCharacter', on_delete=models.CASCADE)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    progress = models.IntegerField(default=0)
    unlocked = models.IntegerField(default=0)
    unlocked_at = models.DateTimeField(null=True)
    
    def __str__(self):
        return f"{self.character.name} - {self.achievement.name}"