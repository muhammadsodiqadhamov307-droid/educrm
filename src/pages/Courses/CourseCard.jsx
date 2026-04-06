import PropTypes from "prop-types";
import { BookOpen, Pencil, Trash2, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";
import { formatCurrency } from "../../utils/formatCurrency";

function CourseCard({ canManage, course, onDelete, onEdit, onOpen }) {
  const { t } = useTranslation();

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-inset ring-ink-100 transition hover:shadow-md">
      <div
        className="cursor-pointer"
        onClick={() => onOpen(course)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onOpen(course);
          }
        }}
        role="button"
        tabIndex={0}
      >
        <h3 className="text-xl font-extrabold text-ink-900">{course.name}</h3>
        <div className="mt-3 space-y-1">
          <p className="text-base font-bold text-brand-700">
            {t("courses.dailyPrice")}: {formatCurrency(course.daily_price)}
          </p>
          <p className="text-sm font-semibold text-violet-700">
            {t("courses.monthlyPrice")}: {formatCurrency(course.monthly_price)}
          </p>
        </div>
        <p className="mt-2 text-sm text-ink-600">
          {t("courses.durationLabel", { count: course.duration_months })}
        </p>
        <div className="mt-4 rounded-2xl bg-ink-50 px-4 py-3 text-sm text-ink-600">
          <p className="line-clamp-3">{course.description || t("common.noData")}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink-100 pt-4">
        <div className="space-y-2 text-sm font-semibold text-ink-600">
          <p className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand-600" />
            {t("courses.groupCount", { count: course.group_count || 0 })}
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-600" />
            {t("courses.studentCount", { count: course.student_count || 0 })}
          </p>
        </div>

        {canManage ? (
          <div className="flex items-center gap-2">
            <Button onClick={() => onEdit(course)} size="sm" variant="ghost">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete(course)}
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

CourseCard.propTypes = {
  canManage: PropTypes.bool.isRequired,
  course: PropTypes.shape({
    description: PropTypes.string,
    duration_months: PropTypes.number.isRequired,
    group_count: PropTypes.number,
    id: PropTypes.number.isRequired,
    daily_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    monthly_price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    student_count: PropTypes.number,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onOpen: PropTypes.func.isRequired,
};

export default CourseCard;
