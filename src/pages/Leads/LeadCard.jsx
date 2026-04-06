import PropTypes from "prop-types";
import { Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatDate } from "../../utils/formatDate";

function LeadCard({ lead, onDelete, onEdit }) {
  const { t } = useTranslation();
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-ink-900">{fullName}</h3>
          <p className="mt-1 text-sm text-ink-600">{lead.phone}</p>
          {lead.phone2 ? <p className="mt-1 text-sm text-ink-600">{lead.phone2}</p> : null}
        </div>
        <Badge value={lead.status}>{t(`leads.statusOptions.${lead.status}`)}</Badge>
      </div>

      <p className="mt-4 line-clamp-2 text-sm leading-6 text-ink-500">{lead.note || t("common.noData")}</p>
      {lead.interested_course ? (
        <p className="mt-2 text-sm font-medium text-brand-700">📚 {lead.interested_course.name}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2 text-sm text-ink-600">
        <p>{formatDate(lead.created_at)}</p>
        <p>{lead.source || t("common.noData")}</p>
        {lead.status === "enrolled" && lead.converted_student ? (
          <Link
            className="font-semibold text-brand-700 transition hover:text-brand-800"
            to={`/students?search=${encodeURIComponent(lead.converted_student.full_name)}`}
          >
            {lead.converted_student.full_name}
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex justify-end gap-2 border-t border-ink-100 pt-4">
        <Button onClick={() => onEdit(lead)} size="sm" variant="ghost">
          <Pencil className="h-4 w-4" />
          {t("common.edit")}
        </Button>
        <Button
          className="text-red-600 hover:bg-red-50"
          onClick={() => onDelete(lead)}
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

LeadCard.propTypes = {
  lead: PropTypes.shape({
    converted_student: PropTypes.shape({
      full_name: PropTypes.string.isRequired,
      id: PropTypes.number.isRequired,
    }),
    created_at: PropTypes.string.isRequired,
    first_name: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    interested_course: PropTypes.shape({
      id: PropTypes.number,
      name: PropTypes.string.isRequired,
    }),
    last_name: PropTypes.string.isRequired,
    note: PropTypes.string,
    phone: PropTypes.string.isRequired,
    phone2: PropTypes.string,
    source: PropTypes.string,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
};

export default LeadCard;
