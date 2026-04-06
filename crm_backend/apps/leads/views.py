from django.db import transaction
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from crm_backend.apps.students.models import Student
from crm_backend.config.permissions import IsAdmin, IsAdminOrReceptionist
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .filters import LeadFilter
from .models import Lead
from .serializers import LeadCreateUpdateSerializer, LeadSerializer


class LeadViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    filterset_class = LeadFilter
    permission_classes = [IsAuthenticated]
    search_fields = ("first_name", "last_name", "phone")

    def get_queryset(self):
        return (
            Lead.objects.active()
            .select_related("converted_student", "interested_course")
            .order_by("-created_at", "-id")
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return LeadCreateUpdateSerializer
        return LeadSerializer

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
        lead = serializer.save()
        response_serializer = LeadSerializer(lead)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        lead = serializer.save()
        if lead.status == Lead.Statuses.ENROLLED and lead.converted_student_id is None:
            self._convert_lead_to_student(lead)
        response_serializer = LeadSerializer(self.get_queryset().get(id=lead.id))
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        return SoftDeleteModelViewSet.destroy(self, request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="convert-to-student")
    @transaction.atomic
    def convert_to_student(self, request, *args, **kwargs):
        lead = self.get_object()
        if lead.converted_student_id is None:
            self._convert_lead_to_student(lead)
        response_serializer = LeadSerializer(self.get_queryset().get(id=lead.id))
        return Response(response_serializer.data)

    def _convert_lead_to_student(self, lead):
        student = Student.objects.create(
            first_name=lead.first_name,
            last_name=lead.last_name,
            phone=lead.phone,
            source=lead.source,
            status=Student.Statuses.ACTIVE,
            balance=0,
        )
        lead.converted_student = student
        lead.status = Lead.Statuses.ENROLLED
        lead.save(update_fields=["converted_student", "status"])
        return student
