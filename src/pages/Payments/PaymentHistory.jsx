import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Pencil, Save, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import EmptyState from "../../components/ui/EmptyState";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";

function PaymentHistory({ loading, onDelete, onUpdate, payments }) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!editingId) {
      setAmount("");
      setNote("");
    }
  }, [editingId]);

  const startEditing = (payment) => {
    setEditingId(payment.id);
    setAmount(String(payment.amount));
    setNote(payment.note || "");
  };

  const handleSave = async () => {
    if (!editingId) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onUpdate(editingId, {
        amount: Number(amount),
        note,
      });
      setEditingId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!paymentToDelete) {
      return;
    }

    await onDelete(paymentToDelete);
    setPaymentToDelete(null);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-4" key={index}>
            <div className="h-4 w-32 animate-pulse rounded bg-ink-200" />
            <div className="mt-3 h-4 w-48 animate-pulse rounded bg-ink-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!payments.length) {
    return (
      <EmptyState
        action={null}
        icon={Trash2}
        message={t("payments.historyEmptyMessage")}
        title={t("payments.historyEmptyTitle")}
      />
    );
  }

  return (
    <>
      <div className="space-y-3">
        {payments.map((payment) => {
          const isEditing = editingId === payment.id;

          return (
            <div
              className="rounded-2xl border border-ink-100 bg-ink-50 px-4 py-4 shadow-sm"
              key={payment.id}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink-700">{t("payments.amount")}</span>
                      <input
                        className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                        min="1000"
                        onChange={(event) => setAmount(event.target.value)}
                        type="number"
                        value={amount}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm font-semibold text-ink-700">{t("payments.note")}</span>
                      <textarea
                        className="min-h-[48px] w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
                        onChange={(event) => setNote(event.target.value)}
                        value={note}
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => setEditingId(null)} size="sm" variant="secondary">
                      <X className="h-4 w-4" />
                      {t("common.cancel")}
                    </Button>
                    <Button loading={isSubmitting} onClick={handleSave} size="sm">
                      <Save className="h-4 w-4" />
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-ink-900">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-ink-600">{formatDate(payment.date)}</p>
                    <p className="text-sm text-ink-500">{payment.note || t("common.noData")}</p>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-400">
                      {payment.created_by?.username || t("common.noData")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => startEditing(payment)} size="sm" variant="ghost">
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => setPaymentToDelete(payment)}
                      size="sm"
                      variant="ghost"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={Boolean(paymentToDelete)}
        message={t("payments.deleteMessage", {
          amount: paymentToDelete ? formatCurrency(paymentToDelete.amount) : "",
        })}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={confirmDelete}
        title={t("payments.deleteTitle")}
      />
    </>
  );
}

PaymentHistory.propTypes = {
  loading: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  payments: PropTypes.arrayOf(
    PropTypes.shape({
      amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      created_by: PropTypes.shape({
        username: PropTypes.string,
      }),
      date: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
      note: PropTypes.string,
    }),
  ).isRequired,
};

export default PaymentHistory;
