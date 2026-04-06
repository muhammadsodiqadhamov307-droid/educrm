from django.db import models

from crm_backend.config.base_models import SoftDeleteModel


class Course(SoftDeleteModel):
    name = models.CharField(max_length=150)
    daily_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    duration_months = models.PositiveIntegerField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("name",)

    def __str__(self):
        return self.name
