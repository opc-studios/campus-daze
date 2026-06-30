"""
Dialogue API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import NPCSerializer, DialogueSerializer, NPCAffinitySerializer
from .models import NPC, Dialogue, NPCAffinity, DialogueChoice
from .services import get_next_dialogue, process_dialogue_choice, update_affinity

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_npcs(request):
    area_id = request.query_params.get('area_id')
    npcs = NPC.objects.all()
    if area_id:
        npcs = npcs.filter(area_id=area_id)
    return Response(NPCSerializer(npcs, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_npc(request, npc_id):
    try:
        npc = NPC.objects.get(id=npc_id)
        return Response(NPCSerializer(npc).data)
    except NPC.DoesNotExist:
        return Response({'error': 'NPC not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dialogue(request, npc_id):
    try:
        npc = NPC.objects.get(id=npc_id)
        dialogue = npc.dialogues.first()
        if not dialogue:
            return Response({'error': 'No dialogue available'}, status=status.HTTP_404_NOT_FOUND)
        return Response(DialogueSerializer(dialogue).data)
    except NPC.DoesNotExist:
        return Response({'error': 'NPC not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_dialogue(request, npc_id, dialogue_id):
    choice_id = request.data.get('choice_id')
    try:
        npc = NPC.objects.get(id=npc_id)
        dialogue = Dialogue.objects.get(id=dialogue_id, npc=npc)
        if choice_id:
            choice = DialogueChoice.objects.get(id=choice_id, dialogue=dialogue)
            result = process_dialogue_choice(request.user, npc, dialogue, choice)
        else:
            result = get_next_dialogue(npc, dialogue)
        return Response(result)
    except NPC.DoesNotExist:
        return Response({'error': 'NPC not found'}, status=status.HTTP_404_NOT_FOUND)
    except Dialogue.DoesNotExist:
        return Response({'error': 'Dialogue not found'}, status=status.HTTP_404_NOT_FOUND)
    except DialogueChoice.DoesNotExist:
        return Response({'error': 'Choice not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_npc_affinity(request, npc_id):
    try:
        affinity, _ = NPCAffinity.objects.get_or_create(
            user=request.user,
            npc_id=npc_id,
            defaults={'affinity': 0, 'dialogues_completed': 0}
        )
        return Response(NPCAffinitySerializer(affinity).data)
    except NPC.DoesNotExist:
        return Response({'error': 'NPC not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_affinities(request):
    affinities = NPCAffinity.objects.filter(user=request.user)
    return Response(NPCAffinitySerializer(affinities, many=True).data)
