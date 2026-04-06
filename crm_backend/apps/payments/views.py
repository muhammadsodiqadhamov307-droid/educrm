from django.db import transaction
from django.db.models import F
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_backend.apps.students.models import Student
from crm_backend.config.permissions import IsAdmin, IsAdminOrReceptionist

from .filters import PaymentFilter
from .models import Payment
from .serializers import PaymentCreateSerializer, PaymentSerializer


class PaymentViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    filterset_class = PaymentFilter
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Payment.objects.active()
            .filter(student__is_deleted=False)
            .select_related("student", "created_by")
            .order_by("-date", "-id")
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return PaymentCreateSerializer
        return PaymentSerializer

    def get_permissions(self):
        if self.action == "destroy":
            permission_classes = [IsAdmin]
        else:
            permission_classes = [IsAdminOrReceptionist]
        return [permission() for permission in permission_classes]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save(created_by=request.user)
        Student.objects.filter(id=payment.student_id).update(balance=F("balance") + payment.amount)
        response_serializer = PaymentSerializer(self.get_queryset().get(id=payment.id))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_amount = instance.amount
        old_student_id = instance.student_id
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        payment = serializer.save()
        if payment.student_id == old_student_id:
            Student.objects.filter(id=payment.student_id).update(
                balance=F("balance") - old_amount + payment.amount
            )
        else:
            Student.objects.filter(id=old_student_id).update(balance=F("balance") - old_amount)
            Student.objects.filter(id=payment.student_id).update(balance=F("balance") + payment.amount)
        response_serializer = PaymentSerializer(self.get_queryset().get(id=payment.id))
        return Response(response_serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        Student.objects.filter(id=instance.student_id).update(balance=F("balance") - instance.amount)
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
