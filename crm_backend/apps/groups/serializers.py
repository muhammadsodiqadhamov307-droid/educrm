from rest_framework import serializers

from crm_backend.apps.students.models import Student

from .models import Group


class GroupCourseSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    price = serializers.DecimalField(source="daily_price", max_digits=12, decimal_places=2, read_only=True)
    daily_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    monthly_price = serializers.DecimalField(max_digits=12, decimal_places=2)


class GroupTeacherSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class GroupStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "first_name", "last_name", "phone", "balance", "status")


class GroupListSerializer(serializers.ModelSerializer):
    course = serializers.SerializerMethodField()
    teacher = serializers.SerializerMethodField()
    support_teacher = serializers.SerializerMethodField()
    student_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Group
        fields = (
            "id",
            "name",
            "course",
            "teacher",
            "support_teacher",
            "schedule",
            "start_date",
            "status",
            "student_count",
        )

    def get_course(self, obj):
        return GroupCourseSerializer(obj.course).data

    def get_teacher(self, obj):
        return GroupTeacherSerializer(obj.teacher).data

    def get_support_teacher(self, obj):
        if obj.support_teacher_id is None:
            return None
        return GroupTeacherSerializer(obj.support_teacher).data


class GroupDetailSerializer(GroupListSerializer):
    students = serializers.SerializerMethodField()
    attendance_stats = serializers.SerializerMethodField()

    class Meta(GroupListSerializer.Meta):
        fields = GroupListSerializer.Meta.fields + ("students", "attendance_stats")

    def get_students(self, obj):
        group_links = getattr(obj, "active_student_links", None)
        if group_links is not None:
            students = [group_link.student for group_link in group_links]
        else:
            students = Student.objects.active().filter(
                group_links__group=obj,
                group_links__is_deleted=False,
            )
        return GroupStudentSerializer(students, many=True).data

    def get_attendance_stats(self, obj):
        records = getattr(obj, "active_attendance_records", None)
        if records is None:
            records = obj.attendance_records.active()
        if isinstance(records, list):
            total = len(records)
            present = sum(1 for record in records if record.status == "present")
            absent_excused = sum(1 for record in records if record.status == "absent_excused")
            absent_unexcused = sum(1 for record in records if record.status == "absent_unexcused")
        else:
            total = records.count()
            present = records.filter(status="present").count()
            absent_excused = records.filter(status="absent_excused").count()
            absent_unexcused = records.filter(status="absent_unexcused").count()
        return {
            "total": total,
            "present": present,
            "absent_excused": absent_excused,
            "absent_unexcused": absent_unexcused,
            "present_percentage": round((present / total) * 100, 2) if total else 0,
        }


class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ("name", "course", "teacher", "support_teacher", "schedule", "start_date", "status")


class GroupAddStudentSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=Student.objects.active(), source="student")
