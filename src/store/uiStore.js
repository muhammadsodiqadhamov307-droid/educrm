import { create } from "zustand";

import i18n from "../i18n";

const LANGUAGE_STORAGE_KEY = "educrm-language";
const initialLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "uz";

export const useUiStore = create((set) => ({
  isSidebarOpen: false,
  isSidebarCollapsed: false,
  language: initialLanguage,
  teachersNeedRefresh: false,
  openSidebar() {
    set({ isSidebarOpen: true });
  },
  closeSidebar() {
    set({ isSidebarOpen: false });
  },
  toggleSidebar() {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
  toggleSidebarCollapsed() {
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }));
  },
  setLanguage(language) {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    i18n.changeLanguage(language);
    set({ language });
  },
  markTeachersForRefresh() {
    set({ teachersNeedRefresh: true });
  },
  clearTeachersRefresh() {
    set({ teachersNeedRefresh: false });
  },
}));
