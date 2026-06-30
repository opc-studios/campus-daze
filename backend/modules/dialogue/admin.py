"""
Dialogue admin configuration.
"""
from django.contrib import admin
from .models import NPC, Dialogue, DialogueChoice, NPCAffinity

@admin.register(NPC)
class NPCAdmin(admin.ModelAdmin):
    list_display = ['name', 'area', 'affinity', 'dialogues_completed']
    list_filter = ['area']

@admin.register(Dialogue)
class DialogueAdmin(admin.ModelAdmin):
    list_display = ['npc', 'order', 'next_dialogue_id']
    list_filter = ['npc']

@admin.register(DialogueChoice)
class DialogueChoiceAdmin(admin.ModelAdmin):
    list_display = ['dialogue', 'choice_text', 'affinity_change']
    list_filter = ['dialogue']

@admin.register(NPCAffinity)
class NPCAffinityAdmin(admin.ModelAdmin):
    list_display = ['user', 'npc', 'affinity', 'dialogues_completed', 'last_interaction']
    list_filter = ['npc']
