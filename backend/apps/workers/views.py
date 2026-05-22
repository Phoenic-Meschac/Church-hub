from rest_framework.decorators import action
from rest_framework.response import Response

from apps.audit.services import log_event
from apps.core.viewsets import AuditedModelViewSet

from .models import Attendance, Event, Task, Worker
from .serializers import (
    AttendanceSerializer,
    EventSerializer,
    TaskSerializer,
    WorkerSerializer,
)


class WorkerViewSet(AuditedModelViewSet):
    queryset = Worker.objects.select_related("department", "function", "user").all()
    serializer_class = WorkerSerializer
    perm_view = "workers.view"
    perm_manage = "workers.manage"
    filterset_fields = ["status", "department", "function", "gender"]
    search_fields = ["first_name", "last_name", "matricule", "phone", "email"]
    ordering_fields = ["first_name", "last_name", "created_at"]


class EventViewSet(AuditedModelViewSet):
    queryset = Event.objects.select_related("department").prefetch_related("attendances").all()
    serializer_class = EventSerializer
    perm_view = "workers.view"
    perm_manage = "workers.attendance"
    filterset_fields = ["type", "department", "date"]
    search_fields = ["name", "location"]
    ordering_fields = ["date", "name"]


class AttendanceViewSet(AuditedModelViewSet):
    queryset = Attendance.objects.select_related("worker", "event").all()
    serializer_class = AttendanceSerializer
    perm_view = "workers.view"
    perm_manage = "workers.attendance"
    filterset_fields = ["event", "worker", "status"]
    ordering_fields = ["event__date"]

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        """Enregistre/maj la présence de plusieurs ouvriers pour un évènement."""
        event_id = request.data.get("event")
        records = request.data.get("records", [])
        if not event_id:
            return Response({"detail": "Champ 'event' requis."}, status=400)
        saved = []
        for record in records:
            worker_id = record.get("worker")
            if not worker_id:
                continue
            obj, _created = Attendance.objects.update_or_create(
                event_id=event_id,
                worker_id=worker_id,
                defaults={
                    "status": record.get("status", "present"),
                    "check_in_time": record.get("check_in_time") or None,
                    "note": record.get("note", ""),
                },
            )
            saved.append(obj.id)
        log_event(
            "custom",
            f"Saisie de présence en masse ({len(saved)} ouvriers)",
            request=request,
            module="workers",
        )
        return Response({"saved": len(saved), "ids": saved})


class TaskViewSet(AuditedModelViewSet):
    queryset = Task.objects.select_related("worker", "department").all()
    serializer_class = TaskSerializer
    perm_view = "workers.view"
    perm_manage = "workers.manage"
    filterset_fields = ["status", "priority", "worker", "department"]
    search_fields = ["title", "description"]
    ordering_fields = ["due_date", "priority", "created_at"]
