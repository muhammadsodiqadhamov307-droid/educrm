import {
  BookOpen,
  CalendarCheck,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  LifeBuoy,
  User,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export const ROLE_DEFAULT_ROUTES = {
  admin: "/dashboard",
  receptionist: "/students",
  support_teacher: "/support-tasks",
  teacher: "/attendance",
};

export const NAV_ITEMS = [
  { to: "/dashboard", titleKey: "nav.dashboard", icon: LayoutDashboard, roles: ["admin"] },
  { to: "/students", titleKey: "nav.students", icon: Users, roles: ["admin", "receptionist"] },
  { to: "/groups", titleKey: "nav.groups", icon: BookOpen, roles: ["admin", "receptionist", "teacher"] },
  { to: "/attendance", titleKey: "nav.attendance", icon: CalendarCheck, roles: ["admin", "teacher"] },
  { to: "/payments", titleKey: "nav.payments", icon: CreditCard, roles: ["admin", "receptionist"] },
  { to: "/courses", titleKey: "nav.courses", icon: GraduationCap, roles: ["admin"] },
  { to: "/teachers", titleKey: "nav.teachers", icon: UserCheck, roles: ["admin"] },
  { to: "/support-teachers", titleKey: "nav.supportTeachers", icon: LifeBuoy, roles: ["admin"] },
  { to: "/leads", titleKey: "nav.leads", icon: UserPlus, roles: ["admin", "receptionist"] },
  { to: "/expenses", titleKey: "nav.expenses", icon: Wallet, roles: ["admin"] },
  {
    to: "/support-tasks",
    titleKey: "nav.supportTasks",
    icon: ClipboardList,
    roles: ["support_teacher"],
  },
  {
    to: "/profile",
    titleKey: "nav.myProfile",
    icon: User,
    roles: ["support_teacher"],
  },
];

/**
 * @param {string | undefined} role
 * @returns {string}
 */
export function getDefaultRouteForRole(role) {
  return ROLE_DEFAULT_ROUTES[role] || "/login";
}

/**
 * @param {string | undefined} role
 * @param {string[]} roles
 * @returns {boolean}
 */
export function isRoleAllowed(role, roles) {
  return Boolean(role && roles.includes(role));
}

/**
 * @param {string} pathname
 * @returns {string}
 */
export function getTitleKeyByPath(pathname) {
  const exactMatch = NAV_ITEMS.find((item) => item.to === pathname);
  return exactMatch?.titleKey || "layout.appName";
}
