import api from "../axios";

export const expensesApi = {
  list(params) {
    return api.get("/api/expenses/", { params });
  },
  create(payload) {
    return api.post("/api/expenses/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/expenses/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/expenses/${id}/`);
  },
};
