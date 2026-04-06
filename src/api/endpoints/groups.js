import api from "../axios";

export const groupsApi = {
  list(params) {
    return api.get("/api/groups/", { params });
  },
  retrieve(id) {
    return api.get(`/api/groups/${id}/`);
  },
  create(payload) {
    return api.post("/api/groups/", payload);
  },
  update(id, payload) {
    return api.patch(`/api/groups/${id}/`, payload);
  },
  remove(id) {
    return api.delete(`/api/groups/${id}/`);
  },
  students(id, params) {
    return api.get(`/api/groups/${id}/students/`, { params });
  },
  addStudent(id, payload) {
    return api.post(`/api/groups/${id}/add-student/`, payload);
  },
  removeStudent(groupId, studentId) {
    return api.delete(`/api/groups/${groupId}/remove-student/${studentId}/`);
  },
};
