"""
Dialogue serializers.
"""
from rest_framework import serializers
from .models import NPC, Dialogue, DialogueChoice, NPCAffinity

class DialogueChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DialogueChoice
        fields = ['id', 'choice_text', 'next_dialogue_id', 'affinity_change']

class DialogueSerializer(serializers.ModelSerializer):
    choice_set = DialogueChoiceSerializer(many=True, read_only=True)

    class Meta:
        model = Dialogue
        fields = ['id', 'order', 'text', 'choices', 'next_dialogue_id', 'reward_id', 'choice_set']

class NPCSerializer(serializers.ModelSerializer):
    class Meta:
        model = NPC
        fields = ['id', 'name', 'area', 'avatar_url', 'affinity', 'dialogues_completed']

class NPCAffinitySerializer(serializers.ModelSerializer):
    npc_name = serializers.CharField(source='npc.name', read_only=True)

    class Meta:
        model = NPCAffinity
        fields = ['id', 'npc', 'npc_name', 'affinity', 'dialogues_completed', 'last_interaction']
