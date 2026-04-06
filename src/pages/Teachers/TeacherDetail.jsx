import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { AlertCircle, CalendarRange, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { teachersApi } from "../../api/endpoints/teachers";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatGroupSchedule } from "../../utils/schedule";

const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_TO_KEY = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

function TeacherDetail({ isOpen, onClose, teacherId }) {
  const { t } = useTranslation();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !teacherId) {
      return;
    }

    const loadTeacher = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await teachersApi.retrieve(teacherId);
        setTeacher(data);
      } catch {
        setError(t("teachers.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadTeacher();
  }, [isOpen, t, teacherId]);

  const scheduleMap = useMemo(() => {
    const map = Object.fromEntries(WEEKDAY_KEYS.map((key) => [key, []]));

    (teacher?.schedule || []).forEach((item) => {
      (item.schedule?.days || []).forEach((day) => {
        const dayKey = DAY_TO_KEY[day];
        if (dayKey) {
          map[dayKey].push({
            group_name: item.group_name,
            time: item.schedule?.time,
          });
        }
      });
    });

    return map;
  }, [teacher?.schedule]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={t("teachers.details")}>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="rounded-2xl" height={88} key={index} width="100%" />
          ))}
        </div>
      ) : error ? (
        <EmptyState action={null} icon={AlertCircle} message={error} title={t("teachers.loadErrorTitle")} />
      ) : teacher ? (
        <div className="space-y-6">
          <section className="rounded-3xl bg-ink-50 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-extrabold text-ink-900">
                  {teacher.full_name || [teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim()}
                </h3>
                <p className="mt-2 text-sm text-ink-600">{teacher.phone || t("common.noData")}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink-400">@{teacher.username}</p>
              </div>
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("teachers.balance")}</p>
                <p className="mt-2 text-xl font-extrabold text-emerald-600">{formatCurrency(teacher.balance)}</p>
                <p className="mt-2 text-sm font-semibold text-ink-600">
                  {t("teachers.sharePercentLabel")}: {teacher.share_percent ?? 30}%
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-brand-600" />
              <h4 className="text-lg font-bold text-ink-900">{t("teachers.groups")}</h4>
            </div>
            {teacher.groups?.length ? (
              <div className="space-y-3">
                {teacher.groups.map((group) => (
                  <div className="rounded-2xl border border-ink-100 bg-white px-4 py-4" key={group.id}>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-ink-900">{group.name}</p>
                        <p className="mt-1 text-sm text-ink-600">{group.course}</p>
                        <p className="mt-2 text-sm text-ink-500">{formatGroupSchedule(group.schedule, t)}</p>
                      </div>
                      <div className="text-sm text-ink-600">
                        <p>{t("teachers.studentCount")}: {group.student_count || 0}</p>
                        <p className="mt-1">{t(`groups.statusOptions.${group.status}`)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState action={null} icon={Users} message={t("teachers.noGroups")} title={t("groups.emptyTitle")} />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-5 w-5 text-emerald-600" />
              <h4 className="text-lg font-bold text-ink-900">{t("teachers.weeklySchedule")}</h4>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {WEEKDAY_KEYS.map((key) => (
                <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4" key={key}>
                  <p className="text-sm font-bold text-ink-900">{t(`weekdays.short.${key}`)}</p>
                  <div className="mt-3 space-y-2">
                    {scheduleMap[key].length ? (
                      scheduleMap[key].map((item, index) => (
                        <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-sm" key={`${item.group_name}-${index}`}>
                          <p className="font-semibold text-ink-900">{item.group_name}</p>
                          <p className="mt-1 text-ink-600">{item.time || t("common.noData")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-ink-400">{t("common.noData")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-ink-100 bg-white px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("teachers.totalStudents")}</p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{teacher.student_count || 0}</p>
          </section>
        </div>
      ) : null}
    </Modal>
  );
}

TeacherDetail.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  teacherId: PropTypes.number,
};

export default TeacherDetail;
