import api from "../axios";

export const attendanceApi = {
  list(params) {
    return api.get("/api/attendance/", { params });
  },
  update(id, payload) {
    return api.patch(`/api/attendance/${id}/`, payload);
  },
  bulkSave(payload) {
    return api.post("/api/attendance/bulk-save/", payload);
  },
};
