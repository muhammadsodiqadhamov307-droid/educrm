import useAuthStore from "../store/authStore";
import { getDefaultRouteForRole } from "../utils/navigation";

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return {
    user,
    role: user?.role,
    isAuthenticated,
    defaultRoute: getDefaultRouteForRole(user?.role),
    hasRole(roles) {
      return Boolean(user?.role && roles.includes(user.role));
    },
  };
}
