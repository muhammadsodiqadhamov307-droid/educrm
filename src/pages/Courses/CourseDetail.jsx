import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { AlertCircle, BookOpen, GraduationCap, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { coursesApi } from "../../api/endpoints/courses";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatGroupSchedule } from "../../utils/schedule";

function CourseDetail({ courseId, isOpen, onClose }) {
  const { t } = useTranslation();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !courseId) {
      return;
    }

    const loadCourse = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await coursesApi.retrieve(courseId);
        setCourse(data);
      } catch {
        setError(t("courses.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, isOpen, t]);

  const totalStudents = course?.groups?.reduce((sum, group) => sum + Number(group.student_count || 0), 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("courses.details")}>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="rounded-2xl" height={80} key={index} width="100%" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          action={
            <Button onClick={onClose} variant="secondary">
              {t("common.close")}
            </Button>
          }
          icon={AlertCircle}
          message={error}
          title={t("courses.loadErrorTitle")}
        />
      ) : course ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-ink-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-ink-900">{course.name}</h3>
                <p className="mt-2 text-sm leading-7 text-ink-600">{course.description || t("common.noData")}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("courses.dailyPrice")}</p>
                <p className="mt-2 text-xl font-extrabold text-brand-700">{formatCurrency(course.daily_price)}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("courses.monthlyPrice")}</p>
                <p className="mt-2 text-lg font-extrabold text-violet-700">{formatCurrency(course.monthly_price)}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  {t("courses.duration")}
                </p>
                <p className="mt-2 text-lg font-bold text-ink-900">
                  {t("courses.durationLabel", { count: course.duration_months })}
                </p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  {t("courses.groupCount", { count: course.group_count })}
                </p>
                <p className="mt-2 text-lg font-bold text-ink-900">{course.group_count}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                  {t("courses.totalStudents")}
                </p>
                <p className="mt-2 text-lg font-bold text-ink-900">{totalStudents}</p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <h4 className="text-lg font-bold text-ink-900">{t("groups.title")}</h4>
            </div>
            {course.groups?.length ? (
              <div className="space-y-3">
                {course.groups.map((group) => (
                  <div className="rounded-2xl border border-ink-100 bg-white px-4 py-4" key={group.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-ink-900">{group.name}</p>
                        <p className="mt-1 text-sm text-ink-600">{group.teacher?.full_name || t("common.noData")}</p>
                        <p className="mt-2 text-sm text-ink-500">{formatGroupSchedule(group.schedule, t)}</p>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <Badge value={group.status === "archived" ? "inactive" : group.status}>
                          {t(`groups.statusOptions.${group.status}`)}
                        </Badge>
                        <p className="text-sm font-semibold text-ink-600">
                          {t("courses.groupCount", { count: group.student_count || 0 })}
                        </p>
                        <p className="text-xs text-ink-500">{formatDate(group.start_date)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState action={null} icon={BookOpen} message={t("courses.noGroups")} title={t("groups.emptyTitle")} />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              <h4 className="text-lg font-bold text-ink-900">{t("courses.teachers")}</h4>
            </div>
            {course.teachers?.length ? (
              <div className="flex flex-wrap gap-3">
                {course.teachers.map((teacher) => (
                  <div
                    className="inline-flex items-center gap-3 rounded-2xl border border-ink-100 bg-ink-50 px-4 py-3"
                    key={teacher.id}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {[teacher.first_name, teacher.last_name]
                        .filter(Boolean)
                        .map((part) => part[0]?.toUpperCase() || "")
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim()}
                      </p>
                      <p className="text-xs text-ink-500">{teacher.phone || t("common.noData")}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState action={null} icon={Users} message={t("courses.noTeachers")} title={t("teachers.emptyTitle")} />
            )}
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

CourseDetail.propTypes = {
  courseId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CourseDetail;
