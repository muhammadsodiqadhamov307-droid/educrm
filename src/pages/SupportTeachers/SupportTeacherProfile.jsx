import { useEffect, useMemo, useState } from "react";
import { AlertCircle, LifeBuoy, Phone, Users } from "lucide-react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { supportTasksApi } from "../../api/endpoints/supportTasks";
import { supportTeachersApi } from "../../api/endpoints/supportTeachers";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { fetchAllPages } from "../../utils/fetchAllPages";
import { formatGroupSchedule } from "../../utils/schedule";

function SupportTeacherProfilePage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const user = useAuthStore((state) => state.user);
  const [supportTeacher, setSupportTeacher] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const targetId = useMemo(() => {
    if (!id || id === "me") {
      return user?.id;
    }
    return Number(id);
  }, [id, user?.id]);

  useEffect(() => {
    if (!targetId) {
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const [supportTeacherResponse, tasksResponse] = await Promise.all([
          supportTeachersApi.getById(targetId),
          fetchAllPages((params) => supportTasksApi.getList({ ...params, support_teacher: targetId })),
        ]);

        setSupportTeacher(supportTeacherResponse.data);
        setTasks(tasksResponse);
      } catch {
        setError(t("supportTeachers.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [t, targetId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="rounded-3xl" height={120} key={index} width="100%" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        action={null}
        icon={AlertCircle}
        message={error}
        title={t("supportTeachers.loadErrorTitle")}
      />
    );
  }

  if (!supportTeacher) {
    return (
      <EmptyState
        action={null}
        icon={LifeBuoy}
        message={t("supportTeachers.emptyMessage")}
        title={t("supportTeachers.emptyTitle")}
      />
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              {t("supportTeachers.profile")}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-ink-900">{supportTeacher.full_name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-600">
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {supportTeacher.phone || t("common.noData")}
              </span>
              <span>{t("supportTeachers.sharePercent")}: {supportTeacher.share_percent ?? 30}%</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white px-5 py-4 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("supportTeachers.balance")}</p>
            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
              {formatCurrency(supportTeacher.balance || 0)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-inset ring-white/70">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-ink-900">{t("supportTeachers.groups")}</h2>
        </div>

        {supportTeacher.groups?.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {supportTeacher.groups.map((group) => (
              <article className="rounded-2xl border border-ink-100 bg-white px-4 py-4" key={group.id}>
                <h3 className="text-lg font-bold text-ink-900">{group.name}</h3>
                <p className="mt-1 text-sm text-ink-600">{group.course}</p>
                <p className="mt-2 text-sm text-ink-500">{formatGroupSchedule(group.schedule, t)}</p>
                <p className="mt-2 text-sm text-ink-500">{formatDate(group.start_date)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              action={null}
              icon={Users}
              message={t("supportTeachers.noGroups")}
              title={t("groups.emptyTitle")}
            />
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white/70 p-5 shadow-sm ring-1 ring-inset ring-white/70">
        <div className="flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-brand-600" />
          <h2 className="text-lg font-bold text-ink-900">{t("supportTeachers.sentStudents")}</h2>
        </div>

        {tasks.length ? (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => {
              const studentName =
                task.student?.full_name ||
                [task.student?.first_name, task.student?.last_name].filter(Boolean).join(" ").trim();

              return (
                <article
                  className="rounded-2xl border border-ink-100 bg-white px-4 py-4"
                  key={task.id}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-ink-900">{studentName || t("common.noData")}</p>
                      <p className="mt-1 text-sm text-ink-500">{task.group?.name || t("common.noData")}</p>
                      {task.note ? <p className="mt-2 text-sm text-ink-600">{task.note}</p> : null}
                    </div>
                    <p className="text-sm text-ink-500">{formatDate(task.created_at)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-4">
            <EmptyState
              action={null}
              icon={LifeBuoy}
              message={t("supportTeachers.noSentStudents")}
              title={t("supportTeachers.sentStudents")}
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default SupportTeacherProfilePage;
