from django.db.models import Count, Prefetch, Q
from rest_framework.permissions import IsAuthenticated

from crm_backend.apps.groups.models import Group
from crm_backend.config.permissions import IsAdmin
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .models import Course
from .serializers import CourseCreateUpdateSerializer, CourseDetailSerializer, CourseListSerializer


class CourseViewSet(SoftDeleteModelViewSet):
    permission_classes = [IsAuthenticated]
    search_fields = ("name",)

    def get_queryset(self):
        queryset = (
            Course.objects.active()
            .annotate(
                group_count=Count("groups", filter=Q(groups__is_deleted=False), distinct=True),
                student_count=Count(
                    "groups__student_links__student",
                    filter=Q(
                        groups__is_deleted=False,
                        groups__student_links__is_deleted=False,
                        groups__student_links__student__is_deleted=False,
                    ),
                    distinct=True,
                ),
            )
        )
        if self.action == "retrieve":
            group_queryset = (
                Group.objects.active()
                .filter(teacher__is_deleted=False)
                .select_related("teacher")
                .annotate(
                    student_count=Count(
                        "student_links",
                        filter=Q(
                            student_links__is_deleted=False,
                            student_links__student__is_deleted=False,
                        ),
                        distinct=True,
                    )
                )
            )
            queryset = queryset.prefetch_related(
                Prefetch("groups", queryset=group_queryset, to_attr="active_groups")
            )
        return queryset.order_by("name", "id").distinct()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CourseDetailSerializer
        if self.action in {"create", "update", "partial_update"}:
            return CourseCreateUpdateSerializer
        return CourseListSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
