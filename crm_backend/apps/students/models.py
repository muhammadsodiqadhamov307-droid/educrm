from django.db import models
from django.db.models import Q

from crm_backend.config.base_models import SoftDeleteModel


class Student(SoftDeleteModel):
    class Statuses(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        FROZEN = "frozen", "Frozen"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    phone2 = models.CharField(max_length=20, blank=True)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    free_lessons_total = models.IntegerField(default=0)
    free_lessons_remaining = models.IntegerField(default=0)
    freeze_refund_done = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.ACTIVE)
    source = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class GroupStudent(SoftDeleteModel):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="group_links")
    group = models.ForeignKey("groups.Group", on_delete=models.PROTECT, related_name="student_links")
    joined_date = models.DateField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("student", "group"),
                condition=Q(is_deleted=False),
                name="unique_active_student_group",
            )
        ]

    def __str__(self):
        return f"{self.student} - {self.group}"


class StudentSupportTask(SoftDeleteModel):
    class Statuses(models.TextChoices):
        PENDING = "pending", "Pending"
        CALLED = "called", "Called"
        COMPLETED = "completed", "Completed"

    student = models.ForeignKey(
        "students.Student",
        on_delete=models.CASCADE,
        related_name="support_tasks",
    )
    support_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="tasks",
        limit_choices_to={"role": "support_teacher"},
    )
    group = models.ForeignKey("groups.Group", on_delete=models.CASCADE, related_name="support_tasks")
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.PENDING)
    created_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="created_tasks",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")

    def __str__(self):
        return f"{self.student} -> {self.support_teacher} ({self.status})"
