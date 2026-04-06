from django.contrib.auth import get_user_model
from django.db.models import Count, Prefetch, Q
from rest_framework import generics, permissions, status, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from crm_backend.apps.groups.models import Group
from crm_backend.config.permissions import IsAdmin
from crm_backend.config.viewsets import SoftDeleteModelViewSet

from .serializers import (
    LoginSerializer,
    LogoutSerializer,
    SupportTeacherCreateUpdateSerializer,
    SupportTeacherSerializer,
    TeacherCreateUpdateSerializer,
    TeacherDetailSerializer,
    TeacherListSerializer,
    UserSerializer,
)


User = get_user_model()


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer


class RefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        RefreshToken(serializer.validated_data["refresh"]).blacklist()
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class TeacherViewSet(SoftDeleteModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ("first_name", "last_name", "phone", "username")

    def get_queryset(self):
        requested_role = self.request.query_params.get("role")
        role = (
            requested_role
            if requested_role in {User.Roles.TEACHER, User.Roles.SUPPORT_TEACHER}
            else User.Roles.TEACHER
        )
        group_relation = "support_groups" if role == User.Roles.SUPPORT_TEACHER else "teaching_groups"
        queryset = (
            User.objects.active()
            .filter(role=role)
            .annotate(
                student_count=Count(
                    f"{group_relation}__student_links__student",
                    filter=Q(
                        **{
                            f"{group_relation}__is_deleted": False,
                            f"{group_relation}__student_links__is_deleted": False,
                            f"{group_relation}__student_links__student__is_deleted": False,
                        }
                    ),
                    distinct=True,
                )
            )
        )
        if self.action == "retrieve":
            group_queryset = (
                Group.objects.active()
                .filter(course__is_deleted=False)
                .select_related("course")
                .annotate(
                    student_count=Count(
                        "student_links",
                        filter=Q(
                            student_links__is_deleted=False,
                            student_links__student__is_deleted=False,
                        ),
                        distinct=True,
                    )
                )
            )
            queryset = queryset.prefetch_related(
                Prefetch(group_relation, queryset=group_queryset, to_attr="active_groups")
            )
        return queryset.order_by("first_name", "last_name", "id")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TeacherDetailSerializer
        if self.action in {"create", "update", "partial_update"}:
            return TeacherCreateUpdateSerializer
        return TeacherListSerializer

    def get_permissions(self):
        if self.action in {"create", "update", "partial_update", "destroy"}:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        response_serializer = TeacherDetailSerializer(self.get_queryset().get(id=teacher.id))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        teacher = serializer.save()
        response_serializer = TeacherDetailSerializer(self.get_queryset().get(id=teacher.id))
        return Response(response_serializer.data)


class SupportTeacherViewSet(SoftDeleteModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ("first_name", "last_name", "phone", "username")

    def get_queryset(self):
        return (
            User.objects.active()
            .filter(role=User.Roles.SUPPORT_TEACHER)
            .prefetch_related(
                Prefetch(
                    "support_groups",
                    queryset=Group.objects.active()
                    .filter(course__is_deleted=False)
                    .select_related("course"),
                    to_attr="active_support_groups",
                )
            )
            .order_by("first_name", "last_name", "id")
        )

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return SupportTeacherCreateUpdateSerializer
        return SupportTeacherSerializer

    def get_permissions(self):
        if self.action in {"list", "create", "update", "partial_update", "destroy"}:
            permission_classes = [IsAdmin]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if request.user.role != User.Roles.ADMIN and request.user.id != instance.id:
            raise PermissionDenied("You can only view your own support teacher profile.")
        return Response(self.get_serializer(instance).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        support_teacher = serializer.save()
        response_serializer = SupportTeacherSerializer(self.get_queryset().get(id=support_teacher.id))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        support_teacher = serializer.save()
        response_serializer = SupportTeacherSerializer(self.get_queryset().get(id=support_teacher.id))
        return Response(response_serializer.data)
