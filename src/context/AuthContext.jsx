import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

// Create a context to share auth state across the app
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem("gut_token");

    if (token) {
      // Set the token in axios headers
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Try to get the user's profile
      api.get("/auth/me")
        .then((res) => {
          setUser(res.data);
        })
        .catch((err) => {
          // If token is invalid, remove it
          if (err.response?.status === 401) {
            localStorage.removeItem("gut_token");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  // Log in with email and password
  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("gut_token", res.data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  }

  // Create a new account
  async function register(name, email, password) {
    const res = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("gut_token", res.data.token);
    api.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
    setUser(res.data.user);
    return res.data;
  }

  // Log out - clear token and user
  function logout() {
    localStorage.removeItem("gut_token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }

  // Refresh the user's profile from the server
  async function refreshUser() {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch {
      // Silently fail - user will see stale data
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth in any component
export const useAuth = () => useContext(AuthContext);
