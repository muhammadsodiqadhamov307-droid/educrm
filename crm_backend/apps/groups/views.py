from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_backend.apps.attendance.models import Attendance
from crm_backend.apps.accounts.models import User
from crm_backend.apps.students.models import GroupStudent, Student
from crm_backend.config.permissions import IsAdmin, IsAdminOrReceptionist
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .filters import GroupFilter
from .models import Group
from .serializers import (
    GroupAddStudentSerializer,
    GroupCreateUpdateSerializer,
    GroupDetailSerializer,
    GroupListSerializer,
    GroupStudentSerializer,
)


class GroupViewSet(SoftDeleteModelViewSet):
    filterset_class = GroupFilter
    permission_classes = [IsAuthenticated]
    search_fields = ("name",)

    def get_queryset(self):
        user = self.request.user
        queryset = (
            Group.objects.active()
            .filter(course__is_deleted=False, teacher__is_deleted=False)
            .select_related("course", "teacher", "support_teacher")
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
        if user.is_authenticated and user.role == User.Roles.TEACHER:
            queryset = queryset.filter(teacher=user)
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "student_links",
                    queryset=GroupStudent.objects.active()
                    .filter(student__is_deleted=False)
                    .select_related("student"),
                    to_attr="active_student_links",
                ),
                Prefetch(
                    "attendance_records",
                    queryset=Attendance.objects.active(),
                    to_attr="active_attendance_records",
                ),
            )
        return queryset.order_by("-created_at", "-id").distinct()

    def get_serializer_class(self):
        if self.action == "retrieve":
            return GroupDetailSerializer
        if self.action in {"create", "update", "partial_update"}:
            return GroupCreateUpdateSerializer
        return GroupListSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            permission_classes = [IsAdmin]
        elif self.action in {"add_student", "remove_student"}:
            permission_classes = [IsAdminOrReceptionist]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=["get"], url_path="students")
    def students(self, request, *args, **kwargs):
        group = self.get_object()
        queryset = Student.objects.active().filter(
            group_links__group=group,
            group_links__is_deleted=False,
        )
        queryset = queryset.order_by("first_name", "last_name", "id").distinct()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = GroupStudentSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = GroupStudentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="add-student")
    def add_student(self, request, *args, **kwargs):
        group = self.get_object()
        serializer = GroupAddStudentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        student = serializer.validated_data["student"]

        existing_link = (
            GroupStudent.objects.filter(group=group, student=student)
            .order_by("is_deleted", "id")
            .first()
        )
        if existing_link and not existing_link.is_deleted:
            return Response(
                {"detail": "Student is already assigned to this group."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if existing_link:
            existing_link.restore()
        else:
            GroupStudent.objects.create(group=group, student=student)
        return Response(GroupStudentSerializer(student).data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"remove-student/(?P<student_id>[^/.]+)",
    )
    def remove_student(self, request, student_id=None, *args, **kwargs):
        group = self.get_object()
        link = get_object_or_404(
            GroupStudent.objects.active().select_related("student"),
            group=group,
            student_id=student_id,
            student__is_deleted=False,
        )
        link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
