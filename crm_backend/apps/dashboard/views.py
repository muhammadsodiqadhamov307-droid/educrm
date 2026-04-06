from decimal import Decimal

from django.db.models import Sum, Value
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from crm_backend.apps.expenses.models import Expense
from crm_backend.apps.groups.models import Group
from crm_backend.apps.leads.models import Lead
from crm_backend.apps.payments.models import Payment
from crm_backend.apps.students.models import Student
from crm_backend.config.permissions import IsAdmin


class DashboardStatsView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, *args, **kwargs):
        today = timezone.localdate()
        total_payments = Payment.objects.active().aggregate(
            total=Coalesce(Sum("amount"), Value(Decimal("0.00")))
        )["total"]
        total_expenses = Expense.objects.active().aggregate(
            total=Coalesce(Sum("amount"), Value(Decimal("0.00")))
        )["total"]
        today_payments = Payment.objects.active().filter(date=today).aggregate(
            total=Coalesce(Sum("amount"), Value(Decimal("0.00")))
        )["total"]
        today_expenses = Expense.objects.active().filter(date=today).aggregate(
            total=Coalesce(Sum("amount"), Value(Decimal("0.00")))
        )["total"]

        stats = {
            "total_students": Student.objects.active().filter(status=Student.Statuses.ACTIVE).count(),
            "active_groups": Group.objects.active().filter(status=Group.Statuses.ACTIVE).count(),
            "total_balance": total_payments - total_expenses,
            "today_income": today_payments - today_expenses,
            "debtors_count": Student.objects.active().filter(balance__lt=0).count(),
            "new_leads_count": Lead.objects.active().filter(status=Lead.Statuses.NEW).count(),
        }
        return Response(stats)
