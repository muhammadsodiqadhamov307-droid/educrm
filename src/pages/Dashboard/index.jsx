import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, BookOpen, TrendingUp, UserPlus, Users, Wallet } from "lucide-react";
import { useTranslation } from "react-i18next";

import { dashboardApi } from "../../api/endpoints/dashboard";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatCurrency";

const iconColorMap = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  emerald: "bg-emerald-100 text-emerald-700",
  red: "bg-rose-100 text-rose-700",
  yellow: "bg-amber-100 text-amber-700",
  violet: "bg-violet-100 text-violet-700",
};

function StatCard({ color, icon: Icon, label, onClick, value }) {
  const interactive = typeof onClick === "function";

  return (
    <button
      className={cn(
        "rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-inset ring-ink-100 transition sm:p-6",
        interactive ? "hover:-translate-y-0.5 hover:shadow-md" : "cursor-default",
      )}
      disabled={!interactive}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-500">{label}</p>
          <p className="mt-3 text-2xl font-extrabold text-ink-900 sm:mt-4 sm:text-3xl">{value}</p>
        </div>
        <div className={cn("rounded-2xl p-3", iconColorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  );
}

StatCard.propTypes = {
  color: PropTypes.oneOf(["blue", "green", "emerald", "red", "yellow", "violet"]).isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

function StatCardSkeleton() {
  return (
    <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-inset ring-ink-100 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-4">
          <Skeleton className="rounded-lg" height={16} width={120} />
          <Skeleton className="rounded-lg" height={32} width={140} />
        </div>
        <Skeleton className="rounded-full" height={48} width={48} />
      </div>
    </div>
  );
}

function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total_students: 0,
    active_groups: 0,
    today_income: 0,
    debtors_count: 0,
    new_leads_count: 0,
    total_balance: 0,
  });

  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await dashboardApi.stats();
      setStats(data);
    } catch {
      setError(t("dashboard.errorMessage"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      color: "blue",
      icon: Users,
      label: t("dashboard.totalStudents"),
      value: stats.total_students,
      onClick: () => navigate("/students"),
    },
    {
      color: "green",
      icon: BookOpen,
      label: t("dashboard.activeGroups"),
      value: stats.active_groups,
      onClick: () => navigate("/groups"),
    },
    {
      color: "emerald",
      icon: TrendingUp,
      label: t("dashboard.todayIncome"),
      value: formatCurrency(stats.today_income),
    },
    {
      color: "red",
      icon: AlertCircle,
      label: t("dashboard.debtors"),
      value: stats.debtors_count,
      onClick: () => navigate("/students?balance=negative"),
    },
    {
      color: "yellow",
      icon: UserPlus,
      label: t("dashboard.newLeads"),
      value: stats.new_leads_count,
      onClick: () => navigate("/leads?status=new"),
    },
    {
      color: "violet",
      icon: Wallet,
      label: t("dashboard.totalBalance"),
      value: formatCurrency(stats.total_balance),
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="glass-panel overflow-hidden p-5 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-brand-600">
              {t("dashboard.overview")}
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink-900 sm:mt-3 sm:text-3xl">
              {t("dashboard.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-600 sm:mt-3 sm:leading-7">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={loadStats} variant="secondary">
            {t("dashboard.refresh")}
          </Button>
        </div>
      </section>

      {error && !loading ? (
        <EmptyState
          action={
            <Button onClick={loadStats} variant="secondary">
              {t("dashboard.retry")}
            </Button>
          }
          icon={AlertCircle}
          message={error}
          title={t("dashboard.errorTitle")}
        />
      ) : null}

      {!error || loading ? (
        <section className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => <StatCardSkeleton key={index} />)
            : cards.map((card) => <StatCard key={card.label} {...card} />)}
        </section>
      ) : null}
    </div>
  );
}

export default DashboardPage;
