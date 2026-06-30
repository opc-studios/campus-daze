"""
Character admin configuration.
"""
from django.contrib import admin
from .models import Character, CharacterTemplate, Profession, Equipment, EquipmentTemplate, Skill, SkillTemplate

@admin.register(Character)
class CharacterAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'template', 'profession', 'level', 'created_at']
    list_filter = ['template', 'profession']
    search_fields = ['name', 'user__email']

@admin.register(CharacterTemplate)
class CharacterTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'cat_type', 'battle_role']

@admin.register(Profession)
class ProfessionAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Equipment)
class EquipmentAdmin(admin.ModelAdmin):
    list_display = ['character', 'template', 'level']

@admin.register(EquipmentTemplate)
class EquipmentTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'slot', 'rarity']

@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['character', 'template', 'level']

@admin.register(SkillTemplate)
class SkillTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'skill_type', 'damage', 'mp_cost']
