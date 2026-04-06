import { authClient } from "../axios";

export const authApi = {
  login(credentials) {
    return authClient.post("/api/auth/login/", credentials, { skipErrorToast: true });
  },
  refresh(refreshToken) {
    return authClient.post(
      "/api/auth/refresh/",
      { refresh: refreshToken },
      { skipErrorToast: true },
    );
  },
  logout(refreshToken) {
    return authClient.post(
      "/api/auth/logout/",
      { refresh: refreshToken },
      { skipErrorToast: true },
    );
  },
  me(accessToken) {
    return authClient.get("/api/auth/me/", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      skipErrorToast: true,
    });
  },
};
