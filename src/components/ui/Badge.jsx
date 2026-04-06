import PropTypes from "prop-types";

import { cn } from "../../utils/cn";

const variantMap = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-700",
  frozen: "bg-sky-100 text-sky-700",
  new: "bg-amber-100 text-amber-700",
  enrolled: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  called: "bg-sky-100 text-sky-700",
  completed: "bg-emerald-100 text-emerald-700",
};

function Badge({ children, className, value }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        variantMap[value] || "bg-brand-100 text-brand-700",
        className,
      )}
    >
      {children || value}
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  value: PropTypes.string.isRequired,
};

export default Badge;
