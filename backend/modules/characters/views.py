"""
Character API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import (
    CharacterSerializer, CharacterCreateSerializer,
    CharacterTemplateSerializer, ProfessionSerializer,
    EquipmentSerializer, SkillSerializer
)
from .services import create_character, update_character_stats

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_characters(request):
    characters = request.user.characters.all()
    serializer = CharacterSerializer(characters, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_character_view(request):
    serializer = CharacterCreateSerializer(data=request.data)
    if serializer.is_valid():
        character = create_character(
            user=request.user,
            name=serializer.validated_data['name'],
            template=serializer.validated_data['template'],
            profession=serializer.validated_data['profession']
        )
        return Response(CharacterSerializer(character).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_character(request, character_id):
    try:
        character = request.user.characters.get(id=character_id)
        return Response(CharacterSerializer(character).data)
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_character(request, character_id):
    try:
        character = request.user.characters.get(id=character_id)
        update_data = request.data
        character = update_character_stats(character, update_data)
        return Response(CharacterSerializer(character).data)
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_templates(request):
    templates = CharacterTemplate.objects.all()
    return Response(CharacterTemplateSerializer(templates, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_professions(request):
    professions = Profession.objects.all()
    return Response(ProfessionSerializer(professions, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_character_equipment(request, character_id):
    try:
        character = request.user.characters.get(id=character_id)
        equipment = character.equipment.all()
        return Response(EquipmentSerializer(equipment, many=True).data)
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_character_skills(request, character_id):
    try:
        character = request.user.characters.get(id=character_id)
        skills = character.skills.all()
        return Response(SkillSerializer(skills, many=True).data)
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transform_form(request, character_id):
    try:
        character = request.user.characters.get(id=character_id)
        form_type = request.data.get('form_type', 0)
        character.current_form = form_type
        character.save()
        return Response(CharacterSerializer(character).data)
    except Character.DoesNotExist:
        return Response({'error': 'Character not found'}, status=status.HTTP_404_NOT_FOUND)

from .models import Character, CharacterTemplate, Profession
