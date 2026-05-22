from apps.core.viewsets import AuditedModelViewSet

from .models import Department, Function
from .serializers import DepartmentSerializer, FunctionSerializer


class DepartmentViewSet(AuditedModelViewSet):
    queryset = Department.objects.select_related("leader").prefetch_related("functions").all()
    serializer_class = DepartmentSerializer
    perm_view = "departments.view"
    perm_manage = "departments.manage"
    filterset_fields = ["is_active"]
    search_fields = ["name", "code", "description"]
    ordering_fields = ["name", "created_at"]


class FunctionViewSet(AuditedModelViewSet):
    queryset = Function.objects.select_related("department").all()
    serializer_class = FunctionSerializer
    perm_view = "departments.view"
    perm_manage = "departments.manage"
    filterset_fields = ["department", "is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name"]
