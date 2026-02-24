import { create } from "zustand";
import { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
}

// Hydrate from localStorage
function loadFromStorage(): Pick<AuthState, "user" | "token" | "isAuthenticated"> {
  try {
    const token = localStorage.getItem("airman_token");
    const user = localStorage.getItem("airman_user");
    if (token && user) {
      return { token, user: JSON.parse(user), isAuthenticated: true };
    }
  } catch {
    // ignore
  }
  return { token: null, user: null, isAuthenticated: false };
}

export const useAuth = create<AuthState>((set) => ({
  ...loadFromStorage(),

  setAuth: (user, token) => {
    localStorage.setItem("airman_token", token);
    localStorage.setItem("airman_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem("airman_token");
    localStorage.removeItem("airman_user");
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
