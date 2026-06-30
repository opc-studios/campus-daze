"""
User admin configuration.
"""
from django.contrib import admin
from .models import User, Role, Permission, RolePermission

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'role', 'is_active', 'created_at']
    list_filter = ['is_active', 'role']
    search_fields = ['email', 'username']

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['codename', 'name', 'module']
    list_filter = ['module']

@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission']
