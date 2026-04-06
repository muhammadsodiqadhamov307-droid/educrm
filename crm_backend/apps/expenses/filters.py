import django_filters

from .models import Expense


class ExpenseFilter(django_filters.FilterSet):
    date__gte = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date__lte = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Expense
        fields = ("date", "date__gte", "date__lte", "category", "teacher")
