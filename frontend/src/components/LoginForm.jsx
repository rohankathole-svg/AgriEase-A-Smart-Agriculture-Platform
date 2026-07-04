import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import AuthInput from "./AuthInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  return responseData?.message || "Login failed. Please check your credentials.";
};

const loginRequest = async (payload) => {
  try {
    // Required endpoint from spec
    return await api.post("/api/auth/login", payload);
  } catch (error) {
    if (error?.response?.status === 404) {
      // Backward compatibility with existing backend mapping
      return api.post("/auth/login", payload);
    }
    throw error;
  }
};

export default function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (status.text) setStatus({ type: "", text: "" });
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const { data } = await loginRequest({
        email: form.email.trim(),
        password: form.password,
      });

      // Keep JWT accessible for both legacy and current auth flows.
      localStorage.setItem("token", data.token);
      login(data);
      setStatus({ type: "success", text: `Welcome back, ${data?.name || "farmer"}.` });

      const role =
        data?.role || (Array.isArray(data?.roles) && data.roles.length ? data.roles[0] : "FARMER");
      const redirectPath =
        role === "SUPPLIER"
          ? "/supplier"
          : role === "DELIVERY_AGENT"
            ? "/agent-dashboard"
            : "/farmer";
      navigate(redirectPath);
    } catch (error) {
      setStatus({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="agri-auth-form" onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="login-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        value={form.email}
        onChange={updateField}
        error={errors.email}
        required
      />

      <AuthInput
        id="login-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        value={form.password}
        onChange={updateField}
        error={errors.password}
        required
      />

      {status.text ? (
        <p className={`agri-message ${status.type === "success" ? "success" : "error"}`} role="alert">
          {status.text}
        </p>
      ) : null}

      <button type="submit" className="agri-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="agri-spinner" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          "Login"
        )}
      </button>

      <button type="button" className="agri-link-btn" onClick={onSwitchToRegister}>
        New to AgriEase? Create account
      </button>
    </form>
  );
}
