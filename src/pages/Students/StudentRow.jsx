import PropTypes from "prop-types";
import { Pencil, Send, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import useAuthStore from "../../store/authStore";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatCurrency";

function StudentRow({ onDelete, onEdit, onOpen, onSendToSupport, student }) {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const balance = Number(student.balance || 0);
  const canSendToSupport = user?.role === "admin" || user?.role === "receptionist";

  return (
    <article
      className="flex cursor-pointer flex-col gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md sm:flex-row sm:items-center"
      onClick={() => onOpen(student)}
    >
      <div className="w-16 shrink-0 text-sm font-semibold text-ink-400">#{student.id}</div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-ink-900">
          {student.first_name} {student.last_name}
        </p>
        <p className="mt-1 text-sm text-ink-500">{student.phone}</p>
        {student.phone2 ? <p className="text-xs text-ink-400">{student.phone2}</p> : null}
        {Number(student.free_lessons_remaining || 0) > 0 ? (
          <span className="mt-2 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            🎁 {student.free_lessons_remaining} {t("students.freeLessons")}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <div
          className={cn(
            "text-sm font-extrabold sm:min-w-40 sm:text-right",
            balance < 0 ? "text-red-600" : balance > 0 ? "text-green-600" : "text-ink-700",
          )}
        >
          {formatCurrency(student.balance)}
        </div>

        {Number(student.discount || 0) > 0 ? (
          <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {t("students.discountShort", { value: student.discount })}
          </span>
        ) : null}

        <Badge value={student.status}>{t(`students.statusOptions.${student.status}`)}</Badge>

        <div className="ml-auto flex items-center gap-2 sm:ml-2">
          {canSendToSupport ? (
            <Button
              className="text-violet-600 hover:bg-violet-50"
              onClick={(event) => {
                event.stopPropagation();
                onSendToSupport(student);
              }}
              size="sm"
              title={t("students.sendToSupport")}
              variant="ghost"
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            className="text-blue-600 hover:bg-blue-50"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(student);
            }}
            size="sm"
            variant="ghost"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            className="text-red-600 hover:bg-red-50"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(student);
            }}
            size="sm"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

StudentRow.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  onSendToSupport: PropTypes.func.isRequired,
  student: PropTypes.shape({
    balance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    discount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    first_name: PropTypes.string.isRequired,
    free_lessons_remaining: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id: PropTypes.number.isRequired,
    last_name: PropTypes.string.isRequired,
    phone: PropTypes.string.isRequired,
    phone2: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

export default StudentRow;
