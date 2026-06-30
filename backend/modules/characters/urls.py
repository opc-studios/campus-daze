"""
Character URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_characters, name='list-characters'),
    path('create/', views.create_character_view, name='create-character'),
    path('<int:character_id>/', views.get_character, name='get-character'),
    path('<int:character_id>/update/', views.update_character, name='update-character'),
    path('<int:character_id>/equipment/', views.get_character_equipment, name='character-equipment'),
    path('<int:character_id>/skills/', views.get_character_skills, name='character-skills'),
    path('<int:character_id>/transform/', views.transform_form, name='transform-form'),
    path('templates/', views.list_templates, name='list-templates'),
    path('professions/', views.list_professions, name='list-professions'),
]
