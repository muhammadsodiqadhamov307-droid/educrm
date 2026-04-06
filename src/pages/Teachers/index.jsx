import { useEffect, useState } from "react";
import { AlertCircle, Plus, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { teachersApi } from "../../api/endpoints/teachers";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import { useUiStore } from "../../store/uiStore";
import TeacherCard from "./TeacherCard";
import TeacherDetail from "./TeacherDetail";
import TeacherForm from "./TeacherForm";

function TeachersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [detailTeacherId, setDetailTeacherId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  const teachersNeedRefresh = useUiStore((state) => state.teachersNeedRefresh);
  const clearTeachersRefresh = useUiStore((state) => state.clearTeachersRefresh);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const loadTeachers = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await teachersApi.list({
        page,
        search: debouncedSearch || undefined,
      });
      setTeachers(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      setError(t("teachers.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (!teachersNeedRefresh) {
      return;
    }

    loadTeachers().finally(() => {
      clearTeachersRefresh();
    });
  }, [clearTeachersRefresh, teachersNeedRefresh]);

  const handleDelete = async () => {
    if (!teacherToDelete) {
      return;
    }

    await teachersApi.remove(teacherToDelete.id);
    toast.success(t("teachers.deletedSuccess"));
    setTeacherToDelete(null);
    await loadTeachers();
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("teachers.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("teachers.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setSelectedTeacher(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("teachers.addTeacher")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <input
          className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 lg:max-w-md"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("teachers.searchPlaceholder")}
          value={search}
        />

        {loading && teachers.length === 0 ? (
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
              <Button onClick={loadTeachers} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("teachers.loadErrorTitle")}
          />
        ) : teachers.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedTeacher(null);
                  setShowForm(true);
                }}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                {t("teachers.addTeacher")}
              </Button>
            }
            icon={UserCheck}
            message={t("teachers.emptyMessage")}
            title={t("teachers.emptyTitle")}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {teachers.map((teacher) => (
              <TeacherCard
                key={teacher.id}
                onDelete={setTeacherToDelete}
                onEdit={(item) => {
                  setSelectedTeacher(item);
                  setShowForm(true);
                }}
                onOpen={(item) => {
                  setDetailTeacherId(item.id);
                  setShowDetail(true);
                }}
                teacher={teacher}
              />
            ))}
          </div>
        )}

        <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("teachers.total")}</p>
          <p className="mt-2 text-xl font-extrabold text-ink-900">{totalCount}</p>
        </section>
      </div>

      <TeacherForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadTeachers}
        teacher={selectedTeacher}
      />
      <TeacherDetail
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        teacherId={detailTeacherId}
      />

      <ConfirmDialog
        isOpen={Boolean(teacherToDelete)}
        message={t("teachers.deleteMessage", {
          name:
            teacherToDelete?.full_name ||
            [teacherToDelete?.first_name, teacherToDelete?.last_name].filter(Boolean).join(" ").trim(),
        })}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={handleDelete}
        title={t("teachers.deleteTitle")}
      />
    </div>
  );
}

export default TeachersPage;
