import PropTypes from "prop-types";
import { SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "../ui/Button";

function FilterBar({ children, onReset }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-semibold text-ink-600">
        <SlidersHorizontal className="h-4 w-4" />
        {t("common.filter")}
      </div>
      {children}
      {onReset ? (
        <Button onClick={onReset} size="sm" variant="ghost">
          {t("common.reset")}
        </Button>
      ) : null}
    </div>
  );
}

FilterBar.propTypes = {
  children: PropTypes.node,
  onReset: PropTypes.func,
};

export default FilterBar;
