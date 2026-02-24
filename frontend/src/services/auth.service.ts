import { api } from "./api";
import { ApiResponse, User } from "../types";

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; password: string; name: string; }

export interface AuthResponse { token: string; user: User; }

export const authService = {
  async login(payload: LoginPayload) {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    return res.data.data;
  },

  async register(payload: RegisterPayload) {
    const res = await api.post<ApiResponse<User>>("/auth/register", payload);
    return res.data.data;
  },

  async me() {
    const res = await api.get<ApiResponse<User>>("/auth/me");
    return res.data.data;
  },
};
