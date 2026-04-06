import { ChevronLeft, PanelLeftClose, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Button from "../ui/Button";
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
          "fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-white/70 bg-white/90 px-4 py-5 shadow-soft backdrop-blur-xl transition-transform duration-300 md:static md:translate-x-0",
          isSidebarCollapsed ? "md:w-24" : "md:w-72",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-3 px-2">
          <div className={cn("flex items-center gap-3", isSidebarCollapsed && "md:justify-center")}>
            <div className="rounded-2xl bg-brand-600 p-3 text-white shadow-lg shadow-brand-600/30">
              <Sparkles className="h-5 w-5" />
            </div>
            {!isSidebarCollapsed ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">EduCRM</p>
                <h1 className="text-lg font-extrabold text-ink-900">{t("layout.appName")}</h1>
              </div>
            ) : null}
          </div>

          <div className="hidden md:block">
            <Button
              onClick={toggleSidebarCollapsed}
              size="sm"
              variant="ghost"
            >
              {isSidebarCollapsed ? <PanelLeftClose className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="mt-8 flex-1 space-y-2">
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

        <div className="rounded-3xl bg-ink-900 px-4 py-5 text-white">
          {!isSidebarCollapsed ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
                {t("layout.welcome")}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink-200">
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
