"""
Dialogue URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('npcs/', views.list_npcs, name='list-npcs'),
    path('npcs/<int:npc_id>/', views.get_npc, name='get-npc'),
    path('npcs/<int:npc_id>/dialogue/', views.get_dialogue, name='get-dialogue'),
    path('npcs/<int:npc_id>/dialogue/<int:dialogue_id>/respond/', views.respond_to_dialogue, name='respond-dialogue'),
    path('npcs/<int:npc_id>/affinity/', views.get_npc_affinity, name='get-npc-affinity'),
    path('affinities/', views.get_all_affinities, name='get-all-affinities'),
]
