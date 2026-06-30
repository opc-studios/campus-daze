"""
File upload API views.
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from common.storage.backends import storage_backend
import uuid

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_file(request, module):
    if 'file' not in request.FILES:
        return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    ext = os.path.splitext(file.name)[1]
    filename = f"{module}/{uuid.uuid4()}{ext}"

    saved_name = storage_backend.save(filename, file)
    file_url = storage_backend.url(saved_name)

    return Response({'url': file_url, 'name': saved_name}, status=status.HTTP_201_CREATED)

import os
