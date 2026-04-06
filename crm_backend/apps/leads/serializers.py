from rest_framework import serializers

from rest_framework.validators import UniqueValidator

from crm_backend.apps.courses.models import Course

from .models import Lead


class LeadConvertedStudentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class LeadSerializer(serializers.ModelSerializer):
    class InterestedCourseSerializer(serializers.Serializer):
        id = serializers.IntegerField()
        name = serializers.CharField()

    converted_student = LeadConvertedStudentSerializer(read_only=True)
    interested_course = InterestedCourseSerializer(read_only=True)

    class Meta:
        model = Lead
        fields = (
            "id",
            "first_name",
            "last_name",
            "phone",
            "phone2",
            "note",
            "status",
            "source",
            "interested_course",
            "created_at",
            "converted_student",
        )


class LeadCreateUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(
        validators=[
            UniqueValidator(
                queryset=Lead.objects.all(),
                message="Bu telefon raqam allaqachon mavjud",
            )
        ]
    )
    interested_course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.active(),
        allow_null=True,
        required=False,
    )
    phone2 = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Lead
        fields = (
            "first_name",
            "last_name",
            "phone",
            "phone2",
            "note",
            "status",
            "source",
            "interested_course",
        )
