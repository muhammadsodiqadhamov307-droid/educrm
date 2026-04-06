import { useEffect, useState } from "react";
import { AlertCircle, LifeBuoy, Pencil, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { supportTeachersApi } from "../../api/endpoints/supportTeachers";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import { formatCurrency } from "../../utils/formatCurrency";
import SupportTeacherForm from "./SupportTeacherForm";

function SupportTeachersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [supportTeachers, setSupportTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSupportTeacher, setSelectedSupportTeacher] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [supportTeacherToDelete, setSupportTeacherToDelete] = useState(null);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const loadSupportTeachers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await supportTeachersApi.getAll({
        page,
        search: debouncedSearch || undefined,
      });
      setSupportTeachers(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      setError(t("supportTeachers.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupportTeachers();
  }, [debouncedSearch, page]);

  const handleDelete = async () => {
    if (!supportTeacherToDelete) {
      return;
    }

    await supportTeachersApi.remove(supportTeacherToDelete.id);
    toast.success(t("supportTeachers.deletedSuccess"));
    setSupportTeacherToDelete(null);
    await loadSupportTeachers();
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("supportTeachers.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("supportTeachers.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setSelectedSupportTeacher(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("supportTeachers.add")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <input
          className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 lg:max-w-md"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("supportTeachers.searchPlaceholder")}
          value={search}
        />

        {loading && supportTeachers.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-full" height={56} width={56} />
                <Skeleton className="mt-4 rounded-xl" height={18} width={180} />
                <Skeleton className="mt-3 rounded-2xl" height={64} width="100%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadSupportTeachers} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("supportTeachers.loadErrorTitle")}
          />
        ) : supportTeachers.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedSupportTeacher(null);
                  setShowForm(true);
                }}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                {t("supportTeachers.add")}
              </Button>
            }
            icon={LifeBuoy}
            message={t("supportTeachers.emptyMessage")}
            title={t("supportTeachers.emptyTitle")}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {supportTeachers.map((supportTeacher) => (
              <article
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100"
                key={supportTeacher.id}
              >
                <button
                  className="w-full text-left"
                  onClick={() => navigate(`/support-teachers/${supportTeacher.id}`)}
                  type="button"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700">
                      {(supportTeacher.full_name || "ST")
                        .split(" ")
                        .slice(0, 2)
                        .map((item) => item[0]?.toUpperCase() || "")
                        .join("")}
                    </div>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                      {supportTeacher.share_percent ?? 30}%
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink-900">{supportTeacher.full_name}</h3>
                  <p className="mt-1 text-sm text-ink-500">{supportTeacher.phone || t("common.noData")}</p>
                  <p className="mt-4 text-sm font-semibold text-ink-500">{t("supportTeachers.balance")}</p>
                  <p className="mt-1 text-xl font-extrabold text-emerald-600">
                    {formatCurrency(supportTeacher.balance || 0)}
                  </p>
                </button>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
                  <Button
                    onClick={() => {
                      setSelectedSupportTeacher(supportTeacher);
                      setShowForm(true);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => setSupportTeacherToDelete(supportTeacher)}
                    size="sm"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("supportTeachers.total")}</p>
          <p className="mt-2 text-xl font-extrabold text-ink-900">{totalCount}</p>
        </section>
      </div>

      <SupportTeacherForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadSupportTeachers}
        supportTeacher={selectedSupportTeacher}
      />

      <ConfirmDialog
        isOpen={Boolean(supportTeacherToDelete)}
        message={t("supportTeachers.deleteMessage", {
          name: supportTeacherToDelete?.full_name || "",
        })}
        onClose={() => setSupportTeacherToDelete(null)}
        onConfirm={handleDelete}
        title={t("supportTeachers.deleteTitle")}
      />
    </div>
  );
}

export default SupportTeachersPage;
