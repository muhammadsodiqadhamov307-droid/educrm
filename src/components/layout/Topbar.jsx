import { LogOut, Menu } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLogo from "./AppLogo";
import LanguageSwitcher from "../shared/LanguageSwitcher";
import Button from "../ui/Button";
import useAuthStore from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { getTitleKeyByPath } from "../../utils/navigation";

function Topbar() {
  const { t } = useTranslation();
  const location = useLocation();
  const openSidebar = useUiStore((state) => state.openSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pageTitle = useMemo(() => t(getTitleKeyByPath(location.pathname)), [location.pathname, t]);
  const initials = useMemo(() => {
    const source = `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || user?.username || "U";
    return source
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [user?.first_name, user?.last_name, user?.username]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/88 px-3 py-3 backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button className="md:hidden" onClick={openSidebar} size="sm" variant="ghost">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <AppLogo compact />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-600">
              {t("layout.appName")}
            </p>
            <h2 className="truncate text-2xl font-extrabold leading-none text-ink-900 sm:text-3xl md:text-xl">
              {pageTitle}
            </h2>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 md:justify-end">
          <LanguageSwitcher compact />
          <div className="hidden items-center gap-3 rounded-2xl border border-ink-200 bg-white px-3 py-2 lg:flex">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white">
              {initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-ink-900">{user?.first_name || user?.username}</p>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-ink-500">{user?.role}</p>
            </div>
          </div>
          <Button loading={isLoggingOut} onClick={handleLogout} size="sm" variant="secondary">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t("layout.logout")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
