import api from "../axios";

export const dashboardApi = {
  stats() {
    return api.get("/api/dashboard/stats/");
  },
};
