"""
Save URL routes.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('slots/', views.list_save_slots, name='list-save-slots'),
    path('slots/create/', views.create_slot, name='create-slot'),
    path('slots/<int:slot_id>/', views.get_slot, name='get-slot'),
    path('slots/<int:slot_id>/delete/', views.delete_slot, name='delete-slot'),
    path('slots/<int:slot_id>/save/', views.save_data, name='save-data'),
    path('slots/<int:slot_id>/load/<str:data_key>/', views.load_data, name='load-data'),
    path('slots/<int:slot_id>/load-all/', views.load_all_data, name='load-all-data'),
    path('auto-save/', views.auto_save, name='auto-save'),
]
