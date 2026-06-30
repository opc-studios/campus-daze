"""
Chapter URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_chapters, name='list-chapters'),
    path('<int:chapter_id>/', views.get_chapter, name='get-chapter'),
    path('progress/', views.get_chapter_progress, name='chapter-progress'),
    path('<int:chapter_id>/advance/', views.advance_scene, name='advance-scene'),
]
