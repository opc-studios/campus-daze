"""
Gameplay URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('enemies/', views.list_enemies, name='list-enemies'),
    path('battle/start/<int:character_id>/', views.start_battle_view, name='start-battle'),
    path('battle/<int:battle_id>/action/', views.battle_action, name='battle-action'),
    path('battle/<int:battle_id>/result/', views.battle_result, name='battle-result'),
    path('tasks/', views.list_tasks, name='list-tasks'),
    path('tasks/<int:task_id>/accept/<int:character_id>/', views.accept_task, name='accept-task'),
    path('tasks/<int:task_id>/progress/<int:character_id>/', views.update_task_progress, name='update-task-progress'),
    path('tasks/<int:task_id>/complete/<int:character_id>/', views.complete_task, name='complete-task'),
    path('rewards/', views.list_rewards, name='list-rewards'),
    path('achievements/', views.list_achievements, name='list-achievements'),
    path('achievements/<int:character_id>/', views.get_character_achievements, name='character-achievements'),
    path('rest/start/<int:character_id>/', views.start_rest_view, name='start-rest'),
    path('rest/end/<int:rest_id>/', views.end_rest_view, name='end-rest'),
    path('rest/offline/<int:character_id>/', views.get_offline_rewards, name='offline-rewards'),
]
