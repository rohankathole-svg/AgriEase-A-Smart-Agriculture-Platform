import { useState } from "react";
import api from "../api/axios";
import AuthInput from "./AuthInput";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getErrorMessage = (error) => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  return responseData?.message || "Registration failed. Please try again.";
};

const registerRequest = async (payload) => {
  try {
    // Required endpoint from spec
    return await api.post("/api/auth/register", payload);
  } catch (error) {
    if (error?.response?.status === 404) {
      // Backward compatibility with existing backend mapping
      return api.post("/auth/register", payload);
    }
    throw error;
  }
};

export default function RegisterForm({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "FARMER",
  });
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

    if (!form.name.trim()) {
      nextErrors.name = "Name is required.";
    }

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

    if (!form.role) {
      nextErrors.role = "Please choose a role.";
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
      await registerRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });

      setStatus({
        type: "success",
        text: "Registration successful. Please log in with your new account.",
      });

      setTimeout(() => {
        onSwitchToLogin();
      }, 700);
    } catch (error) {
      setStatus({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="agri-auth-form" onSubmit={handleSubmit} noValidate>
      <AuthInput
        id="register-name"
        name="name"
        label="Full Name"
        autoComplete="name"
        value={form.name}
        onChange={updateField}
        error={errors.name}
        required
      />

      <AuthInput
        id="register-email"
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
        id="register-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        value={form.password}
        onChange={updateField}
        error={errors.password}
        required
      />

      <div className={`agri-role-group ${errors.role ? "has-error" : ""}`}>
        <p>Select Role</p>
        <div>
          <button
            type="button"
            className={form.role === "FARMER" ? "active" : ""}
            onClick={() => setForm((prev) => ({ ...prev, role: "FARMER" }))}
          >
            Farmer
          </button>
          <button
            type="button"
            className={form.role === "SUPPLIER" ? "active" : ""}
            onClick={() => setForm((prev) => ({ ...prev, role: "SUPPLIER" }))}
          >
            Supplier
          </button>
        </div>
        {errors.role ? <p className="agri-field-error">{errors.role}</p> : null}
      </div>

      {status.text ? (
        <p className={`agri-message ${status.type === "success" ? "success" : "error"}`} role="alert">
          {status.text}
        </p>
      ) : null}

      <button type="submit" className="agri-submit-btn" disabled={loading}>
        {loading ? (
          <>
            <span className="agri-spinner" aria-hidden="true" />
            Creating account...
          </>
        ) : (
          "Register"
        )}
      </button>

      <button type="button" className="agri-link-btn" onClick={onSwitchToLogin}>
        Already have an account? Login
      </button>
    </form>
  );
}
