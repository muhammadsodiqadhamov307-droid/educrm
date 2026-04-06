import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Plus, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { expensesApi } from "../../api/endpoints/expenses";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import { useUiStore } from "../../store/uiStore";
import { fetchAllPages } from "../../utils/fetchAllPages";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import ExpenseForm from "./ExpenseForm";

function ExpensesPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [summaryExpenses, setSummaryExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const markTeachersForRefresh = useUiStore((state) => state.markTeachersForRefresh);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  const filteredExpenses = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return expenses;
    }

    return expenses.filter((expense) => {
      const teacher = expense.teacher?.full_name || "";
      const supportTeacher = expense.support_teacher?.full_name || "";
      const student = expense.student
        ? [expense.student.first_name, expense.student.last_name, expense.student.phone].join(" ")
        : "";
      const category = t(`expenses.categoryOptions.${expense.category}`).toLowerCase();
      return [expense.note, teacher, supportTeacher, student, category].some((value) =>
        String(value || "").toLowerCase().includes(normalized),
      );
    });
  }, [expenses, search, t]);

  const totalPages = Math.max(Math.ceil(filteredExpenses.length / 20), 1);
  const currentItems = filteredExpenses.slice((page - 1) * 20, page * 20);

  const summary = useMemo(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    const month = todayIso.slice(0, 7);

    return summaryExpenses.reduce(
      (accumulator, expense) => {
        const amount = Number(expense.amount || 0);
        accumulator.all += amount;
        if (expense.date === todayIso) {
          accumulator.today += amount;
        }
        if ((expense.date || "").startsWith(month)) {
          accumulator.month += amount;
        }
        return accumulator;
      },
      { all: 0, month: 0, today: 0 },
    );
  }, [summaryExpenses]);

  const loadSummary = async () => {
    const results = await fetchAllPages((params) => expensesApi.list(params));
    setSummaryExpenses(results);
  };

  const loadExpenses = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await fetchAllPages((params) =>
        expensesApi.list({
          ...params,
          date__gte: dateFrom || undefined,
          date__lte: dateTo || undefined,
        }),
      );
      setExpenses(results);
    } catch {
      setError(t("expenses.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [dateFrom, dateTo]);

  useEffect(() => {
    loadSummary();
  }, []);

  const refreshAll = async () => {
    await Promise.all([loadExpenses(), loadSummary()]);
  };

  const handleDelete = async () => {
    if (!expenseToDelete) {
      return;
    }

    await expensesApi.remove(expenseToDelete.id);
    if (
      expenseToDelete.category === "teacher_salary" ||
      expenseToDelete.category === "support_salary"
    ) {
      markTeachersForRefresh();
    }
    toast.success(t("expenses.deletedSuccess"));
    setExpenseToDelete(null);
    await refreshAll();
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("expenses.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("expenses.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setSelectedExpense(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("expenses.addExpense")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_200px_200px]">
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("expenses.searchPlaceholder")}
            value={search}
          />
          <input
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setDateFrom(event.target.value)}
            type="date"
            value={dateFrom}
          />
          <input
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setDateTo(event.target.value)}
            type="date"
            value={dateTo}
          />
        </div>

        {loading && expenses.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={18} width={160} />
                <Skeleton className="mt-3 rounded-2xl" height={54} width="100%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadExpenses} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("expenses.loadErrorTitle")}
          />
        ) : currentItems.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedExpense(null);
                  setShowForm(true);
                }}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                {t("expenses.addExpense")}
              </Button>
            }
            icon={Wallet}
            message={t("expenses.emptyMessage")}
            title={t("expenses.emptyTitle")}
          />
        ) : (
          <div className="space-y-3">
            {currentItems.map((expense) => (
              <article
                className="rounded-2xl bg-white px-4 py-4 shadow-sm ring-1 ring-inset ring-ink-100"
                key={expense.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xl font-extrabold text-ink-900">{formatCurrency(expense.amount)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          expense.category === "teacher_salary"
                            ? "bg-sky-100 text-sky-700"
                            : expense.category === "support_salary"
                              ? "bg-violet-100 text-violet-700"
                            : expense.category === "student_refund"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-200 text-slate-700"
                        }
                        value={expense.category === "teacher_salary" ? "called" : "inactive"}
                      >
                        {t(`expenses.categoryOptions.${expense.category}`)}
                      </Badge>
                      {expense.teacher?.full_name ? (
                        <span className="text-sm text-ink-600">{expense.teacher.full_name}</span>
                      ) : null}
                      {expense.category === "support_salary" && expense.support_teacher?.full_name ? (
                        <span className="text-sm text-ink-600">{expense.support_teacher.full_name}</span>
                      ) : null}
                      {expense.category === "student_refund" && expense.student ? (
                        <span className="text-sm text-ink-600">
                          {[expense.student.first_name, expense.student.last_name].filter(Boolean).join(" ").trim()}{" "}
                          · {expense.student.phone}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm text-ink-500">{expense.note || t("common.noData")}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-ink-400">{formatDate(expense.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setSelectedExpense(expense);
                        setShowForm(true);
                      }}
                      size="sm"
                      variant="ghost"
                    >
                      {t("common.edit")}
                    </Button>
                    <Button
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setExpenseToDelete(expense)}
                      size="sm"
                      variant="ghost"
                    >
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("expenses.footer.today")}</p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{formatCurrency(summary.today)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("expenses.footer.month")}</p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{formatCurrency(summary.month)}</p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("expenses.footer.total")}</p>
            <p className="mt-2 text-xl font-extrabold text-ink-900">{formatCurrency(summary.all)}</p>
          </div>
        </section>
      </div>

      <ExpenseForm expense={selectedExpense} isOpen={showForm} onClose={() => setShowForm(false)} onSuccess={refreshAll} />

      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        message={t("expenses.deleteMessage", {
          amount: expenseToDelete ? formatCurrency(expenseToDelete.amount) : "",
        })}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDelete}
        title={t("expenses.deleteTitle")}
      />
    </div>
  );
}

export default ExpensesPage;
