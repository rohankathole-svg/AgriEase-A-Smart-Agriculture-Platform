import { createContext, useCallback, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const STORAGE_KEY = "user";

const normalizeUserPayload = (payload) => {
  if (!payload) return null;
  const roles = Array.isArray(payload.roles) && payload.roles.length
    ? payload.roles
    : payload.role
      ? [payload.role]
      : [];
  const activeRole = payload.role || roles[0] || null;
  return { ...payload, roles, role: activeRole };
};

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeUserPayload(JSON.parse(raw)) : null;
  } catch (error) {
    console.error("Failed to parse stored user", error);
    return null;
  }
};

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadStoredUser());
  const navigate = useNavigate();

  const persistUser = useCallback((payload) => {
    const normalized = normalizeUserPayload(payload);
    if (!normalized) {
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      return null;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setUser(normalized);
    return normalized;
  }, []);

  const login = (data) => {
    persistUser(data);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    navigate("/");
  };

  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      if (!prev) return prev;
      const normalized = normalizeUserPayload({ ...prev, ...userData });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    });
  }, []);

  const switchRole = async (nextRole) => {
    if (!user || !nextRole || user.role === nextRole) return;
    const availableRoles = user.roles || [];
    if (!availableRoles.includes(nextRole)) return;

    try {
      const { data } = await api.post("/api/user/switch-role", { role: nextRole });
      persistUser({
        ...user,
        token: data.token || user.token,
        role: data.role || nextRole,
        roles: Array.isArray(data.roles) && data.roles.length ? data.roles : availableRoles,
      });
      return data;
    } catch (error) {
      console.error("Failed to switch role", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
