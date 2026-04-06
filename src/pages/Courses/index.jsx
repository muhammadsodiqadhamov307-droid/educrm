import { useEffect, useState } from "react";
import { AlertCircle, BookMarked, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { coursesApi } from "../../api/endpoints/courses";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import CourseCard from "./CourseCard";
import CourseDetail from "./CourseDetail";
import CourseForm from "./CourseForm";

function CoursesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [detailCourseId, setDetailCourseId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const loadCourses = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await coursesApi.list({
        page,
        search: debouncedSearch || undefined,
      });
      setCourses(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      setError(t("courses.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [debouncedSearch, page]);

  const handleDelete = async () => {
    if (!courseToDelete) {
      return;
    }

    await coursesApi.remove(courseToDelete.id);
    toast.success(t("courses.deletedSuccess"));
    setCourseToDelete(null);
    await loadCourses();
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("courses.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("courses.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setSelectedCourse(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("courses.addCourse")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <input
          className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 lg:max-w-md"
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("courses.searchPlaceholder")}
          value={search}
        />

        {loading && courses.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={22} width={160} />
                <Skeleton className="mt-3 rounded-xl" height={16} width={120} />
                <Skeleton className="mt-5 rounded-2xl" height={70} width="100%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadCourses} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("courses.loadErrorTitle")}
          />
        ) : courses.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedCourse(null);
                  setShowForm(true);
                }}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                {t("courses.addCourse")}
              </Button>
            }
            icon={BookMarked}
            message={t("courses.emptyMessage")}
            title={t("courses.emptyTitle")}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                canManage
                course={course}
                key={course.id}
                onDelete={setCourseToDelete}
                onEdit={(item) => {
                  setSelectedCourse(item);
                  setShowForm(true);
                }}
                onOpen={(item) => {
                  setDetailCourseId(item.id);
                  setShowDetail(true);
                }}
              />
            ))}
          </div>
        )}

        <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("courses.total")}</p>
          <p className="mt-2 text-xl font-extrabold text-ink-900">{totalCount}</p>
        </section>
      </div>

      <CourseForm course={selectedCourse} isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={loadCourses} />
      <CourseDetail courseId={detailCourseId} isOpen={showDetail} onClose={() => setShowDetail(false)} />

      <ConfirmDialog
        isOpen={Boolean(courseToDelete)}
        message={t("courses.deleteMessage", { name: courseToDelete?.name || "" })}
        onClose={() => setCourseToDelete(null)}
        onConfirm={handleDelete}
        title={t("courses.deleteTitle")}
      />
    </div>
  );
}

export default CoursesPage;
