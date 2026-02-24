import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("airman_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — only redirect when a session token exists (i.e. the
// session expired). If there is no token the user is actively trying to log in
// and the 401 should be handled by the form component so it can show the error.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const token = localStorage.getItem("airman_token");
      if (token) {
        localStorage.removeItem("airman_token");
        localStorage.removeItem("airman_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);
