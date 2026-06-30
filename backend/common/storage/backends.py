"""
Storage backends for file uploads.
"""
import os
from django.conf import settings
from django.core.files.storage import FileSystemStorage

class LocalStorageBackend:
    def __init__(self):
        self.storage = FileSystemStorage(location=settings.MEDIA_ROOT)

    def save(self, name, content):
        return self.storage.save(name, content)

    def url(self, name):
        return self.storage.url(name)

    def delete(self, name):
        self.storage.delete(name)

class StorageBackend:
    def __init__(self):
        self.backend = LocalStorageBackend()

    def save(self, name, content):
        return self.backend.save(name, content)

    def url(self, name):
        return self.backend.url(name)

    def delete(self, name):
        self.backend.delete(name)

storage_backend = StorageBackend()
