import api from "../axios";

export const supportTasksApi = {
  getList(params) {
    return api.get("/api/support-tasks/", { params });
  },
  updateStatus(id, status) {
    return api.patch(`/api/support-tasks/${id}/`, { status });
  },
  sendToSupport(studentId, payload) {
    return api.post(`/api/students/${studentId}/send-to-support/`, payload);
  },
};
