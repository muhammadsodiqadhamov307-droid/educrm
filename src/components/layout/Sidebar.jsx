import { ChevronLeft, PanelLeftClose, Sparkles, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Button from "../ui/Button";
import AppLogo from "./AppLogo";
import useAuthStore from "../../store/authStore";
import { useUiStore } from "../../store/uiStore";
import { cn } from "../../utils/cn";
import { NAV_ITEMS } from "../../utils/navigation";

function Sidebar() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const isSidebarOpen = useUiStore((state) => state.isSidebarOpen);
  const isSidebarCollapsed = useUiStore((state) => state.isSidebarCollapsed);
  const closeSidebar = useUiStore((state) => state.closeSidebar);
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(user?.role));

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-30 bg-ink-950/35 backdrop-blur-sm transition md:hidden",
          isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeSidebar}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-[88vw] max-w-[320px] flex-col border-r border-white/70 bg-white/95 px-3 py-4 shadow-soft backdrop-blur-xl transition-transform duration-300 md:static md:w-auto md:max-w-none md:translate-x-0 md:bg-white/90 md:px-4 md:py-5",
          isSidebarCollapsed ? "md:w-24" : "md:w-72",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-start justify-between gap-3 px-1 md:px-2">
          <div className={cn("min-w-0", isSidebarCollapsed && "md:flex md:w-full md:justify-center")}>
            {isSidebarCollapsed ? (
              <AppLogo compact />
            ) : (
              <AppLogo />
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button className="md:hidden" onClick={closeSidebar} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
            <Button
              className="hidden md:inline-flex"
              onClick={toggleSidebarCollapsed}
              size="sm"
              variant="ghost"
            >
              {isSidebarCollapsed ? <PanelLeftClose className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="mt-6 flex-1 space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition",
                    isActive
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/20"
                      : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                    isSidebarCollapsed && "md:justify-center",
                  )
                }
                key={item.to}
                onClick={closeSidebar}
                to={item.to}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isSidebarCollapsed ? <span>{t(item.titleKey)}</span> : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="rounded-3xl bg-gradient-to-br from-ink-900 via-indigo-950 to-brand-700 px-4 py-5 text-white">
          {!isSidebarCollapsed ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
                {t("layout.welcome")}
              </p>
              <p className="mt-2 text-sm leading-6 text-indigo-100">
                {user?.first_name || user?.username}, {t("layout.subtitle")}
              </p>
            </>
          ) : (
            <div className="flex justify-center">
              <Sparkles className="h-5 w-5 text-brand-200" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
