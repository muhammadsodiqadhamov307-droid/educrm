import django_filters

from .models import Student


class StudentFilter(django_filters.FilterSet):
    group = django_filters.NumberFilter(field_name="group_links__group_id")
    course = django_filters.NumberFilter(field_name="group_links__group__course_id")
    balance_negative = django_filters.BooleanFilter(method="filter_balance_negative")

    class Meta:
        model = Student
        fields = ("status", "group", "course", "balance_negative")

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        return queryset.filter(
            group_links__is_deleted=False,
            group_links__group__is_deleted=False,
        ).distinct() if any(
            value not in (None, "")
            for key, value in self.form.cleaned_data.items()
            if key in {"group", "course"}
        ) else queryset.distinct()

    def filter_balance_negative(self, queryset, name, value):
        if value is True:
            return queryset.filter(balance__lt=0)
        if value is False:
            return queryset.filter(balance__gte=0)
        return queryset
