import PropTypes from "prop-types";
import { Pencil, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";

function TeacherCard({ teacher, onDelete, onEdit, onOpen }) {
  const { t } = useTranslation();
  const fullName = teacher.full_name || [teacher.first_name, teacher.last_name].filter(Boolean).join(" ").trim() || teacher.username;
  const initials = fullName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md">
      <div
        className="cursor-pointer"
        onClick={() => onOpen(teacher)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(teacher);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-extrabold text-brand-700">
            {initials || "T"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-bold text-ink-900">{fullName}</h3>
            <p className="mt-1 text-sm text-ink-600">{teacher.phone || t("common.noData")}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl bg-ink-50 px-4 py-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("teachers.balance")}</p>
            <p className="mt-2 text-lg font-extrabold text-emerald-600">{formatCurrency(teacher.balance)}</p>
            <p className="mt-2 text-sm font-semibold text-ink-600">
              {t("teachers.sharePercentLabel")}: {teacher.share_percent ?? 30}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">{t("teachers.studentCount")}</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-extrabold text-ink-900">
              <Users className="h-5 w-5 text-brand-600" />
              {teacher.student_count || 0}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-ink-100 pt-4">
        <Button onClick={() => onEdit(teacher)} size="sm" variant="ghost">
          <Pencil className="h-4 w-4" />
          {t("common.edit")}
        </Button>
        <Button
          className="text-red-600 hover:bg-red-50"
          onClick={() => onDelete(teacher)}
          size="sm"
          variant="ghost"
        >
          <Trash2 className="h-4 w-4" />
          {t("common.delete")}
        </Button>
      </div>
    </article>
  );
}

TeacherCard.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
  teacher: PropTypes.shape({
    balance: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    first_name: PropTypes.string,
    full_name: PropTypes.string,
    id: PropTypes.number.isRequired,
    last_name: PropTypes.string,
    phone: PropTypes.string,
    share_percent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    student_count: PropTypes.number,
    username: PropTypes.string,
  }).isRequired,
};

export default TeacherCard;
