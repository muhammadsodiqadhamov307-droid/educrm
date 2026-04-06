import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { CalendarDays, Save, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { attendanceApi } from "../../api/endpoints/attendance";
import { groupsApi } from "../../api/endpoints/groups";
import ErrorMessage from "../../components/ErrorMessage";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import {
  formatAttendanceColumnLabel,
  formatGroupSchedule,
  generateScheduledDates,
} from "../../utils/schedule";
import AttendanceCell from "./AttendanceCell";

async function fetchAllAttendance(params) {
  let page = 1;
  let next = true;
  const results = [];

  while (next) {
    const { data } = await attendanceApi.list({ ...params, page });
    results.push(...(data.results || []));
    next = Boolean(data.next);
    page += 1;
  }

  return results;
}

function GroupAttendanceSheet({ dateFrom, dateTo, groupId, isOpen, onClose, onSaved }) {
  const { t } = useTranslation();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [openCellKey, setOpenCellKey] = useState("");
  const [pendingByDate, setPendingByDate] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const scheduledDates = useMemo(
    () =>
      generateScheduledDates({
        schedule: group?.schedule,
        startDate: group?.start_date,
        fromDate: dateFrom || null,
        toDate: dateTo || null,
        maxSessions: 30,
      }),
    [dateFrom, dateTo, group?.schedule, group?.start_date],
  );

  useEffect(() => {
    if (!scheduledDates.length) {
      setSelectedDate("");
      return;
    }

    const latest = format(scheduledDates[scheduledDates.length - 1], "yyyy-MM-dd");
    setSelectedDate((current) => (current && scheduledDates.some((date) => format(date, "yyyy-MM-dd") === current) ? current : latest));
  }, [scheduledDates]);

  const attendanceMap = useMemo(() => {
    const map = {};
    attendanceRecords.forEach((record) => {
      if (!map[record.date]) {
        map[record.date] = {};
      }
      map[record.date][record.student.id] = {
        id: record.id,
        status: record.status,
        grade: record.grade ?? null,
      };
    });
    return map;
  }, [attendanceRecords]);

  const displayedRecord = (studentId, dateKey) => {
    if (pendingByDate[dateKey]?.[studentId]) {
      return pendingByDate[dateKey][studentId];
    }
    return attendanceMap[dateKey]?.[studentId] || null;
  };

  const loadSheet = async () => {
    if (!groupId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const groupResponse = await groupsApi.retrieve(groupId);
      setGroup(groupResponse.data);

      const relevantDates = generateScheduledDates({
        schedule: groupResponse.data.schedule,
        startDate: groupResponse.data.start_date,
        fromDate: dateFrom || null,
        toDate: dateTo || null,
        maxSessions: 30,
      });

      if (!relevantDates.length) {
        setAttendanceRecords([]);
        return;
      }

      const records = await fetchAllAttendance({
        group: groupId,
        date__gte: format(relevantDates[0], "yyyy-MM-dd"),
        date__lte: format(relevantDates[relevantDates.length - 1], "yyyy-MM-dd"),
      });
      setAttendanceRecords(records);
      setPendingByDate({});
    } catch {
      setError(t("attendance.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !groupId) {
      return;
    }

    loadSheet();
  }, [dateFrom, dateTo, groupId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setOpenCellKey("");
      setPendingByDate({});
    }
  }, [isOpen]);

  const currentChanges = pendingByDate[selectedDate] || {};

  const mergeSavedRecords = (records) => {
    setAttendanceRecords((current) => {
      const byKey = new Map(
        current.map((record) => [`${record.student.id}-${record.date}`, record]),
      );

      records.forEach((record) => {
        byKey.set(`${record.student.id}-${record.date}`, record);
      });

      return Array.from(byKey.values());
    });
  };

  const clearPendingRecords = (dateKey, studentIds) => {
    setPendingByDate((current) => {
      if (!current[dateKey]) {
        return current;
      }

      const nextDateState = { ...current[dateKey] };
      studentIds.forEach((studentId) => {
        delete nextDateState[studentId];
      });

      if (!Object.keys(nextDateState).length) {
        const nextState = { ...current };
        delete nextState[dateKey];
        return nextState;
      }

      return {
        ...current,
        [dateKey]: nextDateState,
      };
    });
  };

  const refreshGroupState = async () => {
    if (!group?.id) {
      return null;
    }

    const { data } = await groupsApi.retrieve(group.id);
    setGroup(data);
    return data;
  };

  const persistDateRecords = async (dateKey, changes, { showSuccessToast = false } = {}) => {
    if (!group?.id) {
      return [];
    }

    const { data } = await attendanceApi.bulkSave({
      group_id: group.id,
      date: dateKey,
      records: Object.entries(changes).map(([studentId, change]) => ({
        student_id: Number(studentId),
        status: change.status,
        grade: change.grade ?? null,
      })),
    });

    mergeSavedRecords(data);
    clearPendingRecords(dateKey, Object.keys(changes));
    await refreshGroupState();

    if (showSuccessToast) {
      toast.success(t("attendance.savedSuccess"));
    }

    return data;
  };

  const footerStats = useMemo(() => {
    const students = group?.students || [];
    if (!students.length || !selectedDate) {
      return { present: 0, absent: 0, percent: 0 };
    }

    const summary = students.reduce(
      (accumulator, student) => {
        const status = displayedRecord(student.id, selectedDate)?.status;
        if (status === "present") {
          accumulator.present += 1;
        }
        if (status === "absent_excused" || status === "absent_unexcused") {
          accumulator.absent += 1;
        }
        return accumulator;
      },
      { present: 0, absent: 0 },
    );

    const percent = students.length ? Math.round((summary.present / students.length) * 100) : 0;
    return { ...summary, percent };
  }, [group?.students, pendingByDate, selectedDate, attendanceMap]);

  const handleCellSave = async (studentId, dateKey, data) => {
    setPendingByDate((current) => ({
      ...current,
      [dateKey]: {
        ...(current[dateKey] || {}),
        [studentId]: {
          status: data.status,
          grade: data.grade ?? null,
        },
      },
    }));
    setSelectedDate(dateKey);
    setOpenCellKey("");

    try {
      await persistDateRecords(dateKey, {
        [studentId]: {
          status: data.status,
          grade: data.grade ?? null,
        },
      });
      await onSaved();
    } catch {
      toast.error(t("attendance.saveError"));
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !Object.keys(currentChanges).length) {
      toast.error(t("attendance.noChanges"));
      return;
    }

    setIsSaving(true);

    try {
      await persistDateRecords(selectedDate, currentChanges, { showSuccessToast: true });
      await onSaved();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
      <section className="fixed inset-0 z-50 flex flex-col bg-white">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-ink-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
              {group?.course?.name}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold text-ink-900">{group?.name || t("attendance.sheetTitle")}</h2>
            {group ? (
              <p className="mt-2 text-sm text-ink-600">{formatGroupSchedule(group.schedule, t)}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button disabled={!selectedDate} loading={isSaving} onClick={handleSave}>
              <Save className="h-4 w-4" />
              {t("attendance.saveForDate", { date: selectedDate ? formatDate(selectedDate) : "—" })}
            </Button>
            <Button onClick={onClose} variant="secondary">
              <X className="h-4 w-4" />
              {t("common.close")}
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto [WebkitOverflowScrolling:touch]">
          {loading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton className="rounded-2xl" height={72} key={index} width="100%" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorMessage message={error} onRetry={loadSheet} />
            </div>
          ) : group ? (
            scheduledDates.length ? (
              <div className="min-w-max px-4 pb-24 pt-5 sm:px-6">
                  <div className="overflow-x-auto rounded-3xl border border-ink-200 bg-white shadow-sm [WebkitOverflowScrolling:touch]">
                    <table className="min-w-full border-separate border-spacing-0">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr>
                          <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-ink-200 bg-white px-4 py-4 text-left text-sm font-semibold text-ink-600">
                            {t("attendance.studentsColumn")}
                          </th>
                          {scheduledDates.map((dateValue) => {
                            const dateKey = format(dateValue, "yyyy-MM-dd");
                            return (
                              <th
                                className={cn(
                                  "min-w-[92px] border-b border-ink-200 px-3 py-4 text-center text-xs font-semibold whitespace-pre-line text-ink-600",
                                  selectedDate === dateKey && "bg-brand-50 text-brand-700",
                                )}
                                key={dateKey}
                              >
                                {formatAttendanceColumnLabel(dateValue, t)}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {group.students?.map((student) => (
                          <tr key={student.id}>
                            <td
                              className={cn(
                                "sticky left-0 z-10 border-b border-r border-ink-100 bg-white px-4 py-4",
                                student.status === "frozen" && "opacity-60",
                              )}
                            >
                              <p className="font-semibold text-ink-900" title={student.status === "frozen" ? t("attendance.frozen") : undefined}>
                                {student.status === "frozen" ? "❄️ " : ""}
                                {student.first_name} {student.last_name}
                              </p>
                              <p className="mt-1 text-xs text-ink-500">{student.phone}</p>
                              <p
                                className={cn(
                                  "mt-2 text-xs font-semibold",
                                  Number(student.balance) < 0
                                    ? "text-red-600"
                                    : Number(student.balance) > 0
                                      ? "text-green-600"
                                      : "text-ink-500",
                                )}
                              >
                                {formatCurrency(student.balance)}
                              </p>
                            </td>
                            {scheduledDates.map((dateValue) => {
                              const dateKey = format(dateValue, "yyyy-MM-dd");
                              const cellKey = `${student.id}-${dateKey}`;
                              return (
                                <td
                                  className={cn(
                                    "border-b border-ink-100 px-3 py-4 text-center",
                                    selectedDate === dateKey && "bg-brand-50/50",
                                  )}
                                  key={cellKey}
                                >
                                  <AttendanceCell
                                    disabled={student.status === "frozen"}
                                    grade={displayedRecord(student.id, dateKey)?.grade ?? null}
                                    isActiveDate={selectedDate === dateKey}
                                    isOpen={openCellKey === cellKey}
                                    onClose={() => setOpenCellKey("")}
                                    onSave={(data) => handleCellSave(student.id, dateKey, data)}
                                    onToggle={() => {
                                      if (student.status === "frozen") {
                                        return;
                                      }
                                      setSelectedDate(dateKey);
                                      setOpenCellKey((current) => (current === cellKey ? "" : cellKey));
                                    }}
                                    status={displayedRecord(student.id, dateKey)?.status || null}
                                    title={student.status === "frozen" ? t("attendance.frozen") : undefined}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={CalendarDays}
                  message={t("attendance.noScheduledDatesMessage")}
                  title={t("attendance.noScheduledDatesTitle")}
                />
              </div>
            )
          ) : null}
        </div>

        <footer className="sticky bottom-0 border-t border-ink-200 bg-white px-4 py-3 shadow-sm sm:px-6">
          <div className="flex flex-wrap gap-6 text-sm font-semibold text-ink-700">
            <span>{t("attendance.footer.present", { count: footerStats.present })}</span>
            <span>{t("attendance.footer.absent", { count: footerStats.absent })}</span>
            <span>{t("attendance.footer.percent", { count: footerStats.percent })}</span>
          </div>
        </footer>
      </section>,
    document.body,
  );
}

GroupAttendanceSheet.propTypes = {
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
  groupId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
};

export default GroupAttendanceSheet;
