from rest_framework import serializers

from .models import Course


class CourseGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    teacher = serializers.SerializerMethodField()
    start_date = serializers.DateField()
    status = serializers.CharField()
    schedule = serializers.JSONField()
    student_count = serializers.IntegerField(read_only=True)

    def get_teacher(self, obj):
        return {
            "id": obj.teacher_id,
            "full_name": f"{obj.teacher.first_name} {obj.teacher.last_name}".strip() or obj.teacher.username,
        }


class CourseTeacherSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    phone = serializers.CharField()


class CourseListSerializer(serializers.ModelSerializer):
    group_count = serializers.IntegerField(read_only=True)
    student_count = serializers.IntegerField(read_only=True)
    price = serializers.DecimalField(source="daily_price", max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Course
        fields = (
            "id",
            "name",
            "price",
            "daily_price",
            "monthly_price",
            "duration_months",
            "description",
            "group_count",
            "student_count",
        )


class CourseDetailSerializer(CourseListSerializer):
    groups = serializers.SerializerMethodField()
    teachers = serializers.SerializerMethodField()

    class Meta(CourseListSerializer.Meta):
        fields = CourseListSerializer.Meta.fields + ("groups", "teachers")

    def get_groups(self, obj):
        groups = getattr(obj, "active_groups", None)
        if groups is None:
            groups = (
                obj.groups.active()
                .filter(teacher__is_deleted=False)
                .select_related("teacher")
            )
        return CourseGroupSerializer(groups, many=True).data

    def get_teachers(self, obj):
        groups = getattr(obj, "active_groups", None)
        if groups is None:
            groups = obj.groups.active().filter(teacher__is_deleted=False).select_related("teacher")
        seen = set()
        teachers = []
        for group in groups:
            if group.teacher_id in seen:
                continue
            seen.add(group.teacher_id)
            teachers.append(group.teacher)
        return CourseTeacherSerializer(teachers, many=True).data


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ("name", "daily_price", "monthly_price", "duration_months", "description")
