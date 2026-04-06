import api from "../axios";

export const teachersApi = {
  list(params) {
    return api.get("/api/teachers/", { params });
  },
  retrieve(id) {
    return api.get(`/api/teachers/${id}/`);
  },
  create(payload) {
    return api.post("/api/teachers/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/teachers/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/teachers/${id}/`);
  },
};
