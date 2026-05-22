from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.audit.services import log_event
from apps.core.viewsets import AuditedModelViewSet

from .models import Caisse, CaisseAssignment, OfferingType, Transaction
from .serializers import (
    CaisseAssignmentSerializer,
    CaisseSerializer,
    OfferingTypeSerializer,
    TransactionSerializer,
)


class OfferingTypeViewSet(AuditedModelViewSet):
    queryset = OfferingType.objects.all()
    serializer_class = OfferingTypeSerializer
    perm_view = "treasury.view"
    perm_manage = "treasury.manage"
    filterset_fields = ["is_active"]
    search_fields = ["name", "code"]


class CaisseViewSet(AuditedModelViewSet):
    queryset = Caisse.objects.prefetch_related(
        "assignments__worker", "assignments__user", "transactions"
    ).all()
    serializer_class = CaisseSerializer
    perm_view = "treasury.view"
    perm_manage = "treasury.caisse_manage"
    filterset_fields = ["type", "is_active", "currency"]
    search_fields = ["name", "code"]
    ordering_fields = ["name", "current_balance", "created_at"]


class CaisseAssignmentViewSet(AuditedModelViewSet):
    queryset = CaisseAssignment.objects.select_related("caisse", "worker", "user").all()
    serializer_class = CaisseAssignmentSerializer
    perm_view = "treasury.view"
    perm_manage = "treasury.caisse_manage"
    filterset_fields = ["caisse", "worker", "user", "role", "is_active"]


class TransactionViewSet(AuditedModelViewSet):
    queryset = Transaction.objects.select_related(
        "caisse", "offering_type", "contributor_worker", "recorded_by"
    ).all()
    serializer_class = TransactionSerializer
    perm_view = "treasury.view"
    perm_manage = "treasury.manage"
    filterset_fields = ["caisse", "category", "direction", "status", "offering_type", "date"]
    search_fields = ["reference", "label", "contributor_name"]
    ordering_fields = ["date", "amount", "created_at"]

    def initial(self, request, *args, **kwargs):
        # L'approbation des dépenses exige une permission dédiée.
        if getattr(self, "action", None) == "approve":
            self.perm_manage = "treasury.expense_approve"
        super().initial(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = "validated"
        transaction.save()
        log_event(
            "custom",
            f"Validation de la transaction {transaction.reference}",
            request=request,
            module="treasury",
        )
        return Response(self.get_serializer(transaction).data)

    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        transaction = self.get_object()
        transaction.status = "cancelled"
        transaction.save()
        log_event(
            "custom",
            f"Annulation de la transaction {transaction.reference}",
            request=request,
            module="treasury",
        )
        return Response(self.get_serializer(transaction).data)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        qs = self.filter_queryset(self.get_queryset()).filter(status="validated")

        def total(category=None, direction=None):
            flt = qs
            if category:
                flt = flt.filter(category=category)
            if direction:
                flt = flt.filter(direction=direction)
            return flt.aggregate(s=Sum("amount"))["s"] or 0

        total_in = total(direction="in")
        total_out = total(direction="out")
        return Response(
            {
                "total_in": total_in,
                "total_out": total_out,
                "net": total_in - total_out,
                "tithes": total(category="tithe"),
                "offerings": total(category="offering"),
                "donations": total(category="donation"),
                "expenses": total(category="expense"),
                "count": qs.count(),
            }
        )
