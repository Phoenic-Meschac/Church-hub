from rest_framework.routers import DefaultRouter

from .views import AttendanceViewSet, EventViewSet, TaskViewSet, WorkerViewSet

router = DefaultRouter()
router.register("workers", WorkerViewSet, basename="worker")
router.register("events", EventViewSet, basename="event")
router.register("attendances", AttendanceViewSet, basename="attendance")
router.register("tasks", TaskViewSet, basename="task")

urlpatterns = router.urls
