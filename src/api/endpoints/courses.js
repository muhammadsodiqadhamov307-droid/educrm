import api from "../axios";

export const coursesApi = {
  list(params) {
    return api.get("/api/courses/", { params });
  },
  retrieve(id) {
    return api.get(`/api/courses/${id}/`);
  },
  create(payload) {
    return api.post("/api/courses/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/courses/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/courses/${id}/`);
  },
};
