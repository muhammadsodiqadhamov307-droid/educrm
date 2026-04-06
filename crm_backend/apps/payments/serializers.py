from rest_framework import serializers

from crm_backend.apps.students.models import Student

from .models import Payment


class PaymentStudentSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.SerializerMethodField()
    balance = serializers.DecimalField(max_digits=12, decimal_places=2)

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class PaymentCreatedBySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()


class PaymentSerializer(serializers.ModelSerializer):
    student = PaymentStudentSerializer(read_only=True)
    created_by = PaymentCreatedBySerializer(read_only=True)

    class Meta:
        model = Payment
        fields = ("id", "student", "amount", "date", "note", "created_by")


class PaymentCreateSerializer(serializers.ModelSerializer):
    student = serializers.PrimaryKeyRelatedField(queryset=Student.objects.active())

    class Meta:
        model = Payment
        fields = ("student", "amount", "note")
