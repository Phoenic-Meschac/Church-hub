from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Permission, Role, User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["email"]
    list_display = ("email", "first_name", "last_name", "is_active", "is_staff", "is_superuser")
    list_filter = ("is_active", "is_staff", "is_superuser", "roles")
    search_fields = ("email", "first_name", "last_name")
    filter_horizontal = ("roles", "groups", "user_permissions")
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profil", {"fields": ("first_name", "last_name", "phone", "photo")}),
        ("Rôles & permissions", {"fields": ("roles", "is_active", "is_staff", "is_superuser")}),
        ("Avancé", {"classes": ("collapse",), "fields": ("groups", "user_permissions", "last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "first_name", "last_name", "password1", "password2", "is_staff", "is_superuser"),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "is_system", "description")
    list_filter = ("is_system",)
    search_fields = ("name",)
    filter_horizontal = ("permissions",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "module", "label")
    list_filter = ("module",)
    search_fields = ("code", "label")
