import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, UserPlus, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { studentsApi } from "../../api/endpoints/students";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import SendToSupportModal from "./SendToSupportModal";
import StudentForm from "./StudentForm";
import StudentProfile from "./StudentProfile";
import StudentRow from "./StudentRow";
import StudentsFilter from "./StudentsFilter";

function clampPage(value) {
  const numeric = Number(value || 1);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function StudentsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [negativeCount, setNegativeCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const status = searchParams.get("status") || "all";
  const balance = searchParams.get("balance") || "all";
  const currentPage = clampPage(searchParams.get("page"));

  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const apiFilters = useMemo(() => {
    const params = {};

    if (searchParams.get("search")) {
      params.search = searchParams.get("search");
    }
    if (status !== "all") {
      params.status = status;
    }
    if (balance === "negative") {
      params.balance_negative = true;
    }

    return params;
  }, [searchParams, status, balance]);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);
  const activePercentage = totalCount ? Math.round((activeCount / totalCount) * 100) : 0;

  const updateParams = (updates) => {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "" || value === "all") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  };

  const loadStudents = async () => {
    setLoading(true);
    setError("");

    try {
      const listParams = { ...apiFilters, page: currentPage };
      const activeParams = {
        ...(searchParams.get("search") ? { search: searchParams.get("search") } : {}),
        ...(balance === "negative" ? { balance_negative: true } : {}),
        status: "active",
      };
      const negativeParams = {
        ...(searchParams.get("search") ? { search: searchParams.get("search") } : {}),
        ...(status !== "all" ? { status } : {}),
        balance_negative: true,
      };

      const [listResponse, activeResponse, negativeResponse] = await Promise.all([
        studentsApi.list(listParams),
        studentsApi.list(activeParams),
        studentsApi.list(negativeParams),
      ]);

      setStudents(listResponse.data.results || []);
      setTotalCount(listResponse.data.count || 0);
      setActiveCount(activeResponse.data.count || 0);
      setNegativeCount(negativeResponse.data.count || 0);
    } catch (requestError) {
      if (requestError?.response?.status === 404 && currentPage > 1) {
        updateParams({ page: currentPage - 1 });
        return;
      }

      setError(t("students.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchInput !== currentSearch) {
        updateParams({
          search: searchInput || null,
          page: null,
        });
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchParams]);

  useEffect(() => {
    loadStudents();
  }, [apiFilters, currentPage]);

  const handleCreate = () => {
    setSelectedStudent(null);
    setShowForm(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleOpenProfile = (student) => {
    setSelectedStudent(student);
    setShowProfile(true);
  };

  const handleSendToSupport = (student) => {
    setSelectedStudent(student);
    setShowSupportModal(true);
  };

  const handleDelete = async () => {
    if (!studentToDelete) {
      return;
    }

    setIsDeleting(true);

    try {
      await studentsApi.remove(studentToDelete.id);
      toast.success(t("students.deletedSuccess"));
      setStudentToDelete(null);
      setShowProfile(false);
      if (students.length === 1 && currentPage > 1) {
        updateParams({ page: currentPage - 1 });
      } else {
        await loadStudents();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("students.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("students.subtitle")}</p>
          </div>
          <Button onClick={handleCreate}>
            <UserPlus className="h-4 w-4" />
            {t("students.addStudent")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <StudentsFilter
          balance={balance}
          onBalanceChange={(value) => updateParams({ balance: value, page: null })}
          onReset={() => setSearchParams({})}
          onSearchChange={setSearchInput}
          onStatusChange={(value) => updateParams({ status: value, page: null })}
          search={searchInput}
          status={status}
        />

        {loading && students.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Skeleton className="rounded-xl" height={16} width={48} />
                  <div className="space-y-2">
                    <Skeleton className="rounded-xl" height={18} width={180} />
                    <Skeleton className="rounded-xl" height={14} width={140} />
                  </div>
                  <Skeleton className="rounded-xl" height={18} width={110} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadStudents} variant="secondary">
                {t("dashboard.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("students.loadErrorTitle")}
          />
        ) : students.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={handleCreate} variant="secondary">
                <UserPlus className="h-4 w-4" />
                {t("students.addStudent")}
              </Button>
            }
            icon={Users}
            message={t("students.emptyMessage")}
            title={t("students.emptyTitle")}
          />
        ) : (
          <div className="space-y-3">
            {students.map((student) => (
              <StudentRow
                key={student.id}
                onDelete={setStudentToDelete}
                onEdit={handleEdit}
                onOpen={handleOpenProfile}
                onSendToSupport={handleSendToSupport}
                student={student}
              />
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          onPageChange={(page) => updateParams({ page })}
          totalPages={totalPages}
        />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl">
          <div className="h-3 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300"
              style={{ width: `${activePercentage}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold text-ink-700 sm:flex sm:flex-wrap sm:items-center sm:gap-4">
            <span>{t("students.footer.active", { count: activeCount })}</span>
            <span>{t("students.footer.debtors", { count: negativeCount })}</span>
            <span className="col-span-2 sm:col-span-1">{t("students.footer.total", { count: totalCount })}</span>
          </div>
        </section>
      </div>

      <StudentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadStudents}
        student={selectedStudent}
      />

      <StudentProfile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
        studentId={selectedStudent?.id}
      />

      <SendToSupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        onSuccess={loadStudents}
        student={selectedStudent}
      />

      <ConfirmDialog
        isOpen={Boolean(studentToDelete)}
        message={t("students.deleteMessage", {
          name: studentToDelete ? `${studentToDelete.first_name} ${studentToDelete.last_name}` : "",
        })}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleDelete}
        title={isDeleting ? t("common.loading") : t("students.deleteTitle")}
      />
    </div>
  );
}

export default StudentsPage;
