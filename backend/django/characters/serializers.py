from rest_framework import serializers
from .models import GameCharacter, CharacterTemplate, Profession, Equipment, Skill

class CharacterTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterTemplate
        fields = '__all__'

class ProfessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profession
        fields = '__all__'

class CharacterSerializer(serializers.ModelSerializer):
    class Meta:
        model = GameCharacter
        fields = '__all__'

class EquipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Equipment
        fields = '__all__'

class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'