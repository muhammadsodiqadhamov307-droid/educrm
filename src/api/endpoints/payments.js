import api from "../axios";

export const paymentsApi = {
  list(params) {
    return api.get("/api/payments/", { params });
  },
  create(payload) {
    return api.post("/api/payments/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/payments/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/payments/${id}/`);
  },
};
