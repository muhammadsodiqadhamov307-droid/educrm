from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_backend.apps.accounts.models import User
from crm_backend.apps.groups.models import Group
from crm_backend.apps.students.models import Student

from .filters import AttendanceFilter
from .models import Attendance
from .serializers import (
    AttendanceSerializer,
    AttendanceUpdateSerializer,
    BulkAttendanceSerializer,
)


def lesson_deduction(lesson_price: Decimal, student_discount: Decimal) -> Decimal:
    return lesson_price * (Decimal("1") - (student_discount / Decimal("100")))


class AttendanceViewSet(mixins.ListModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
    CHARGEABLE_STATUSES = {
        Attendance.Statuses.PRESENT,
        Attendance.Statuses.ABSENT_EXCUSED,
        Attendance.Statuses.ABSENT_UNEXCUSED,
    }
    ABSENT_STATUSES = {
        Attendance.Statuses.ABSENT_EXCUSED,
        Attendance.Statuses.ABSENT_UNEXCUSED,
    }

    filterset_class = AttendanceFilter
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = (
            Attendance.objects.active()
            .filter(
                student__is_deleted=False,
                group__is_deleted=False,
                group__course__is_deleted=False,
            )
            .select_related(
                "student",
                "group",
                "group__teacher",
                "group__support_teacher",
                "group__course",
                "created_by",
            )
            .order_by("-date", "-created_at", "-id")
        )
        user = self.request.user
        if user.role == User.Roles.TEACHER:
            queryset = queryset.filter(group__teacher=user)
        elif user.role == User.Roles.SUPPORT_TEACHER:
            queryset = queryset.filter(group__support_teacher=user)
        elif user.role != User.Roles.ADMIN:
            queryset = queryset.none()
        return queryset

    def get_serializer_class(self):
        if self.action in {"update", "partial_update"}:
            return AttendanceUpdateSerializer
        if self.action == "bulk_save":
            return BulkAttendanceSerializer
        return AttendanceSerializer

    def list(self, request, *args, **kwargs):
        self._ensure_list_permission()
        return super().list(request, *args, **kwargs)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        self._ensure_write_permission()
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        group = instance.group
        if request.user.role == User.Roles.TEACHER and group.teacher_id != request.user.id:
            raise PermissionDenied("You can only update attendance for your own groups.")
        old_status = instance.status
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        student = Student.objects.select_for_update().get(id=instance.student_id)
        if student.status == Student.Statuses.FROZEN:
            attendance = serializer.save()
            response_serializer = AttendanceSerializer(attendance)
            return Response(response_serializer.data)

        if old_status != serializer.validated_data.get("status", old_status):
            self._reverse_status_effect(group, student, old_status)
        attendance = serializer.save()
        if old_status != attendance.status:
            self._apply_status_effect(group, student, attendance.status)
        if attendance.status == Attendance.Statuses.ABSENT_UNEXCUSED:
            self._freeze_student_if_needed(student.id, group)
        response_serializer = AttendanceSerializer(attendance)
        return Response(response_serializer.data)

    @action(detail=False, methods=["post"], url_path="bulk-save")
    @transaction.atomic
    def bulk_save(self, request, *args, **kwargs):
        self._ensure_write_permission()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        group = Group.objects.select_related("course", "teacher", "support_teacher").get(
            id=serializer.validated_data["group"].id
        )
        if request.user.role == User.Roles.TEACHER and group.teacher_id != request.user.id:
            raise PermissionDenied("You can only mark attendance for your own groups.")
        records = serializer.validated_data["records"]
        attendance_date = serializer.validated_data["date"]
        student_ids = [record["student"].id for record in records]

        existing_attendance = {
            attendance.student_id: attendance
            for attendance in Attendance.objects.select_for_update()
            .filter(
                group=group,
                date=attendance_date,
                student_id__in=student_ids,
                is_deleted=False,
            )
            .select_related("student")
        }

        saved_ids = []
        for record in records:
            student = Student.objects.select_for_update().get(id=record["student"].id)
            new_status = record["status"]
            grade = record.get("grade")
            existing = existing_attendance.get(student.id)
            old_status = existing.status if existing else None

            if student.status == Student.Statuses.FROZEN:
                attendance, _ = Attendance.objects.update_or_create(
                    student=student,
                    group=group,
                    date=attendance_date,
                    defaults={
                        "status": new_status,
                        "grade": grade,
                        "created_by": request.user,
                        "is_deleted": False,
                    },
                )
                saved_ids.append(attendance.id)
                continue

            if existing and old_status != new_status:
                self._reverse_status_effect(group, student, old_status)

            attendance, _ = Attendance.objects.update_or_create(
                student=student,
                group=group,
                date=attendance_date,
                defaults={
                    "status": new_status,
                    "grade": grade,
                    "created_by": request.user,
                    "is_deleted": False,
                },
            )

            if old_status != new_status:
                self._apply_status_effect(group, student, new_status)
            if new_status == Attendance.Statuses.ABSENT_UNEXCUSED:
                self._freeze_student_if_needed(student.id, group)
            saved_ids.append(attendance.id)

        saved_records = (
            Attendance.objects.active()
            .filter(id__in=saved_ids)
            .select_related("student", "group", "created_by")
            .order_by("student__first_name", "student__last_name", "id")
        )
        return Response(AttendanceSerializer(saved_records, many=True).data, status=status.HTTP_200_OK)

    def _reverse_status_effect(self, group, student, status_value):
        if status_value not in self.CHARGEABLE_STATUSES:
            return

        lesson_price = group.course.daily_price
        free_lessons_total = max(int(student.free_lessons_total or 0), 0)
        free_lessons_remaining = max(int(student.free_lessons_remaining or 0), 0)

        if free_lessons_remaining < free_lessons_total:
            Student.objects.filter(id=student.id).update(
                free_lessons_remaining=F("free_lessons_remaining") + 1
            )
        else:
            deduction = lesson_deduction(lesson_price, student.discount)
            Student.objects.filter(id=student.id).update(balance=F("balance") + deduction)

        earnings_users = []
        if status_value == Attendance.Statuses.PRESENT:
            if group.teacher_id:
                earnings_users.append(group.teacher)
            if group.support_teacher_id:
                earnings_users.append(group.support_teacher)
        elif group.support_teacher_id:
            earnings_users.append(group.support_teacher)

        for earnings_user in earnings_users:
            share_percent = Decimal(earnings_user.share_percent)
            earning_amount = lesson_price * (share_percent / Decimal("100"))
            User.objects.filter(id=earnings_user.id).update(balance=F("balance") - earning_amount)

    def _apply_status_effect(self, group, student, status_value):
        if status_value not in self.CHARGEABLE_STATUSES:
            return

        if student.status == Student.Statuses.FROZEN:
            return

        lesson_price = group.course.daily_price
        free_lessons_remaining = max(int(student.free_lessons_remaining or 0), 0)

        if free_lessons_remaining > 0:
            Student.objects.filter(id=student.id).update(
                free_lessons_remaining=F("free_lessons_remaining") - 1
            )
        else:
            deduction = lesson_deduction(lesson_price, student.discount)
            Student.objects.filter(id=student.id).update(balance=F("balance") - deduction)

        earnings_users = []
        if status_value == Attendance.Statuses.PRESENT:
            if group.teacher_id:
                earnings_users.append(group.teacher)
            if group.support_teacher_id:
                earnings_users.append(group.support_teacher)
        elif status_value in self.ABSENT_STATUSES and group.support_teacher_id:
            earnings_users.append(group.support_teacher)

        for earnings_user in earnings_users:
            share_percent = Decimal(earnings_user.share_percent)
            earning_amount = lesson_price * (share_percent / Decimal("100"))
            User.objects.filter(id=earnings_user.id).update(balance=F("balance") + earning_amount)

    def _freeze_student_if_needed(self, student_id, group):
        unexcused_records = Attendance.objects.active().filter(
            student_id=student_id,
            group=group,
            status=Attendance.Statuses.ABSENT_UNEXCUSED,
        )
        unexcused_count = unexcused_records.count()
        student = Student.objects.select_for_update().get(id=student_id)
        if unexcused_count < 3 or student.freeze_refund_done:
            return

        lesson_price = group.course.daily_price
        discount_factor = Decimal("1") - (Decimal(student.discount) / Decimal("100"))
        chargeable_unexcused_count = self._count_chargeable_unexcused_absences(student_id, group.id)

        Student.objects.filter(id=student_id).update(
            status=Student.Statuses.FROZEN,
            freeze_refund_done=True,
        )

        if chargeable_unexcused_count:
            student_refund = lesson_price * discount_factor * Decimal(chargeable_unexcused_count)
            Student.objects.filter(id=student_id).update(balance=F("balance") + student_refund)

        if group.support_teacher_id and unexcused_count:
            share_percent = Decimal(group.support_teacher.share_percent) / Decimal("100")
            support_refund = lesson_price * share_percent * Decimal(unexcused_count)
            User.objects.filter(id=group.support_teacher_id).update(balance=F("balance") - support_refund)

    def _count_chargeable_unexcused_absences(self, student_id, group_id):
        chargeable_records = (
            Attendance.objects.active()
            .filter(
                student_id=student_id,
                group_id=group_id,
                status__in=self.CHARGEABLE_STATUSES,
            )
            .order_by("date", "id")
        )
        student = Student.objects.only("free_lessons_total").get(id=student_id)
        free_lessons_remaining = max(int(student.free_lessons_total or 0), 0)
        chargeable_unexcused_count = 0

        for record in chargeable_records:
            used_free_lesson = free_lessons_remaining > 0
            if used_free_lesson:
                free_lessons_remaining -= 1
            if record.status == Attendance.Statuses.ABSENT_UNEXCUSED and not used_free_lesson:
                chargeable_unexcused_count += 1

        return chargeable_unexcused_count

    def _ensure_write_permission(self):
        if self.request.user.role not in {User.Roles.ADMIN, User.Roles.TEACHER}:
            raise PermissionDenied("You do not have permission to modify attendance.")

    def _ensure_list_permission(self):
        if self.request.user.role not in {
            User.Roles.ADMIN,
            User.Roles.TEACHER,
            User.Roles.SUPPORT_TEACHER,
        }:
            raise PermissionDenied("You do not have permission to view attendance.")
