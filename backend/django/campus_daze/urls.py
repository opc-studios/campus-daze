from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    path('api/', include('characters.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('enemies.urls')),
    path('api/', include('areas.urls')),
    path('api/', include('npcs.urls')),
    path('api/', include('rewards.urls')),
    path('api/', include('rest.urls')),
]