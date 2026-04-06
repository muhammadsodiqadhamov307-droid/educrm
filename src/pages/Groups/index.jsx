import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BookOpen, UserPlus2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { coursesApi } from "../../api/endpoints/courses";
import { groupsApi } from "../../api/endpoints/groups";
import { teachersApi } from "../../api/endpoints/teachers";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import GroupCard from "./GroupCard";
import GroupDetail from "./GroupDetail";
import GroupForm from "./GroupForm";

async function fetchAllPages(request) {
  let page = 1;
  let next = true;
  const results = [];

  while (next) {
    const { data } = await request({ page });
    results.push(...(data.results || []));
    next = Boolean(data.next);
    page += 1;
  }

  return results;
}

function GroupsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const canManage = user?.role === "admin";
  const canManageStudents = user?.role === "admin" || user?.role === "receptionist";

  const [groups, setGroups] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [courseId, setCourseId] = useState("all");
  const [teacherId, setTeacherId] = useState("all");
  const [status, setStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailGroupId, setDetailGroupId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState(null);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  const filters = useMemo(
    () => ({
      page: currentPage,
      search: debouncedSearch || undefined,
      course: courseId !== "all" ? courseId : undefined,
      teacher: teacherId !== "all" ? teacherId : undefined,
      status: status !== "all" ? status : undefined,
    }),
    [courseId, currentPage, debouncedSearch, status, teacherId],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (courseId !== "all" || teacherId !== "all" || status !== "all") {
      setCurrentPage(1);
    }
  }, [courseId, teacherId, status]);

  useEffect(() => {
    const loadOptions = async () => {
      const [coursesResponse, teachersResponse] = await Promise.all([
        fetchAllPages((params) => coursesApi.list(params)),
        fetchAllPages((params) => teachersApi.list(params)),
      ]);

      setCourses(coursesResponse);
      setTeachers(teachersResponse);
    };

    loadOptions();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await groupsApi.list(filters);
      setGroups(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      setError(t("groups.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [filters]);

  const handleDelete = async () => {
    if (!groupToDelete) {
      return;
    }

    await groupsApi.remove(groupToDelete.id);
    toast.success(t("groups.deletedSuccess"));
    setGroupToDelete(null);

    if (groups.length === 1 && currentPage > 1) {
      setCurrentPage((previousPage) => previousPage - 1);
    } else {
      await loadGroups();
    }
  };

  const openCreate = () => {
    setSelectedGroup(null);
    setShowForm(true);
  };

  const openEdit = (group) => {
    setSelectedGroup(group);
    setShowForm(true);
  };

  const openDetail = (group) => {
    setDetailGroupId(group.id);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("groups.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("groups.subtitle")}</p>
          </div>
          {canManage ? (
            <Button onClick={openCreate}>
              <UserPlus2 className="h-4 w-4" />
              {t("groups.addGroup")}
            </Button>
          ) : null}
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("groups.searchPlaceholder")}
            value={search}
          />

          <select
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setCourseId(event.target.value)}
            value={courseId}
          >
            <option value="all">{t("groups.allCourses")}</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setTeacherId(event.target.value)}
            value={teacherId}
          >
            <option value="all">{t("groups.allTeachers")}</option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim() || teacher.phone}
              </option>
            ))}
          </select>

          <select
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">{t("groups.allStatuses")}</option>
            <option value="active">{t("groups.statusOptions.active")}</option>
            <option value="archived">{t("groups.statusOptions.archived")}</option>
          </select>
        </div>

        {loading && groups.length === 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={22} width={160} />
                <Skeleton className="mt-4 rounded-xl" height={16} width={120} />
                <Skeleton className="mt-6 rounded-2xl" height={64} width="100%" />
                <Skeleton className="mt-5 rounded-xl" height={16} width={100} />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadGroups} variant="secondary">
                {t("dashboard.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("groups.loadErrorTitle")}
          />
        ) : groups.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => (
              <GroupCard
                canManage={canManage}
                group={group}
                key={group.id}
                onDelete={setGroupToDelete}
                onEdit={openEdit}
                onOpen={openDetail}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action={
              canManage ? (
                <Button onClick={openCreate} variant="secondary">
                  {t("groups.addGroup")}
                </Button>
              ) : null
            }
            icon={BookOpen}
            message={t("groups.emptyMessage")}
            title={t("groups.emptyTitle")}
          />
        )}

        <Pagination currentPage={currentPage} onPageChange={setCurrentPage} totalPages={totalPages} />
      </section>

      <GroupForm
        group={selectedGroup}
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadGroups}
      />

      <GroupDetail
        canManageStudents={canManageStudents}
        groupId={detailGroupId}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
        onRefresh={loadGroups}
      />

      <ConfirmDialog
        isOpen={Boolean(groupToDelete)}
        message={t("groups.deleteMessage", { name: groupToDelete?.name || "" })}
        onClose={() => setGroupToDelete(null)}
        onConfirm={handleDelete}
        title={t("groups.deleteTitle")}
      />
    </div>
  );
}

export default GroupsPage;
