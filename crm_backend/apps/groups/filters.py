import django_filters

from .models import Group


class GroupFilter(django_filters.FilterSet):
    class Meta:
        model = Group
        fields = ("course", "teacher", "status")
