import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import Button from "../../components/ui/Button";
import SearchBar from "../../components/shared/SearchBar";

function StudentsFilter({
  balance,
  onBalanceChange,
  onReset,
  onSearchChange,
  onStatusChange,
  search,
  status,
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-ink-50/80 p-4 lg:flex-row lg:items-center lg:justify-between">
      <SearchBar
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={t("students.searchPlaceholder")}
        value={search}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          onChange={(event) => onStatusChange(event.target.value)}
          value={status}
        >
          <option value="all">{t("students.filters.allStatuses")}</option>
          <option value="active">{t("students.statusOptions.active")}</option>
          <option value="inactive">{t("students.statusOptions.inactive")}</option>
          <option value="frozen">{t("students.statusOptions.frozen")}</option>
        </select>

        <select
          className="rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm font-medium text-ink-700 shadow-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          onChange={(event) => onBalanceChange(event.target.value)}
          value={balance}
        >
          <option value="all">{t("students.filters.allBalances")}</option>
          <option value="negative">{t("students.filters.negativeOnly")}</option>
        </select>

        <Button onClick={onReset} variant="secondary">
          {t("common.reset")}
        </Button>
      </div>
    </div>
  );
}

StudentsFilter.propTypes = {
  balance: PropTypes.oneOf(["all", "negative"]).isRequired,
  onBalanceChange: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  search: PropTypes.string.isRequired,
  status: PropTypes.oneOf(["all", "active", "inactive", "frozen"]).isRequired,
};

export default StudentsFilter;
