from django.contrib import admin

from .models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "actor_label", "action", "module", "model_name", "object_repr")
    list_filter = ("action", "module", "timestamp")
    search_fields = ("object_repr", "actor_label", "model_name")
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
