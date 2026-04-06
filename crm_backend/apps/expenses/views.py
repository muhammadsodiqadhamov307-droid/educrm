from django.db import transaction
from django.db.models import F
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from crm_backend.apps.accounts.models import User
from crm_backend.apps.students.models import Student
from crm_backend.config.permissions import IsAdmin
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .filters import ExpenseFilter
from .models import Expense
from .serializers import ExpenseCreateUpdateSerializer, ExpenseSerializer


class ExpenseViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    filterset_class = ExpenseFilter

    def get_queryset(self):
        return (
            Expense.objects.active()
            .select_related("teacher", "support_teacher", "student", "created_by")
            .order_by("-date", "-id")
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return ExpenseCreateUpdateSerializer
        return ExpenseSerializer

    def get_permissions(self):
        return [IsAdmin()]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save(created_by=request.user)
        self._apply_financial_effect(expense)
        response_serializer = ExpenseSerializer(self.get_queryset().get(id=expense.id))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        old_amount = instance.amount
        old_teacher_id = instance.teacher_id
        old_support_teacher_id = instance.support_teacher_id
        old_student_id = instance.student_id
        old_category = instance.category
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save()
        self._reverse_financial_effect(
            old_category,
            old_amount,
            old_teacher_id,
            old_support_teacher_id,
            old_student_id,
        )
        self._apply_financial_effect(expense)
        response_serializer = ExpenseSerializer(self.get_queryset().get(id=expense.id))
        return Response(response_serializer.data)

    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self._reverse_financial_effect(
            instance.category,
            instance.amount,
            instance.teacher_id,
            instance.support_teacher_id,
            instance.student_id,
        )
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def _apply_financial_effect(self, expense):
        if expense.category == Expense.Categories.TEACHER_SALARY and expense.teacher_id:
            User.objects.filter(id=expense.teacher_id).update(balance=F("balance") - expense.amount)
        elif expense.category == Expense.Categories.SUPPORT_SALARY and expense.support_teacher_id:
            User.objects.filter(id=expense.support_teacher_id).update(balance=F("balance") - expense.amount)
        elif expense.category == Expense.Categories.STUDENT_REFUND and expense.student_id:
            Student.objects.filter(id=expense.student_id).update(balance=F("balance") - expense.amount)

    def _reverse_financial_effect(
        self,
        category,
        amount,
        teacher_id=None,
        support_teacher_id=None,
        student_id=None,
    ):
        if category == Expense.Categories.TEACHER_SALARY and teacher_id:
            User.objects.filter(id=teacher_id).update(balance=F("balance") + amount)
        elif category == Expense.Categories.SUPPORT_SALARY and support_teacher_id:
            User.objects.filter(id=support_teacher_id).update(balance=F("balance") + amount)
        elif category == Expense.Categories.STUDENT_REFUND and student_id:
            Student.objects.filter(id=student_id).update(balance=F("balance") + amount)
