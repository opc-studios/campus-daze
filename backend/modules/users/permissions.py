"""
RBAC permission classes.
"""
from rest_framework.permissions import BasePermission

class HasPermission(BasePermission):
    def __init__(self, perm_codename):
        self.perm_codename = perm_codename

    def has_permission(self, request, view):
        return request.user.has_perm(self.perm_codename)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_staff or request.user.is_superuser
