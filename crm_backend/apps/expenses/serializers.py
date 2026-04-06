from rest_framework import serializers

from crm_backend.apps.accounts.models import User
from crm_backend.apps.students.models import Student

from .models import Expense


class ExpenseTeacherSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class ExpenseCreatedBySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


class ExpenseStudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ("id", "first_name", "last_name", "phone", "balance")


class ExpenseSerializer(serializers.ModelSerializer):
    teacher = ExpenseTeacherSerializer(read_only=True)
    support_teacher = ExpenseTeacherSerializer(read_only=True)
    student = ExpenseStudentSerializer(read_only=True)
    created_by = ExpenseCreatedBySerializer(read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "amount",
            "category",
            "teacher",
            "support_teacher",
            "student",
            "note",
            "date",
            "created_by",
        )


class ExpenseCreateUpdateSerializer(serializers.ModelSerializer):
    teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.active().filter(role=User.Roles.TEACHER),
        allow_null=True,
        required=False,
    )
    support_teacher = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.active().filter(role=User.Roles.SUPPORT_TEACHER),
        allow_null=True,
        required=False,
    )
    student = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.active(),
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Expense
        fields = ("amount", "category", "teacher", "support_teacher", "student", "note")

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        teacher = attrs.get("teacher", getattr(self.instance, "teacher", None))
        support_teacher = attrs.get("support_teacher", getattr(self.instance, "support_teacher", None))
        student = attrs.get("student", getattr(self.instance, "student", None))

        if category == Expense.Categories.TEACHER_SALARY and not teacher:
            raise serializers.ValidationError({"teacher": "Teacher is required for teacher salary."})
        if category == Expense.Categories.SUPPORT_SALARY and not support_teacher:
            raise serializers.ValidationError(
                {"support_teacher": "Support teacher is required for support salary."}
            )
        if category == Expense.Categories.STUDENT_REFUND and not student:
            raise serializers.ValidationError({"student": "Student is required for student refund."})
        return attrs
