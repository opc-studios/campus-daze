"""
Stage URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_stages, name='list-stages'),
    path('<int:stage_id>/', views.get_stage, name='get-stage'),
    path('enemies/', views.list_enemies, name='list-enemies'),
    path('enemies/<int:enemy_id>/', views.get_enemy, name='get-enemy'),
    path('progress/', views.get_stage_progress, name='stage-progress'),
    path('<int:stage_id>/complete/', views.complete_stage_view, name='complete-stage'),
]
