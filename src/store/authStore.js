import { create } from "zustand";

import { authApi } from "../api/endpoints/auth";

const AUTH_STORAGE_KEY = "educrm-auth";

function persistSession(state) {
  localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
      isAuthenticated: state.isAuthenticated,
    }),
  );
}

function clearPersistedSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isHydrated: false,
  isLoading: false,
  loadFromStorage() {
    if (get().isHydrated) {
      return;
    }

    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) {
        set({ isHydrated: true });
        return;
      }

      const parsed = JSON.parse(raw);
      set({
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        refreshToken: parsed.refreshToken || null,
        isAuthenticated: Boolean(parsed.accessToken),
        isHydrated: true,
      });
    } catch {
      clearPersistedSession();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
  setSession({ user, accessToken, refreshToken }) {
    const nextState = {
      user,
      accessToken,
      refreshToken,
      isAuthenticated: Boolean(accessToken),
      isHydrated: true,
    };
    persistSession(nextState);
    set(nextState);
  },
  setAccessToken(accessToken) {
    const current = get();
    const nextState = {
      ...current,
      accessToken,
      isAuthenticated: Boolean(accessToken),
    };
    persistSession(nextState);
    set({
      accessToken,
      isAuthenticated: Boolean(accessToken),
    });
  },
  async login(credentials) {
    set({ isLoading: true });

    try {
      const { data } = await authApi.login(credentials);
      get().setSession({
        user: data.user,
        accessToken: data.access,
        refreshToken: data.refresh,
      });
      return data.user;
    } finally {
      set({ isLoading: false });
    }
  },
  async refreshToken() {
    const refreshToken = get().refreshToken;

    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const { data } = await authApi.refresh(refreshToken);
    get().setAccessToken(data.access);
    return data.access;
  },
  async logout(options = {}) {
    const { skipRequest = false, showToast = false } = options;
    const refreshToken = get().refreshToken;

    if (!skipRequest && refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        if (showToast) {
          throw new Error("Failed to logout");
        }
      }
    }

    clearPersistedSession();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isHydrated: true,
      isLoading: false,
    });

    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
  },
}));

export default useAuthStore;
