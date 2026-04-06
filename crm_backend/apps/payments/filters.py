import django_filters

from .models import Payment


class PaymentFilter(django_filters.FilterSet):
    date__gte = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date__lte = django_filters.DateFilter(field_name="date", lookup_expr="lte")

    class Meta:
        model = Payment
        fields = ("student", "date", "date__gte", "date__lte")
