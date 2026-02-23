import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080/agriease",
});

api.interceptors.request.use((config) => {
  console.log("API Request:", config.method.toUpperCase(), config.url);

  const url = config.url || "";
  const isPublicAuthEndpoint =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/api/auth/login") ||
    url.includes("/api/auth/register");

  if (isPublicAuthEndpoint) {
    console.log("Skipping auth header for public auth endpoint");
    return config;
  }

  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
        console.log("Added Authorization header, token starts with:", parsed.token.substring(0, 20));
        console.log("User role:", parsed.role);
        console.log("Full headers:", config.headers);
      } else {
        console.warn("No token found in user data");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
  } else {
    console.warn("No user data in localStorage");
  }
  return config;
}, (error) => {
  console.error("Request interceptor error:", error);
  return Promise.reject(error);
});

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized:", error.response?.data);

      // Only auto-logout on authentication endpoints getting 401
      // For other endpoints, let the component handle it
      const isAuthEndpoint = error.config?.url?.includes("/auth/");
      const currentPath = window.location.pathname;

      if (!isAuthEndpoint && !currentPath.includes("/login") && !currentPath.includes("/register")) {
        // Check if token exists and seems valid
        const stored = localStorage.getItem("user");
        if (!stored) {
          // No token, redirect to login
          window.location.href = "/login";
        }
        // If token exists, let the component handle the error
        // Don't auto-logout on every 401
      }
    }
    return Promise.reject(error);
  }
);

export default api;
