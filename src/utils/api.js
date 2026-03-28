import axios from "axios";

// Create an axios instance with default settings
// All API calls go through /api (the Vite proxy forwards to the backend)
const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// Before every request, attach the auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("gut_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// After every response, check for 401 (unauthorized) errors
// If the user's token is expired/invalid, log them out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("gut_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
