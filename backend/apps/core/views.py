from django.db.models import Count, Sum
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ChurchProfile
from .permissions import ModulePermission
from .serializers import ChurchProfileSerializer


def _sum(queryset, **filters):
    return queryset.filter(**filters).aggregate(value=Sum("amount"))["value"] or 0


def _last_months(count=6):
    today = timezone.localdate()
    year, month = today.year, today.month
    buckets = []
    for offset in range(count - 1, -1, -1):
        m = month - offset
        y = year
        while m <= 0:
            m += 12
            y -= 1
        buckets.append((y, m))
    return buckets


class DashboardView(APIView):
    permission_classes = [ModulePermission]
    perm_view = "dashboard.view"

    def get(self, request):
        from apps.departments.models import Department
        from apps.treasury.models import Caisse, Transaction
        from apps.treasury.serializers import TransactionSerializer
        from apps.workers.models import Attendance, Task, Worker

        today = timezone.localdate()
        month_start = today.replace(day=1)

        validated = Transaction.objects.filter(status="validated")
        month_tx = validated.filter(date__gte=month_start)

        finance_month = {
            "tithes": _sum(month_tx, category="tithe"),
            "offerings": _sum(month_tx, category="offering"),
            "donations": _sum(month_tx, category="donation"),
            "expenses": _sum(month_tx, category="expense"),
            "in": _sum(month_tx, direction="in"),
            "out": _sum(month_tx, direction="out"),
        }
        finance_month["net"] = finance_month["in"] - finance_month["out"]

        monthly_series = []
        for (year, month) in _last_months(6):
            scope = validated.filter(date__year=year, date__month=month)
            monthly_series.append(
                {
                    "month": f"{year}-{month:02d}",
                    "in": _sum(scope, direction="in"),
                    "out": _sum(scope, direction="out"),
                }
            )

        offerings_by_type = list(
            validated.filter(category="offering")
            .values("offering_type__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
        )

        workers_by_department = list(
            Worker.objects.values("department__name")
            .annotate(count=Count("id"))
            .order_by("-count")[:6]
        )

        month_attendance = Attendance.objects.filter(event__date__gte=month_start)
        att_total = month_attendance.count()
        att_present = month_attendance.filter(status__in=["present", "late"]).count()

        balances = list(Caisse.objects.values("currency").annotate(total=Sum("current_balance")))

        recent = validated.select_related("caisse", "offering_type").order_by("-date", "-created_at")[:6]

        return Response(
            {
                "workers": {
                    "total": Worker.objects.count(),
                    "active": Worker.objects.filter(status="active").count(),
                },
                "departments": {"total": Department.objects.filter(is_active=True).count()},
                "caisses": {"count": Caisse.objects.count(), "balances": balances},
                "finance_month": finance_month,
                "monthly_series": monthly_series,
                "offerings_by_type": offerings_by_type,
                "workers_by_department": workers_by_department,
                "attendance": {
                    "rate": round(att_present / att_total * 100, 1) if att_total else 0,
                    "present": att_present,
                    "total": att_total,
                },
                "tasks": {
                    "todo": Task.objects.filter(status="todo").count(),
                    "in_progress": Task.objects.filter(status="in_progress").count(),
                    "done": Task.objects.filter(status="done").count(),
                },
                "recent_transactions": TransactionSerializer(recent, many=True).data,
            }
        )


class ChurchProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ChurchProfileSerializer(ChurchProfile.get_solo()).data)

    def patch(self, request):
        user = request.user
        if not (user.is_superuser or user.has_perm_code("iam.manage")):
            raise PermissionDenied("Permission requise pour modifier le profil de l'église.")
        profile = ChurchProfile.get_solo()
        serializer = ChurchProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
