import PropTypes from "prop-types";
import { CalendarDays, Pencil, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatGroupSchedule } from "../../utils/schedule";

function GroupCard({ canManage, group, onDelete, onEdit, onOpen }) {
  const { t } = useTranslation();
  const teacherName = group.teacher?.full_name || t("common.noData");
  const initials = teacherName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={() => onOpen(group)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpen(group);
            }
          }}
        >
          <h3 className="truncate text-xl font-extrabold text-ink-900">{group.name}</h3>
          <p className="mt-2 text-sm font-semibold text-ink-600">
            {group.course?.name} • {formatCurrency(group.course?.price)}
          </p>
        </div>

        <Badge value={group.status === "archived" ? "inactive" : group.status}>
          {t(`groups.statusOptions.${group.status}`)}
        </Badge>
      </div>

      <div
        className="mt-5 cursor-pointer space-y-4"
        onClick={() => onOpen(group)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(group);
          }
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-extrabold text-brand-700">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{teacherName}</p>
            <p className="text-xs text-ink-500">{t("groups.teacher")}</p>
            {group.support_teacher?.full_name ? (
              <p className="mt-1 text-xs font-medium text-violet-600">
                {t("groups.supportTeacher")}: {group.support_teacher.full_name}
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
          <p className="font-semibold text-ink-800">{formatGroupSchedule(group.schedule, t)}</p>
          <p className="mt-2 flex items-center gap-2 text-xs text-ink-500">
            <CalendarDays className="h-4 w-4" />
            {formatDate(group.start_date)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-100 pt-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-600">
          <Users className="h-4 w-4 text-brand-600" />
          {t("groups.studentCount", { count: group.student_count || 0 })}
        </div>

        {canManage ? (
          <div className="flex items-center gap-2">
            <Button
              className="text-blue-600 hover:bg-blue-50"
              onClick={(event) => {
                event.stopPropagation();
                onEdit(group);
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
                onDelete(group);
              }}
              size="sm"
              variant="ghost"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </article>
  );
}

GroupCard.propTypes = {
  canManage: PropTypes.bool.isRequired,
  group: PropTypes.shape({
    course: PropTypes.shape({
      name: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    schedule: PropTypes.shape({
      days: PropTypes.arrayOf(PropTypes.string),
      time: PropTypes.string,
    }),
    start_date: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    support_teacher: PropTypes.shape({
      full_name: PropTypes.string,
    }),
    student_count: PropTypes.number,
    teacher: PropTypes.shape({
      full_name: PropTypes.string,
    }),
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

export default GroupCard;
