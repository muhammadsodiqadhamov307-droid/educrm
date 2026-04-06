from collections import Counter

from rest_framework import serializers

from crm_backend.apps.groups.models import Group
from crm_backend.apps.students.models import Student

from .models import Attendance


class AttendanceStudentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class AttendanceGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class AttendanceCreatedBySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


class AttendanceSerializer(serializers.ModelSerializer):
    student = AttendanceStudentSerializer(read_only=True)
    group = AttendanceGroupSerializer(read_only=True)
    created_by = AttendanceCreatedBySerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = ("id", "student", "group", "date", "status", "grade", "created_by", "created_at")


class AttendanceUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ("date", "status", "grade")

    def validate(self, attrs):
        instance = self.instance
        if instance is None:
            return attrs
        attendance_date = attrs.get("date", instance.date)
        duplicate_exists = Attendance.objects.active().filter(
            student=instance.student,
            group=instance.group,
            date=attendance_date,
        ).exclude(id=instance.id).exists()
        if duplicate_exists:
            raise serializers.ValidationError(
                {"date": "Attendance for this student, group, and date already exists."}
            )
        return attrs


class BulkAttendanceRecordSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.active(), source="student")
    status = serializers.ChoiceField(choices=Attendance.Statuses.choices)
    grade = serializers.ChoiceField(choices=[1, 2, 3, 4, 5], allow_null=True, required=False)


class BulkAttendanceSerializer(serializers.Serializer):
    group_id = serializers.PrimaryKeyRelatedField(queryset=Group.objects.active(), source="group")
    date = serializers.DateField()
    records = BulkAttendanceRecordSerializer(many=True)

    def validate(self, attrs):
        group = attrs["group"]
        records = attrs["records"]
        student_ids = [record["student"].id for record in records]
        duplicates = [student_id for student_id, count in Counter(student_ids).items() if count > 1]
        if duplicates:
            raise serializers.ValidationError({"records": "Duplicate student records are not allowed."})
        group_student_ids = set(
            group.student_links.active()
            .filter(student__is_deleted=False, student_id__in=student_ids)
            .values_list("student_id", flat=True)
        )
        invalid_student_ids = [student_id for student_id in student_ids if student_id not in group_student_ids]
        if invalid_student_ids:
            raise serializers.ValidationError(
                {"records": f"Students {invalid_student_ids} are not active members of this group."}
            )
        return attrs
