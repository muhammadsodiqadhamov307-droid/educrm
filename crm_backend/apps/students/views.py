from django.db import transaction
from django.db.models import Prefetch
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_backend.apps.accounts.models import User
from crm_backend.apps.attendance.models import Attendance
from crm_backend.apps.payments.models import Payment
from crm_backend.config.permissions import (
    IsAdmin,
    IsAdminOrReceptionist,
    IsAdminOrSupportTeacher,
)
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .filters import StudentFilter
from .models import GroupStudent, Student, StudentSupportTask
from .serializers import (
    SendToSupportSerializer,
    StudentCreateUpdateSerializer,
    StudentDetailSerializer,
    StudentListSerializer,
    SupportTaskSerializer,
    SupportTaskStatusSerializer,
)


class StudentViewSet(SoftDeleteModelViewSet):
    filterset_class = StudentFilter
    permission_classes = [IsAuthenticated]
    search_fields = ("first_name", "last_name", "phone")

    def get_queryset(self):
        queryset = Student.objects.active()
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                Prefetch(
                    "group_links",
                    queryset=GroupStudent.objects.active()
                    .filter(group__is_deleted=False, group__course__is_deleted=False)
                    .select_related("group__course"),
                    to_attr="active_group_links",
                ),
                Prefetch(
                    "payments",
                    queryset=Payment.objects.active().select_related("created_by"),
                    to_attr="active_payments",
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
            return StudentDetailSerializer
        if self.action in {"create", "update", "partial_update"}:
            return StudentCreateUpdateSerializer
        return StudentListSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update"}:
            permission_classes = [IsAdminOrReceptionist]
        elif self.action == "destroy":
            permission_classes = [IsAdmin]
        elif self.action == "send_to_support":
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        student = serializer.save()
        if old_status == Student.Statuses.FROZEN and student.status == Student.Statuses.ACTIVE:
            Student.objects.filter(id=student.id).update(freeze_refund_done=False)
            student.freeze_refund_done = False
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="send-to-support")
    @transaction.atomic
    def send_to_support(self, request, *args, **kwargs):
        student = self.get_object()
        serializer = SendToSupportSerializer(data=request.data, context={"student": student})
        serializer.is_valid(raise_exception=True)
        group = serializer.validated_data["group"]
        if request.user.role not in {
            User.Roles.ADMIN,
            User.Roles.RECEPTIONIST,
            User.Roles.TEACHER,
        }:
            raise PermissionDenied("You do not have permission to send students to support.")
        if request.user.role == User.Roles.TEACHER and group.teacher_id != request.user.id:
            raise PermissionDenied("You can only send students from your own groups to support.")
        task = StudentSupportTask.objects.create(
            student=student,
            support_teacher=group.support_teacher,
            group=group,
            note=serializer.validated_data.get("note", ""),
            created_by=request.user,
        )
        response_task = SupportTaskViewSet.get_base_queryset().get(id=task.id)
        return Response(SupportTaskSerializer(response_task).data, status=status.HTTP_201_CREATED)


class SupportTaskViewSet(
    mixins.ListModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [IsAuthenticated]

    @staticmethod
    def get_base_queryset():
        return (
            StudentSupportTask.objects.active()
            .filter(
                student__is_deleted=False,
                group__is_deleted=False,
                group__course__is_deleted=False,
                support_teacher__is_deleted=False,
                created_by__is_deleted=False,
            )
            .select_related(
                "student",
                "support_teacher",
                "group",
                "group__course",
                "created_by",
            )
            .prefetch_related(
                Prefetch(
                    "student__group_links",
                    queryset=GroupStudent.objects.active()
                    .filter(group__is_deleted=False, group__course__is_deleted=False)
                    .select_related("group__course"),
                    to_attr="active_group_links",
                )
            )
        )

    def get_queryset(self):
        queryset = self.get_base_queryset()
        user = self.request.user
        if user.role == User.Roles.SUPPORT_TEACHER:
            queryset = queryset.filter(support_teacher=user)

        status_value = self.request.query_params.get("status")
        support_teacher_id = self.request.query_params.get("support_teacher")
        group_id = self.request.query_params.get("group")

        if status_value:
            queryset = queryset.filter(status=status_value)
        if support_teacher_id:
            queryset = queryset.filter(support_teacher_id=support_teacher_id)
        if group_id:
            queryset = queryset.filter(group_id=group_id)

        return queryset.order_by("-created_at", "-id")

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return SupportTaskStatusSerializer
        return SupportTaskSerializer

    def get_permissions(self):
        if self.action == "destroy":
            permission_classes = [IsAdmin]
        elif self.action in {"update", "partial_update"}:
            permission_classes = [IsAdminOrSupportTeacher]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        self._ensure_can_list()
        return super().list(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        self._ensure_can_update(instance)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        response_task = self.get_queryset().get(id=task.id)
        return Response(SupportTaskSerializer(response_task).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _ensure_can_update(self, instance):
        user = self.request.user
        if user.role == User.Roles.SUPPORT_TEACHER and instance.support_teacher_id != user.id:
            raise PermissionDenied("You can only update your own support tasks.")

    def _ensure_can_list(self):
        if self.request.user.role not in {
            User.Roles.ADMIN,
            User.Roles.RECEPTIONIST,
            User.Roles.SUPPORT_TEACHER,
        }:
            raise PermissionDenied("You do not have permission to view support tasks.")
