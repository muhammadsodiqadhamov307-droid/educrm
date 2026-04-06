import { useEffect, useState } from "react";
import { AlertCircle, Plus, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

import { leadsApi } from "../../api/endpoints/leads";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import Pagination from "../../components/shared/Pagination";
import Skeleton from "../../components/ui/Skeleton";
import LeadCard from "./LeadCard";
import LeadForm from "./LeadForm";

function LeadsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [leads, setLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [enrolledCount, setEnrolledCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);

  const totalPages = Math.max(Math.ceil(totalCount / 20), 1);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  const loadFooterStats = async () => {
    const [newResponse, enrolledResponse] = await Promise.all([
      leadsApi.list({ status: "new" }),
      leadsApi.list({ status: "enrolled" }),
    ]);

    setNewCount(newResponse.data.count || 0);
    setEnrolledCount(enrolledResponse.data.count || 0);
  };

  const loadLeads = async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await leadsApi.list({
        page,
        search: debouncedSearch || undefined,
        status: status !== "all" ? status : undefined,
      });
      setLeads(data.results || []);
      setTotalCount(data.count || 0);
    } catch {
      setError(t("leads.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [debouncedSearch, page, status]);

  useEffect(() => {
    loadFooterStats();
  }, []);

  const handleDelete = async () => {
    if (!leadToDelete) {
      return;
    }

    await leadsApi.remove(leadToDelete.id);
    toast.success(t("leads.deletedSuccess"));
    setLeadToDelete(null);
    await Promise.all([loadLeads(), loadFooterStats()]);
  };

  const handleSuccess = async () => {
    await Promise.all([loadLeads(), loadFooterStats()]);
  };

  return (
    <div className="space-y-6 pb-28">
      <section className="glass-panel p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-ink-900">{t("leads.title")}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-ink-600">{t("leads.subtitle")}</p>
          </div>
          <Button
            onClick={() => {
              setSelectedLead(null);
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t("leads.addLead")}
          </Button>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl bg-white/70 p-4 shadow-sm ring-1 ring-inset ring-white/70 sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_220px]">
          <input
            className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("leads.searchPlaceholder")}
            value={search}
          />
          <select
            className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            onChange={(event) => setStatus(event.target.value)}
            value={status}
          >
            <option value="all">{t("leads.allStatuses")}</option>
            <option value="new">{t("leads.statusOptions.new")}</option>
            <option value="contacted">{t("leads.statusOptions.contacted")}</option>
            <option value="enrolled">{t("leads.statusOptions.enrolled")}</option>
            <option value="rejected">{t("leads.statusOptions.rejected")}</option>
          </select>
        </div>

        {loading && leads.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100" key={index}>
                <Skeleton className="rounded-xl" height={18} width={180} />
                <Skeleton className="mt-3 rounded-xl" height={16} width={110} />
                <Skeleton className="mt-4 rounded-2xl" height={54} width="100%" />
              </div>
            ))}
          </div>
        ) : error ? (
          <EmptyState
            action={
              <Button onClick={loadLeads} variant="secondary">
                {t("common.retry")}
              </Button>
            }
            icon={AlertCircle}
            message={error}
            title={t("leads.loadErrorTitle")}
          />
        ) : leads.length === 0 ? (
          <EmptyState
            action={
              <Button
                onClick={() => {
                  setSelectedLead(null);
                  setShowForm(true);
                }}
                variant="secondary"
              >
                <Plus className="h-4 w-4" />
                {t("leads.addLead")}
              </Button>
            }
            icon={UserPlus}
            message={t("leads.emptyMessage")}
            title={t("leads.emptyTitle")}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {leads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDelete={setLeadToDelete}
                onEdit={(item) => {
                  setSelectedLead(item);
                  setShowForm(true);
                }}
              />
            ))}
          </div>
        )}

        <Pagination currentPage={page} onPageChange={setPage} totalPages={totalPages} />
      </section>

      <div className="sticky bottom-4 z-10">
        <section className="grid grid-cols-2 gap-3 rounded-3xl border border-ink-200 bg-white/95 px-5 py-4 shadow-soft backdrop-blur-xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("leads.footer.new")}</p>
            <p className="mt-2 text-xl font-extrabold text-amber-600">{newCount}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("leads.footer.enrolled")}</p>
            <p className="mt-2 text-xl font-extrabold text-emerald-600">{enrolledCount}</p>
          </div>
        </section>
      </div>

      <LeadForm isOpen={showForm} lead={selectedLead} onClose={() => setShowForm(false)} onSuccess={handleSuccess} />

      <ConfirmDialog
        isOpen={Boolean(leadToDelete)}
        message={t("leads.deleteMessage", {
          name: [leadToDelete?.first_name, leadToDelete?.last_name].filter(Boolean).join(" ").trim(),
        })}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDelete}
        title={t("leads.deleteTitle")}
      />
    </div>
  );
}

export default LeadsPage;
