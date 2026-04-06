from django.contrib.auth.models import AbstractUser, UserManager as DjangoUserManager
from django.db import models

from crm_backend.config.base_models import SoftDeleteModel, SoftDeleteQuerySet


class UserManager(DjangoUserManager.from_queryset(SoftDeleteQuerySet)):
    def active(self):
        return self.get_queryset().active()

    def create_user(self, username, email=None, password=None, **extra_fields):
        if not extra_fields.get("role"):
            raise ValueError("The role field is required.")
        if not extra_fields.get("phone"):
            raise ValueError("The phone field is required.")
        return super().create_user(username, email=email, password=password, **extra_fields)

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("role", User.Roles.ADMIN)
        if not extra_fields.get("phone"):
            raise ValueError("Superusers must have a phone number.")
        return super().create_superuser(username, email=email, password=password, **extra_fields)


class User(AbstractUser, SoftDeleteModel):
    class Roles(models.TextChoices):
        ADMIN = "admin", "Admin"
        RECEPTIONIST = "receptionist", "Receptionist"
        TEACHER = "teacher", "Teacher"
        SUPPORT_TEACHER = "support_teacher", "Support Teacher"

    role = models.CharField(max_length=20, choices=Roles.choices)
    phone = models.CharField(max_length=20)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    share_percent = models.DecimalField(max_digits=5, decimal_places=2, default=30)
    objects = UserManager()
    REQUIRED_FIELDS = ["phone"]

    def __str__(self):
        return self.get_username()
