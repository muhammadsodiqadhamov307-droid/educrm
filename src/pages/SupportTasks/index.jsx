import { useEffect, useState } from "react";
import { AlertCircle, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

import { supportTasksApi } from "../../api/endpoints/supportTasks";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { fetchAllPages } from "../../utils/fetchAllPages";
import { formatDate } from "../../utils/formatDate";

function SupportTasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await fetchAllPages((params) => supportTasksApi.getList(params));
      setTasks(results);
    } catch {
      setError(t("supportTasks.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-ink-900">{t("supportTasks.title")}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("supportTasks.subtitle")}</p>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={20} width={220} />
                <Skeleton className="mt-3 rounded-xl" height={16} width={160} />
                <Skeleton className="mt-4 rounded-2xl" height={56} width="100%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadTasks} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("supportTasks.errorTitle")}
          />
        ) : tasks.length === 0 ? (
          <EmptyState
            action={null}
            icon={ClipboardList}
            message={t("supportTasks.noTasks")}
            title={t("supportTasks.title")}
          />
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const studentName =
                task.student?.full_name ||
                [task.student?.first_name, task.student?.last_name].filter(Boolean).join(" ").trim();

              return (
                <article
                  className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100"
                  key={task.id}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900">{studentName || t("common.noData")}</h3>
                      <p className="mt-1 text-sm text-ink-500">{task.student?.phone || t("common.noData")}</p>
                      <p className="mt-3 text-sm font-semibold text-ink-900">
                        {task.group?.name || t("common.noData")}
                      </p>
                      <p className="mt-1 text-sm text-ink-500">{task.group?.course_name || t("common.noData")}</p>
                      {task.note ? <p className="mt-3 text-sm text-ink-600">{task.note}</p> : null}
                    </div>
                    <p className="text-sm text-ink-500">{formatDate(task.created_at)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default SupportTasksPage;
