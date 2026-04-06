from django.db import models

from crm_backend.config.base_models import SoftDeleteModel


class Group(SoftDeleteModel):
    class Statuses(models.TextChoices):
        ACTIVE = "active", "Active"
        ARCHIVED = "archived", "Archived"

    name = models.CharField(max_length=150)
    course = models.ForeignKey("courses.Course", on_delete=models.PROTECT, related_name="groups")
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="teaching_groups",
        limit_choices_to={"role": "teacher"},
    )
    support_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        related_name="support_groups",
        limit_choices_to={"role": "support_teacher"},
        null=True,
        blank=True,
    )
    schedule = models.JSONField(default=dict)
    start_date = models.DateField()
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return self.name
