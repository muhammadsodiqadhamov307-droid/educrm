from django.core.validators import RegexValidator
from django.db import models

from crm_backend.config.base_models import SoftDeleteModel


phone_validator = RegexValidator(
    regex=r"^(\+998\d{9}|998\d{9}|0\d{9})$",
    message="Telefon raqam noto'g'ri formatda. Namuna: +998901234567",
)


class Lead(SoftDeleteModel):
    class Statuses(models.TextChoices):
        NEW = "new", "New"
        CONTACTED = "contacted", "Contacted"
        ENROLLED = "enrolled", "Enrolled"
        REJECTED = "rejected", "Rejected"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20, unique=True, validators=[phone_validator])
    phone2 = models.CharField(max_length=20, blank=True, default="")
    note = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Statuses.choices, default=Statuses.NEW)
    source = models.CharField(max_length=255, blank=True)
    interested_course = models.ForeignKey(
        "courses.Course",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interested_leads",
    )
    converted_student = models.ForeignKey(
        "students.Student",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="converted_leads",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
