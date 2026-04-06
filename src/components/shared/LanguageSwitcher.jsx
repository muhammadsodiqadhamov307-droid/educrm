import PropTypes from "prop-types";

import { cn } from "../../utils/cn";
import { useUiStore } from "../../store/uiStore";

const languages = [
  { code: "uz", label: "UZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
];

function LanguageSwitcher({ compact = false }) {
  const currentLanguage = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-ink-200 bg-white/90 p-1 shadow-sm">
      {languages.map((language) => (
        <button
          className={cn(
            "rounded-xl font-semibold transition",
            compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
            currentLanguage === language.code
              ? "bg-brand-600 text-white"
              : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
          )}
          key={language.code}
          onClick={() => setLanguage(language.code)}
          type="button"
        >
          {language.label}
        </button>
      ))}
    </div>
  );
}

LanguageSwitcher.propTypes = {
  compact: PropTypes.bool,
};

export default LanguageSwitcher;
