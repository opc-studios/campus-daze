from django.db import models

class RestRecord(models.Model):
    character = models.ForeignKey('characters.GameCharacter', on_delete=models.CASCADE)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True)
    coins_earned = models.IntegerField(default=0)
    exp_earned = models.IntegerField(default=0)
    cat_food_earned = models.IntegerField(default=0)
    
    def __str__(self):
        return f"{self.character.name} - {self.start_time}"