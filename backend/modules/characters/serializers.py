"""
Character serializers.
"""
from rest_framework import serializers
from .models import Character, CharacterTemplate, Profession, Equipment, Skill

class CharacterTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CharacterTemplate
        fields = '__all__'

class ProfessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profession
        fields = '__all__'

class CharacterSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    profession_name = serializers.CharField(source='profession.name', read_only=True)

    class Meta:
        model = Character
        fields = ['id', 'name', 'template', 'template_name', 'profession', 'profession_name',
                  'level', 'exp', 'hp', 'max_hp', 'mp', 'max_mp',
                  'attack', 'defense', 'agility', 'intelligence',
                  'current_form', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CharacterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Character
        fields = ['name', 'template', 'profession']

class EquipmentSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = Equipment
        fields = ['id', 'template', 'template_name', 'level']

class SkillSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)

    class Meta:
        model = Skill
        fields = ['id', 'template', 'template_name', 'level', 'cooldown_remaining']
