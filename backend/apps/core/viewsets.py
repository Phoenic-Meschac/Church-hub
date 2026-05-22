from rest_framework import viewsets

from apps.audit.services import log_model_action, serialize_instance

from .permissions import ModulePermission


class AuditedModelViewSet(viewsets.ModelViewSet):
    """ModelViewSet qui journalise automatiquement create/update/delete
    et applique le contrôle de permissions par module."""

    permission_classes = [ModulePermission]
    audit_enabled = True

    def perform_create(self, serializer):
        instance = serializer.save()
        if self.audit_enabled:
            log_model_action("create", instance, request=self.request)

    def perform_update(self, serializer):
        old_data = serialize_instance(serializer.instance) if self.audit_enabled else None
        instance = serializer.save()
        if self.audit_enabled:
            log_model_action("update", instance, request=self.request, old_data=old_data)

    def perform_destroy(self, instance):
        if self.audit_enabled:
            log_model_action("delete", instance, request=self.request)
        instance.delete()
