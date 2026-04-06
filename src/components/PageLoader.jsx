import PropTypes from "prop-types";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function PageLoader({ label }) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="glass-panel flex items-center gap-3 px-6 py-4 text-sm font-semibold text-ink-700">
        <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        {label || t("common.loading")}
      </div>
    </div>
  );
}

PageLoader.propTypes = {
  label: PropTypes.string,
};

export default PageLoader;
