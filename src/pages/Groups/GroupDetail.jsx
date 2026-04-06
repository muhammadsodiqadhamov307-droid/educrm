import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { CircleX, Send, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { groupsApi } from "../../api/endpoints/groups";
import { supportTasksApi } from "../../api/endpoints/supportTasks";
import AddStudentToGroup from "./AddStudentToGroup";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import Modal from "../../components/ui/Modal";
import Skeleton from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatGroupSchedule } from "../../utils/schedule";

function GroupDetail({ canManageStudents, groupId, isOpen, onClose, onRefresh }) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("students");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [studentToSupport, setStudentToSupport] = useState(null);
  const [supportNote, setSupportNote] = useState("");
  const [sendingToSupport, setSendingToSupport] = useState(false);

  const canSendToSupport = ["admin", "receptionist", "teacher"].includes(user?.role);

  const existingStudentIds = useMemo(
    () => group?.students?.map((student) => student.id) || [],
    [group?.students],
  );

  const loadGroup = async () => {
    if (!groupId) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await groupsApi.retrieve(groupId);
      setGroup(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !groupId) {
      return;
    }

    loadGroup();
  }, [groupId, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setActiveTab("students");
      setStudentToRemove(null);
      setShowAddStudent(false);
      setStudentToSupport(null);
      setSupportNote("");
    }
  }, [isOpen]);

  const handleRemoveStudent = async () => {
    if (!group?.id || !studentToRemove) {
      return;
    }

    setIsRemoving(true);
    try {
      await groupsApi.removeStudent(group.id, studentToRemove.id);
      toast.success(t("groups.studentRemovedSuccess"));
      setStudentToRemove(null);
      await Promise.all([loadGroup(), onRefresh()]);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSendToSupport = async () => {
    if (!group?.id || !studentToSupport?.id) {
      return;
    }

    setSendingToSupport(true);
    try {
      await supportTasksApi.sendToSupport(studentToSupport.id, {
        group_id: group.id,
        note: supportNote,
      });
      toast.success(t("students.supportSent"));
      setStudentToSupport(null);
      setSupportNote("");
    } catch (error) {
      toast.error(
        error?.response?.data?.group_id?.[0] ||
          error?.response?.data?.detail ||
          t("supportTeachers.noSupportTeacherAssigned"),
      );
    } finally {
      setSendingToSupport(false);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" title={group?.name || t("groups.details")}>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton className="rounded-2xl" height={96} key={index} width="100%" />
            ))}
          </div>
        ) : group ? (
          <div className="space-y-6">
            <section className="rounded-3xl bg-ink-950 px-5 py-5 text-white">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
                    {group.course?.name}
                  </p>
                  <h2 className="mt-3 text-2xl font-extrabold">{group.name}</h2>
                </div>
                <Badge value={group.status === "archived" ? "inactive" : group.status}>
                  {t(`groups.statusOptions.${group.status}`)}
                </Badge>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {[
                { label: t("groups.teacher"), value: group.teacher?.full_name },
                {
                  label: t("groups.supportTeacher"),
                  value: group.support_teacher?.full_name || t("groups.notAssigned"),
                },
                { label: t("groups.schedule"), value: formatGroupSchedule(group.schedule, t) },
                { label: t("groups.startDate"), value: formatDate(group.start_date) },
                { label: t("groups.coursePrice"), value: formatCurrency(group.course?.price) },
              ].map((item) => (
                <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-4" key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{item.label}</p>
                  {item.label === t("groups.supportTeacher") && group.support_teacher?.id && user?.role === "admin" ? (
                    <Link
                      className="mt-2 inline-flex font-semibold text-brand-700 hover:text-brand-800"
                      to={`/support-teachers/${group.support_teacher.id}`}
                    >
                      {item.value || t("common.noData")}
                    </Link>
                  ) : (
                    <p className="mt-2 font-semibold text-ink-900">{item.value || t("common.noData")}</p>
                  )}
                </div>
              ))}
            </section>

            <div className="flex items-center gap-2 border-b border-ink-100">
              {["students", "attendance"].map((tab) => (
                <button
                  className={cn(
                    "border-b-2 px-1 py-3 text-sm font-semibold transition",
                    activeTab === tab
                      ? "border-brand-500 text-brand-700"
                      : "border-transparent text-ink-500 hover:text-ink-900",
                  )}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  type="button"
                >
                  {t(`groups.tabs.${tab}`)}
                </button>
              ))}
            </div>

            {activeTab === "students" ? (
              <section className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink-600">
                    {t("groups.studentCount", { count: group.students?.length || 0 })}
                  </p>
                  {canManageStudents ? (
                    <Button onClick={() => setShowAddStudent(true)} size="sm">
                      {t("groups.addStudentToGroup")}
                    </Button>
                  ) : null}
                </div>

                {group.students?.length ? (
                  <div className="space-y-3">
                    {group.students.map((student) => (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3"
                        key={student.id}
                      >
                        <div>
                          <p className="font-semibold text-ink-900">
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-sm text-ink-500">{student.phone}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "text-sm font-bold",
                              Number(student.balance) < 0
                                ? "text-red-600"
                                : Number(student.balance) > 0
                                  ? "text-green-600"
                                  : "text-ink-700",
                            )}
                          >
                            {formatCurrency(student.balance)}
                          </span>
                          <Badge value={student.status}>{t(`students.statusOptions.${student.status}`)}</Badge>
                          {canSendToSupport ? (
                            <Button
                              className="text-violet-700 hover:bg-violet-50"
                              onClick={() => {
                                if (!group.support_teacher) {
                                  toast.error(t("supportTeachers.noSupportTeacherAssigned"));
                                  return;
                                }
                                setStudentToSupport(student);
                              }}
                              size="sm"
                              variant="ghost"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          ) : null}
                          {canManageStudents ? (
                            <Button
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setStudentToRemove(student)}
                              size="sm"
                              variant="ghost"
                            >
                              <CircleX className="h-4 w-4" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Users}
                    message={t("groups.noStudentsMessage")}
                    title={t("groups.noStudentsTitle")}
                  />
                )}
              </section>
            ) : (
              <section className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {t("groups.totalSessions")}
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-ink-900">
                    {group.attendance_stats?.total || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {t("groups.averageAttendance")}
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-ink-900">
                    {group.attendance_stats?.present_percentage || 0}%
                  </p>
                </div>
                <div className="rounded-2xl border border-ink-100 bg-white px-4 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-500">
                    {t("groups.presentCount")}
                  </p>
                  <p className="mt-3 text-2xl font-extrabold text-ink-900">
                    {group.attendance_stats?.present || 0}
                  </p>
                </div>
              </section>
            )}
          </div>
        ) : null}
      </Modal>

      <AddStudentToGroup
        existingStudentIds={existingStudentIds}
        groupId={group?.id}
        isOpen={showAddStudent}
        onClose={() => setShowAddStudent(false)}
        onSuccess={async () => {
          await Promise.all([loadGroup(), onRefresh()]);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(studentToRemove)}
        message={t("groups.removeStudentMessage", {
          name: studentToRemove ? `${studentToRemove.first_name} ${studentToRemove.last_name}` : "",
        })}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleRemoveStudent}
        title={isRemoving ? t("common.loading") : t("groups.removeStudentTitle")}
      />

      <Modal
        isOpen={Boolean(studentToSupport)}
        onClose={() => {
          if (sendingToSupport) {
            return;
          }
          setStudentToSupport(null);
          setSupportNote("");
        }}
        size="md"
        title={t("students.sendToSupport")}
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-ink-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">{t("common.name")}</p>
            <p className="mt-2 text-lg font-bold text-ink-900">
              {studentToSupport?.first_name} {studentToSupport?.last_name}
            </p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">
              {t("groups.supportTeacher")}
            </p>
            <p className="mt-2 text-sm font-semibold text-ink-900">
              {group?.support_teacher?.full_name || t("supportTeachers.noSupportTeacherAssigned")}
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-ink-700">{t("students.supportNote")}</span>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              onChange={(event) => setSupportNote(event.target.value)}
              placeholder={t("students.supportNotePlaceholder")}
              value={supportNote}
            />
          </label>

          <div className="flex justify-end gap-3">
            <Button
              onClick={() => {
                setStudentToSupport(null);
                setSupportNote("");
              }}
              type="button"
              variant="secondary"
            >
              {t("common.cancel")}
            </Button>
            <Button loading={sendingToSupport} onClick={handleSendToSupport} type="button">
              {t("students.sendToSupport")}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

GroupDetail.propTypes = {
  canManageStudents: PropTypes.bool.isRequired,
  groupId: PropTypes.number,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};

export default GroupDetail;
