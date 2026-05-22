from rest_framework import mixins, viewsets

from apps.core.permissions import ModulePermission

from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(
    mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Consultation en lecture seule du journal d'audit."""

    queryset = AuditLog.objects.select_related("actor").all()
    serializer_class = AuditLogSerializer
    permission_classes = [ModulePermission]
    perm_view = "audit.view"
    filterset_fields = ["action", "module", "model_name", "actor"]
    search_fields = ["object_repr", "actor_label", "model_name", "module"]
    ordering_fields = ["timestamp"]
    ordering = ["-timestamp"]
