import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CreditCard, Plus, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { paymentsApi } from "../../api/endpoints/payments";
import { studentsApi } from "../../api/endpoints/students";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import useAuthStore from "../../store/authStore";
import { fetchAllPages } from "../../utils/fetchAllPages";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import PaymentModal from "./PaymentModal";

function clampPage(value) {
  const numeric = Number(value || 1);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function PaymentsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [lastPaymentMap, setLastPaymentMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [summary, setSummary] = useState({
    debtorsCount: 0,
    monthTotal: 0,
    todayTotal: 0,
  });

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const loadSummary = async () => {
    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);

    const [todayPayments, monthPayments, debtors] = await Promise.all([
      fetchAllPages((params) => paymentsApi.list(params), { date: todayIso }),
      fetchAllPages((params) => paymentsApi.list(params), {
        date__gte: monthStart,
        date__lte: todayIso,
      }),
      studentsApi.list({ balance_negative: true }),
    ]);

    setSummary({
      debtorsCount: debtors.data.count || 0,
      monthTotal: monthPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0),
      todayTotal: todayPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0),
    });
  };

  const loadStudents = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await studentsApi.list({
        page,
        search: debouncedSearch || undefined,
      });
      const items = response.data.results || [];
      setStudents(items);
      setTotalCount(response.data.count || 0);

      const lastPayments = await Promise.all(
        items.map(async (student) => {
          const paymentResponse = await paymentsApi.list({
            page: 1,
            student: student.id,
            skipErrorToast: true,
          });
          return [student.id, paymentResponse.data.results?.[0]?.date || null];
        }),
      );

      setLastPaymentMap(Object.fromEntries(lastPayments));
    } catch {
      setError(t("payments.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    loadSummary();
  }, [isAdmin]);

  const handleOpen = (student = null) => {
    setSelectedStudent(student);
    setShowModal(true);
  };

  const handleRefresh = async () => {
    await Promise.all([loadStudents(), isAdmin ? loadSummary() : Promise.resolve()]);
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("payments.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("payments.subtitle")}</p>
          </div>
          <Button onClick={() => handleOpen(null)}>
            <Plus className="h-4 w-4" />
            {t("payments.addPayment")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 lg:max-w-md"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("payments.searchPlaceholder")}
            value={search}
          />
          <p className="text-sm font-medium text-ink-500">{t("payments.listHint")}</p>
        </div>

        {loading && students.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Skeleton className="rounded-xl" height={18} width={180} />
                  <Skeleton className="rounded-xl" height={18} width={120} />
                  <Skeleton className="rounded-xl" height={18} width={110} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadStudents} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("payments.loadErrorTitle")}
          />
        ) : students.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={() => handleOpen(null)} variant="secondary">
                <Plus className="h-4 w-4" />
                {t("payments.addPayment")}
              </Button>
            }
            icon={CreditCard}
            message={t("payments.emptyMessage")}
            title={t("payments.emptyTitle")}
          />
        ) : (
          <div className="space-y-3">
            {students.map((student) => {
              const balance = Number(student.balance || 0);
              return (
                <article
                  className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md"
                  key={student.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-ink-900">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="mt-1 text-sm text-ink-600">{student.phone}</p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 lg:items-center lg:gap-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          {t("students.balance")}
                        </p>
                        <p
                          className={`mt-1 text-base font-bold ${
                            balance < 0 ? "text-red-600" : balance > 0 ? "text-green-600" : "text-ink-900"
                          }`}
                        >
                          {formatCurrency(balance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
                          {t("payments.lastPayment")}
                        </p>
                        <p className="mt-1 text-sm font-medium text-ink-700">
                          {lastPaymentMap[student.id] ? formatDate(lastPaymentMap[student.id]) : t("common.noData")}
                        </p>
                      </div>
                      <div className="flex justify-start lg:justify-end">
                        <Button onClick={() => handleOpen(student)} size="sm">
                          <Wallet className="h-4 w-4" />
                          {t("payments.addPayment")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <Pagination currentPage={clampPage(page)} onPageChange={setPage} totalPages={totalPages} />
      </section>

      {isAdmin ? (
        <div className="sticky bottom-4 z-10">
        <section className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {t("payments.footer.todayIncome")}
            </p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{formatCurrency(summary.todayTotal)}</p>
            </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {t("payments.footer.monthIncome")}
            </p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{formatCurrency(summary.monthTotal)}</p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
              {t("payments.footer.debtors")}
            </p>
            <p className="mt-2 text-xl font-extrabold text-red-600">{summary.debtorsCount}</p>
          </div>
          </section>
        </div>
      ) : null}

      <PaymentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleRefresh}
        student={selectedStudent}
        students={students}
      />
    </div>
  );
}

export default PaymentsPage;
