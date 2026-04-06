import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Button from "../ui/Button";

function Pagination({ currentPage, onPageChange, totalPages }) {
  const { t } = useTranslation();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="mt-6 flex items-center justify-between border-t border-ink-100 pt-5">
      <Button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        variant="secondary"
      >
        {t("common.previous")}
      </Button>
      <span className="text-sm font-semibold text-ink-600">
        {t("common.page")} {currentPage} / {totalPages}
      </span>
      <Button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        variant="secondary"
      >
        {t("common.next")}
      </Button>
    </div>
  );
}

Pagination.propTypes = {
  currentPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  totalPages: PropTypes.number.isRequired,
};

export default Pagination;
