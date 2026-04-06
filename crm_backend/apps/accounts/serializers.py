from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken


User = get_user_model()


def get_user_full_name(user):
    return f"{user.first_name} {user.last_name}".strip() or user.username


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "role", "phone")


class LoginSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["phone"] = user.phone
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        if self.user.is_deleted:
            raise AuthenticationFailed("This account is not available.")
        data["user"] = UserSerializer(self.user).data
        return data


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    def validate_refresh(self, value):
        try:
            RefreshToken(value)
        except Exception as exc:
            raise serializers.ValidationError("Invalid refresh token.") from exc
        return value


class TeacherGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    course = serializers.CharField(source="course.name")
    start_date = serializers.DateField()
    status = serializers.CharField()
    schedule = serializers.JSONField()


class TeacherListSerializer(serializers.ModelSerializer):
    student_count = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "phone",
            "balance",
            "share_percent",
            "student_count",
        )

    def get_full_name(self, obj):
        return get_user_full_name(obj)


class TeacherDetailSerializer(TeacherListSerializer):
    groups = serializers.SerializerMethodField()
    schedule = serializers.SerializerMethodField()

    class Meta(TeacherListSerializer.Meta):
        fields = TeacherListSerializer.Meta.fields + ("groups", "schedule")

    def _get_group_manager(self, obj):
        if obj.role == User.Roles.SUPPORT_TEACHER:
            return obj.support_groups
        return obj.teaching_groups

    def get_groups(self, obj):
        groups = getattr(obj, "active_groups", None)
        if groups is None:
            groups = (
                self._get_group_manager(obj)
                .active()
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
        return TeacherGroupSerializer(groups, many=True).data

    def get_schedule(self, obj):
        groups = getattr(obj, "active_groups", None)
        if groups is None:
            groups = self._get_group_manager(obj).active().filter(course__is_deleted=False)
        seen = set()
        schedules = []
        for group in groups:
            normalized = str(group.schedule)
            if normalized in seen:
                continue
            seen.add(normalized)
            schedules.append(
                {
                    "group_id": group.id,
                    "group_name": group.name,
                    "schedule": group.schedule,
                }
            )
        return schedules


class TeacherCreateUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = (
            "first_name",
            "last_name",
            "username",
            "password",
            "phone",
            "balance",
            "share_percent",
        )

    def validate_username(self, value):
        queryset = User.objects.active().filter(username=value)
        if self.instance is not None:
            queryset = queryset.exclude(id=self.instance.id)
        if queryset.exists():
            raise serializers.ValidationError("A teacher with this username already exists.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        return User.objects.create_user(
            role=User.Roles.TEACHER,
            password=password,
            **validated_data,
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        if password:
            instance.set_password(password)
        instance.role = User.Roles.TEACHER
        instance.save()
        return instance


class SupportTeacherGroupSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    course = serializers.CharField(source="course.name")
    start_date = serializers.DateField()
    status = serializers.CharField()
    schedule = serializers.JSONField()


class SupportTeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "full_name", "phone", "share_percent", "balance", "groups")

    def get_full_name(self, obj):
        return get_user_full_name(obj)

    def get_groups(self, obj):
        groups = getattr(obj, "active_support_groups", None)
        if groups is None:
            groups = obj.support_groups.active().filter(course__is_deleted=False).select_related("course")
        return SupportTeacherGroupSerializer(groups, many=True).data


class SupportTeacherCreateUpdateSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField()
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)

    class Meta:
        model = User
        fields = ("full_name", "phone", "password", "share_percent", "balance")

    def validate_phone(self, value):
        queryset = User.objects.active().filter(Q(phone=value) | Q(username=value))
        if self.instance is not None:
            queryset = queryset.exclude(id=self.instance.id)
        if queryset.exists():
            raise serializers.ValidationError("A support teacher with this phone already exists.")
        return value

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError({"password": "Password is required."})
        return attrs

    def _extract_name_parts(self, full_name):
        parts = full_name.strip().split(maxsplit=1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""
        return first_name, last_name

    def create(self, validated_data):
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name")
        first_name, last_name = self._extract_name_parts(full_name)
        return User.objects.create_user(
            username=validated_data["phone"],
            role=User.Roles.SUPPORT_TEACHER,
            password=password,
            first_name=first_name,
            last_name=last_name,
            **validated_data,
        )

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        full_name = validated_data.pop("full_name", None)
        if full_name is not None:
            first_name, last_name = self._extract_name_parts(full_name)
            instance.first_name = first_name
            instance.last_name = last_name
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.username = instance.phone
        instance.role = User.Roles.SUPPORT_TEACHER
        if password:
            instance.set_password(password)
        instance.save()
        return instance
