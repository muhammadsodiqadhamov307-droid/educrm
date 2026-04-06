import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { cn } from "../../utils/cn";

function AppLogo({ className, compact = false }) {
  const { t } = useTranslation();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-400 via-indigo-600 to-indigo-950 shadow-lg shadow-indigo-500/30 ring-1 ring-white/70">
        <img
          alt="EduCRM"
          className="h-full w-full object-cover"
          src="/app-icon.svg"
        />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-brand-500">EduCRM</p>
          <p className="truncate text-sm font-semibold text-ink-800">{t("layout.subtitle")}</p>
        </div>
      ) : null}
    </div>
  );
}

AppLogo.propTypes = {
  className: PropTypes.string,
  compact: PropTypes.bool,
};

export default AppLogo;
