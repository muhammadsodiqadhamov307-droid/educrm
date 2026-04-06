from rest_framework import serializers

from crm_backend.apps.accounts.models import User
from crm_backend.apps.attendance.models import Attendance
from crm_backend.apps.groups.models import Group
from crm_backend.apps.payments.models import Payment

from .models import GroupStudent, Student, StudentSupportTask


class StudentListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = (
            "id",
            "first_name",
            "last_name",
            "phone",
            "phone2",
            "balance",
            "discount",
            "free_lessons_total",
            "free_lessons_remaining",
            "status",
            "created_at",
        )


class StudentGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="group.id")
    name = serializers.CharField(source="group.name")
    course = serializers.CharField(source="group.course.name")
    schedule = serializers.JSONField(source="group.schedule")


class StudentPaymentSerializer(serializers.ModelSerializer):
    created_by = serializers.CharField(source="created_by.username")

    class Meta:
        model = Payment
        fields = ("id", "amount", "date", "note", "created_by")


class StudentDetailSerializer(StudentListSerializer):
    groups = serializers.SerializerMethodField()
    payments = serializers.SerializerMethodField()
    attendance_summary = serializers.SerializerMethodField()

    class Meta(StudentListSerializer.Meta):
        fields = StudentListSerializer.Meta.fields + ("groups", "payments", "attendance_summary")

    def get_groups(self, obj):
        group_links = getattr(obj, "active_group_links", None)
        if group_links is None:
            group_links = (
                obj.group_links.active()
                .filter(group__is_deleted=False, group__course__is_deleted=False)
                .select_related("group__course")
            )
        return StudentGroupSerializer(group_links, many=True).data

    def get_payments(self, obj):
        payments = getattr(obj, "active_payments", None)
        if payments is None:
            payments = obj.payments.active().select_related("created_by")
        return StudentPaymentSerializer(list(payments)[:10], many=True).data

    def get_attendance_summary(self, obj):
        records = getattr(obj, "active_attendance_records", None)
        if records is None:
            records = obj.attendance_records.active()
        total = len(records) if isinstance(records, list) else records.count()
        present = (
            sum(1 for record in records if record.status == Attendance.Statuses.PRESENT)
            if isinstance(records, list)
            else records.filter(status=Attendance.Statuses.PRESENT).count()
        )
        absent = total - present
        percentage = round((present / total) * 100, 2) if total else 0
        return {
            "total_present": present,
            "total_absent": absent,
            "attendance_percentage": percentage,
        }


class StudentCreateUpdateSerializer(serializers.ModelSerializer):
    free_lessons_total = serializers.IntegerField(min_value=0, max_value=3, default=0)

    class Meta:
        model = Student
        fields = (
            "first_name",
            "last_name",
            "phone",
            "phone2",
            "balance",
            "discount",
            "free_lessons_total",
            "status",
            "source",
        )

    def create(self, validated_data):
        free_lessons_total = validated_data.get("free_lessons_total", 0)
        validated_data["free_lessons_remaining"] = free_lessons_total
        return super().create(validated_data)

    def update(self, instance, validated_data):
        free_lessons_total = validated_data.get("free_lessons_total")
        if free_lessons_total is not None:
            old_total = max(int(instance.free_lessons_total or 0), 0)
            old_remaining = max(int(instance.free_lessons_remaining or 0), 0)
            used_lessons = max(old_total - old_remaining, 0)
            validated_data["free_lessons_remaining"] = max(free_lessons_total - used_lessons, 0)
        return super().update(instance, validated_data)


class SupportTaskStudentSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = (
            "id",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "phone2",
            "balance",
            "status",
            "groups",
        )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_groups(self, obj):
        group_links = getattr(obj, "active_group_links", None)
        if group_links is None:
            group_links = (
                obj.group_links.active()
                .filter(group__is_deleted=False, group__course__is_deleted=False)
                .select_related("group__course")
            )
        return StudentGroupSerializer(group_links, many=True).data


class SupportTaskTeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "phone", "full_name")

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class SupportTaskGroupSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source="course.name", read_only=True)

    class Meta:
        model = Group
        fields = ("id", "name", "course_name")


class SupportTaskSerializer(serializers.ModelSerializer):
    student = SupportTaskStudentSerializer(read_only=True)
    support_teacher = SupportTaskTeacherSerializer(read_only=True)
    group = SupportTaskGroupSerializer(read_only=True)
    created_by = SupportTaskTeacherSerializer(read_only=True)

    class Meta:
        model = StudentSupportTask
        fields = (
            "id",
            "student",
            "support_teacher",
            "group",
            "note",
            "status",
            "created_by",
            "created_at",
        )


class SendToSupportSerializer(serializers.Serializer):
    group_id = serializers.PrimaryKeyRelatedField(queryset=Group.objects.active(), source="group")
    note = serializers.CharField(allow_blank=True, required=False)

    def validate(self, attrs):
        student = self.context["student"]
        group = attrs["group"]
        if not GroupStudent.objects.active().filter(student=student, group=group).exists():
            raise serializers.ValidationError(
                {"group_id": "The selected student is not enrolled in this group."}
            )
        if not group.support_teacher_id:
            raise serializers.ValidationError(
                {"group_id": "This group does not have a support teacher assigned."}
            )
        return attrs


class SupportTaskStatusSerializer(serializers.ModelSerializer):
    status = serializers.ChoiceField(
        choices=[
            StudentSupportTask.Statuses.CALLED,
            StudentSupportTask.Statuses.COMPLETED,
        ]
    )

    class Meta:
        model = StudentSupportTask
        fields = ("status",)
