import { api } from "./api";
import { ApiResponse, User, PaginatedResponse, Role } from "../types";

export const adminService = {
  async listUsers(params?: { page?: number; limit?: number; role?: Role }) {
    const res = await api.get<ApiResponse<PaginatedResponse<User>>>("/admin/users", { params });
    return res.data.data;
  },

  async createInstructor(data: { email: string; name: string; password: string }) {
    const res = await api.post<ApiResponse<User>>("/admin/users/instructor", data);
    return res.data.data;
  },

  async approveStudent(userId: string) {
    const res = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/approve`);
    return res.data.data;
  },

  async deleteUser(userId: string) {
    await api.delete(`/admin/users/${userId}`);
  },
};
