from rest_framework.routers import DefaultRouter

from .views import DepartmentViewSet, FunctionViewSet

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="department")
router.register("functions", FunctionViewSet, basename="function")

urlpatterns = router.urls
