"""
Save API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import SaveSlotSerializer, SaveDataSerializer
from .models import SaveSlot, SaveData
from .services import create_save_slot, save_data_to_slot, load_data_from_slot

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_save_slots(request):
    slots = SaveSlot.objects.filter(user=request.user)
    return Response(SaveSlotSerializer(slots, many=True).data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_slot(request):
    name = request.data.get('name', f"Slot {request.user.save_slots.count() + 1}")
    slot = create_save_slot(request.user, name)
    return Response(SaveSlotSerializer(slot).data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_slot(request, slot_id):
    try:
        slot = SaveSlot.objects.get(id=slot_id, user=request.user)
        return Response(SaveSlotSerializer(slot).data)
    except SaveSlot.DoesNotExist:
        return Response({'error': 'Save slot not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_slot(request, slot_id):
    try:
        slot = SaveSlot.objects.get(id=slot_id, user=request.user)
        slot.delete()
        return Response({'message': 'Save slot deleted'}, status=status.HTTP_204_NO_CONTENT)
    except SaveSlot.DoesNotExist:
        return Response({'error': 'Save slot not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_data(request, slot_id):
    data_key = request.data.get('key')
    data_value = request.data.get('value')
    if not data_key:
        return Response({'error': 'Data key required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        slot = SaveSlot.objects.get(id=slot_id, user=request.user)
        save_data_to_slot(slot, data_key, data_value)
        return Response({'message': 'Data saved'}, status=status.HTTP_201_CREATED)
    except SaveSlot.DoesNotExist:
        return Response({'error': 'Save slot not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def load_data(request, slot_id, data_key):
    try:
        slot = SaveSlot.objects.get(id=slot_id, user=request.user)
        data = load_data_from_slot(slot, data_key)
        if data:
            return Response(SaveDataSerializer(data).data)
        return Response({'error': 'Data not found'}, status=status.HTTP_404_NOT_FOUND)
    except SaveSlot.DoesNotExist:
        return Response({'error': 'Save slot not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def load_all_data(request, slot_id):
    try:
        slot = SaveSlot.objects.get(id=slot_id, user=request.user)
        data_list = slot.save_data.all()
        return Response(SaveDataSerializer(data_list, many=True).data)
    except SaveSlot.DoesNotExist:
        return Response({'error': 'Save slot not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def auto_save(request):
    game_state = request.data.get('game_state')
    if not game_state:
        return Response({'error': 'game_state required'}, status=status.HTTP_400_BAD_REQUEST)
    slot, _ = SaveSlot.objects.get_or_create(
        user=request.user,
        slot_number=0,
        defaults={'name': '自动存档'}
    )
    save_data_to_slot(slot, 'auto_save', game_state)
    return Response({'message': '自动存档成功', 'slot_id': slot.id}, status=status.HTTP_200_OK)
