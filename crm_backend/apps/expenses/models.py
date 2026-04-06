from django.db import models

from crm_backend.config.base_models import SoftDeleteModel


class Expense(SoftDeleteModel):
    class Categories(models.TextChoices):
        TEACHER_SALARY = "teacher_salary", "Teacher Salary"
        SUPPORT_SALARY = "support_salary", "Support Salary"
        STUDENT_REFUND = "student_refund", "Student Refund"
        OTHER = "other", "Other"

    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=20, choices=Categories.choices)
    teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="salary_expenses",
        limit_choices_to={"role": "teacher"},
    )
    support_teacher = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="support_salary_expenses",
        limit_choices_to={"role": "support_teacher"},
    )
    student = models.ForeignKey(
        "students.Student",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="refund_expenses",
    )
    note = models.TextField(blank=True)
    date = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="created_expenses"
    )

    class Meta:
        ordering = ("-date", "-id")

    def __str__(self):
        return f"{self.category} - {self.amount}"
