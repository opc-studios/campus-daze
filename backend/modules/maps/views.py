"""
Map API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import AreaSerializer, MapTileSerializer, MapObjectSerializer
from .models import Area

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_areas(request):
    areas = Area.objects.all()
    return Response(AreaSerializer(areas, many=True).data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_area(request, area_id):
    try:
        area = Area.objects.get(id=area_id)
        return Response(AreaSerializer(area).data)
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def explore_area(request, area_id):
    try:
        area = Area.objects.get(id=area_id)
        exploration_gain = 10
        area.exploration_percent = min(100, area.exploration_percent + exploration_gain)
        area.save()
        return Response({
            'area': AreaSerializer(area).data,
            'discovery': 'Found a hidden path!',
            'rewards': {'exp': 50, 'coins': 20}
        })
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_area_tiles(request, area_id):
    try:
        area = Area.objects.get(id=area_id)
        tiles = area.tiles.all()
        return Response(MapTileSerializer(tiles, many=True).data)
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_area_objects(request, area_id):
    try:
        area = Area.objects.get(id=area_id)
        objects = area.objects.all()
        return Response(MapObjectSerializer(objects, many=True).data)
    except Area.DoesNotExist:
        return Response({'error': 'Area not found'}, status=status.HTTP_404_NOT_FOUND)
