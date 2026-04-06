import api from "../axios";

export const leadsApi = {
  list(params) {
    return api.get("/api/leads/", { params });
  },
  create(payload) {
    return api.post("/api/leads/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/leads/${id}/`, payload);
  },
  convert(id) {
    return api.post(`/api/leads/${id}/convert-to-student/`);
  },
  remove(id) {
    return api.delete(`/api/leads/${id}/`);
  },
};
