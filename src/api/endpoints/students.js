import api from "../axios";

export const studentsApi = {
  list(params) {
    return api.get("/api/students/", { params });
  },
  retrieve(id) {
    return api.get(`/api/students/${id}/`);
  },
  create(payload) {
    return api.post("/api/students/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/students/${id}/`, payload);
  },
  sendToSupport(id, payload) {
    return api.post(`/api/students/${id}/send-to-support/`, payload);
  },
  remove(id) {
    return api.delete(`/api/students/${id}/`);
  },
};
