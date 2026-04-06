import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CalendarCheck, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { attendanceApi } from "../../api/endpoints/attendance";
import { groupsApi } from "../../api/endpoints/groups";
import { teachersApi } from "../../api/endpoints/teachers";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import { formatDate } from "../../utils/formatDate";
import { formatGroupSchedule } from "../../utils/schedule";
import GroupAttendanceSheet from "./GroupAttendanceSheet";

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

function AttendancePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teacherId, setTeacherId] = useState(isAdmin ? "all" : String(user?.id || ""));
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showSheet, setShowSheet] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({});

  const filters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      teacher: isAdmin ? (teacherId !== "all" ? teacherId : undefined) : user?.id,
    }),
    [debouncedSearch, isAdmin, teacherId, user?.id],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const loadTeachers = async () => {
      const teachersResponse = await fetchAllPages((params) => teachersApi.list(params));
      setTeachers(teachersResponse);
    };

    loadTeachers();
  }, [isAdmin]);

  const loadGroups = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await groupsApi.list(filters);
      const groupResults = data.results || [];
      setGroups(groupResults);

      const summaryPairs = await Promise.all(
        groupResults.map(async (group) => {
          const attendanceParams = {
            group: group.id,
            teacher: isAdmin ? (teacherId !== "all" ? teacherId : undefined) : user?.id,
            date__gte: dateFrom || undefined,
            date__lte: dateTo || undefined,
          };
          const response = await attendanceApi.list(attendanceParams);
          return [group.id, response.data.count || 0];
        }),
      );

      setAttendanceSummary(Object.fromEntries(summaryPairs));
    } catch {
      setError(t("attendance.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [filters, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("attendance.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("attendance.subtitle")}</p>
          </div>
          <Button onClick={loadGroups} variant="secondary">
            {t("dashboard.refresh")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("attendance.searchPlaceholder")}
            value={search}
          />

          <input
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setDateFrom(event.target.value)}
            type="date"
            value={dateFrom}
          />

          <input
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setDateTo(event.target.value)}
            type="date"
            value={dateTo}
          />

          {isAdmin ? (
            <select
              className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setTeacherId(event.target.value)}
              value={teacherId}
            >
              <option value="all">{t("attendance.allTeachers")}</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim() || teacher.phone}
                </option>
              ))}
            </select>
          ) : (
            <div className="rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-600">
              {t("attendance.teacherOnlyView")}
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={18} width={180} />
                <Skeleton className="mt-3 rounded-xl" height={14} width={140} />
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
            title={t("attendance.loadErrorTitle")}
          />
        ) : groups.length ? (
          <div className="space-y-3">
            {groups.map((group) => (
              <button
                className="flex w-full flex-col gap-4 rounded-2xl bg-white px-5 py-4 text-left shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md md:flex-row md:items-center md:justify-between"
                key={group.id}
                onClick={() => {
                  setSelectedGroupId(group.id);
                  setShowSheet(true);
                }}
                type="button"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink-900">{group.name}</p>
                  <p className="mt-1 text-sm text-ink-600">
                    {group.course?.name} • {group.teacher?.full_name}
                  </p>
                  <p className="mt-2 text-xs text-ink-500">{formatGroupSchedule(group.schedule, t)}</p>
                </div>

                <div className="flex items-center gap-4 text-sm font-semibold text-ink-600">
                  <div className="rounded-2xl bg-ink-50 px-4 py-3 text-center">
                    <p className="text-xs uppercase tracking-[0.16em] text-ink-500">{t("attendance.startDate")}</p>
                    <p className="mt-1 text-sm font-bold text-ink-900">{formatDate(group.start_date)}</p>
                  </div>
                  <div className="rounded-2xl bg-brand-50 px-4 py-3 text-center text-brand-700">
                    <p className="text-xs uppercase tracking-[0.16em]">{t("attendance.recordsCount")}</p>
                    <p className="mt-1 text-sm font-bold">{attendanceSummary[group.id] || 0}</p>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 text-ink-400 md:block" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CalendarCheck}
            message={t("attendance.emptyMessage")}
            title={t("attendance.emptyTitle")}
          />
        )}
      </section>

      <GroupAttendanceSheet
        dateFrom={dateFrom}
        dateTo={dateTo}
        groupId={selectedGroupId}
        isOpen={showSheet}
        onClose={() => setShowSheet(false)}
        onSaved={loadGroups}
      />
    </div>
  );
}

export default AttendancePage;
