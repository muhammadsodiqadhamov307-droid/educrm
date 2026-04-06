import django_filters

from .models import Attendance


class AttendanceFilter(django_filters.FilterSet):
    date__gte = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date__lte = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    teacher = django_filters.NumberFilter(field_name="group__teacher_id")

    class Meta:
        model = Attendance
        fields = ("group", "date", "teacher", "date__gte", "date__lte")
