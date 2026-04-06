import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

import Button from "./ui/Button";

function ErrorMessage({ message, onRetry }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-3xl border border-rose-200 bg-rose-50/70 px-6 py-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700">
        <AlertCircle className="h-7 w-7" />
      </div>
      <p className="mt-4 text-base font-semibold text-ink-900">{message}</p>
      {onRetry ? (
        <div className="mt-5">
          <Button onClick={onRetry} variant="secondary">
            {t("common.retry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string.isRequired,
  onRetry: PropTypes.func,
};

export default ErrorMessage;
