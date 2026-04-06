from django.db import models
from django.db.models import Q

from crm_backend.config.base_models import SoftDeleteModel


class Attendance(SoftDeleteModel):
    class Statuses(models.TextChoices):
        PRESENT = "present", "Present"
        ABSENT_EXCUSED = "absent_excused", "Absent Excused"
        ABSENT_UNEXCUSED = "absent_unexcused", "Absent Unexcused"

    student = models.ForeignKey("students.Student", on_delete=models.PROTECT, related_name="attendance_records")
    group = models.ForeignKey("groups.Group", on_delete=models.PROTECT, related_name="attendance_records")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=Statuses.choices)
    grade = models.IntegerField(
        null=True,
        blank=True,
        choices=[(1, 1), (2, 2), (3, 3), (4, 4), (5, 5)],
    )
    created_by = models.ForeignKey(
        "accounts.User", on_delete=models.PROTECT, related_name="created_attendance_records"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("student", "group", "date"),
                condition=Q(is_deleted=False),
                name="unique_active_student_group_attendance_date",
            )
        ]
        ordering = ("-date", "-created_at")

    def __str__(self):
        return f"{self.student} - {self.date} - {self.status}"
