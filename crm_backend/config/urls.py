from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from crm_backend.apps.accounts import urls as account_urls
from crm_backend.apps.accounts.views import TeacherViewSet
from crm_backend.apps.attendance.views import AttendanceViewSet
from crm_backend.apps.courses.views import CourseViewSet
from crm_backend.apps.dashboard.views import DashboardStatsView
from crm_backend.apps.expenses.views import ExpenseViewSet
from crm_backend.apps.groups.views import GroupViewSet
from crm_backend.apps.leads.views import LeadViewSet
from crm_backend.apps.payments.views import PaymentViewSet
from crm_backend.apps.students.views import StudentViewSet, SupportTaskViewSet


router = DefaultRouter()
router.register("students", StudentViewSet, basename="student")
router.register("groups", GroupViewSet, basename="group")
router.register("courses", CourseViewSet, basename="course")
router.register("teachers", TeacherViewSet, basename="teacher")
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register("payments", PaymentViewSet, basename="payment")
router.register("leads", LeadViewSet, basename="lead")
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("support-tasks", SupportTaskViewSet, basename="support-task")


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include((account_urls.auth_urlpatterns, "auth"))),
    path("api/accounts/", include((account_urls.account_urlpatterns, "accounts"))),
    path("api/dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("api/", include(router.urls)),
]
