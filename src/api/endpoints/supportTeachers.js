import api from "../axios";

export const supportTeachersApi = {
  getAll(params) {
    return api.get("/api/accounts/support-teachers/", { params });
  },
  getById(id) {
    return api.get(`/api/accounts/support-teachers/${id}/`);
  },
  create(payload) {
    return api.post("/api/accounts/support-teachers/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/accounts/support-teachers/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/accounts/support-teachers/${id}/`);
  },
};
