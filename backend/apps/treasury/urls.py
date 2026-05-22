from rest_framework.routers import DefaultRouter

from .views import (
    CaisseAssignmentViewSet,
    CaisseViewSet,
    OfferingTypeViewSet,
    TransactionViewSet,
)

router = DefaultRouter()
router.register("caisses", CaisseViewSet, basename="caisse")
router.register("caisse-assignments", CaisseAssignmentViewSet, basename="caisseassignment")
router.register("offering-types", OfferingTypeViewSet, basename="offeringtype")
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = router.urls
