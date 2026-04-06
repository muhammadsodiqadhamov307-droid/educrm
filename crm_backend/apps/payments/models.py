from django.db import models

from crm_backend.config.base_models import SoftDeleteModel


class Payment(SoftDeleteModel):
    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(auto_now_add=True)
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="created_payments"
    )
    note = models.TextField(blank=True)

    class Meta:
        ordering = ("-date", "-id")

    def __str__(self):
        return f"{self.student} - {self.amount}"
