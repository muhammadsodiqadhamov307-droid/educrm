import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "";
const AUTH_STORAGE_KEY = "educrm-auth";

export const authClient = axios.create({
  baseURL: API_URL,
});

const api = axios.create({
  baseURL: API_URL,
});

let refreshPromise = null;

function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} error
 * @returns {string}
 */
export function extractErrorMessage(error) {
  const fallback = "Something went wrong";
  const responseData = error?.response?.data;

  if (typeof responseData === "string") {
    return responseData;
  }

  if (responseData?.detail) {
    return responseData.detail;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (responseData && typeof responseData === "object") {
    const firstValue = Object.values(responseData)[0];
    if (Array.isArray(firstValue)) {
      return firstValue[0] || fallback;
    }
    if (typeof firstValue === "string") {
      return firstValue;
    }
  }

  return error?.message || fallback;
}

api.interceptors.request.use((config) => {
  const session = getStoredSession();
  const token = session?.accessToken;

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

authClient.interceptors.request.use((config) => {
  const session = getStoredSession();
  const token = session?.accessToken;

  if (token && !config.headers?.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  return config;
});

authClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.config?.skipErrorToast) {
      toast.error(extractErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config ?? {};
    const isUnauthorized = error?.response?.status === 401;
    const isAuthRequest = originalRequest.url?.includes("/api/auth/");

    if (isUnauthorized && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = Promise.resolve()
            .then(() => useAuthStore.getState().refreshToken())
            .finally(() => {
              refreshPromise = null;
            });
        }

        const nextAccessToken = await refreshPromise;
        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${nextAccessToken}`,
        };

        return api(originalRequest);
      } catch (refreshError) {
        await useAuthStore.getState().logout({ skipRequest: true, showToast: false });
        toast.error("Your session has expired");
        return Promise.reject(refreshError);
      }
    }

    if (!originalRequest.skipErrorToast) {
      toast.error(extractErrorMessage(error));
    }

    return Promise.reject(error);
  },
);

export default api;
