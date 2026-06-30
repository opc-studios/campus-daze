"""
Map URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('areas/', views.list_areas, name='list-areas'),
    path('areas/<int:area_id>/', views.get_area, name='get-area'),
    path('areas/<int:area_id>/explore/', views.explore_area, name='explore-area'),
    path('areas/<int:area_id>/tiles/', views.get_area_tiles, name='area-tiles'),
    path('areas/<int:area_id>/objects/', views.get_area_objects, name='area-objects'),
]
