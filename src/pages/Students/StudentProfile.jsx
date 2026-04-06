import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Phone, Receipt, Users, Wallet, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { studentsApi } from "../../api/endpoints/students";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

function formatSchedule(schedule) {
  const days = Array.isArray(schedule?.days) ? schedule.days.join(", ") : "";
  const time = schedule?.time || "";
  return [days, time].filter(Boolean).join(" • ");
}

function StudentProfile({ isOpen, onClose, studentId }) {
  const { t } = useTranslation();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initials = useMemo(() => {
    const source = `${student?.first_name || ""} ${student?.last_name || ""}`.trim();
    if (!source) {
      return "ST";
    }
    return source
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [student?.first_name, student?.last_name]);

  const loadStudent = async () => {
    if (!studentId) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await studentsApi.retrieve(studentId);
      setStudent(data);
    } catch {
      setError(t("students.profileError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !studentId) {
      return;
    }

    loadStudent();
  }, [isOpen, studentId]);

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 transition",
        isOpen ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 bg-ink-950/35 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-soft transition-transform duration-300 sm:max-w-[420px]",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-lg font-bold text-ink-900">{t("students.profileTitle")}</h2>
          <button
            className="rounded-full p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="space-y-3" key={index}>
                  <Skeleton className="rounded-xl" height={20} width={150} />
                  <Skeleton className="rounded-2xl" height={96} width="100%" />
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState
              action={
                <Button onClick={loadStudent} variant="secondary">
                  {t("dashboard.retry")}
                </Button>
              }
              icon={Users}
              message={error}
              title={t("students.profileErrorTitle")}
            />
          ) : student ? (
            <div className="space-y-6">
              <section className="rounded-3xl bg-ink-950 px-5 py-5 text-white">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-lg font-extrabold text-white">
                    {initials}
                  </div>
                  <div>
                    <p className="text-xl font-extrabold">
                      {student.first_name} {student.last_name}
                    </p>
                    <div className="mt-2">
                      <Badge value={student.status}>{t(`students.statusOptions.${student.status}`)}</Badge>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-ink-100 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-500">
                  {t("students.contactInfo")}
                </h3>
                <div className="space-y-3 text-sm text-ink-700">
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-ink-400" />
                    <span>{student.phone}</span>
                  </p>
                  <p>{t("students.phone2")}: {student.phone2 || t("common.noData")}</p>
                  <p>{t("students.source")}: {student.source || t("common.noData")}</p>
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-ink-100 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-500">
                  {t("students.financialInfo")}
                </h3>
                <div className="space-y-2">
                  <p
                    className={cn(
                      "text-3xl font-extrabold",
                      Number(student.balance) < 0
                        ? "text-red-600"
                        : Number(student.balance) > 0
                          ? "text-green-600"
                          : "text-ink-900",
                    )}
                  >
                    {formatCurrency(student.balance)}
                  </p>
                  <p className="text-sm text-ink-600">
                    {t("students.discount")}: {student.discount}%
                  </p>
                  {Number(student.free_lessons_remaining || 0) > 0 ? (
                    <p className="text-sm font-semibold text-emerald-600">
                      {t("students.freeLessonsLabel")}: {student.free_lessons_remaining} {t("students.freeLessons")}
                    </p>
                  ) : null}
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-ink-100 p-5">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-ink-500">
                  {t("students.groupsTitle")}
                </h3>
                <div className="space-y-3">
                  {student.groups?.length ? (
                    student.groups.map((group) => (
                      <div className="rounded-2xl bg-ink-50 px-4 py-3" key={group.id}>
                        <p className="font-semibold text-ink-900">{group.name}</p>
                        <p className="mt-1 text-sm text-ink-600">{group.course}</p>
                        <p className="mt-1 text-xs text-ink-500">{formatSchedule(group.schedule)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ink-500">{t("students.noGroups")}</p>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-ink-100 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-ink-500">
                  <Receipt className="h-4 w-4" />
                  {t("students.paymentsTitle")}
                </h3>
                <div className="space-y-3">
                  {student.payments?.length ? (
                    student.payments.map((payment) => (
                      <div className="rounded-2xl bg-ink-50 px-4 py-3" key={payment.id}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-ink-900">{formatCurrency(payment.amount)}</p>
                          <p className="text-xs text-ink-500">{formatDate(payment.date)}</p>
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{payment.note || t("common.noData")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-ink-500">{t("students.noPayments")}</p>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-3xl border border-ink-100 p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-ink-500">
                  <Wallet className="h-4 w-4" />
                  {t("students.attendanceTitle")}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-ink-50 px-3 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                      {t("students.present")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-ink-900">
                      {student.attendance_summary?.total_present ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-ink-50 px-3 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                      {t("students.absent")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-ink-900">
                      {student.attendance_summary?.total_absent ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-ink-50 px-3 py-4 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                      {t("students.attendanceRate")}
                    </p>
                    <p className="mt-2 text-xl font-extrabold text-ink-900">
                      {student.attendance_summary?.attendance_percentage ?? 0}%
                    </p>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>,
    document.body,
  );
}

StudentProfile.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  studentId: PropTypes.number,
};

export default StudentProfile;
