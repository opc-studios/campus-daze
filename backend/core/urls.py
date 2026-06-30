"""
URL configuration for campus_daze project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('modules.users.urls')),
    path('api/characters/', include('modules.characters.urls')),
    path('api/maps/', include('modules.maps.urls')),
    path('api/chapters/', include('modules.chapters.urls')),
    path('api/gameplay/', include('modules.gameplay.urls')),
    path('api/dialogue/', include('modules.dialogue.urls')),
    path('api/stages/', include('modules.stages.urls')),
    path('api/saves/', include('modules.saves.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
