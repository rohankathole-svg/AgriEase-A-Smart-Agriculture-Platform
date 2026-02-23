import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import "../styles/Auth.css";

export default function AuthPage({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const navigate = useNavigate();

  useEffect(() => {
    setMode(initialMode === "register" ? "register" : "login");
  }, [initialMode]);

  const title = useMemo(
    () => (mode === "login" ? "Welcome back to AgriEase" : "Create your AgriEase account"),
    [mode]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? "Sign in to manage crops, orders, and farm insights."
        : "Join the platform to connect farmers and suppliers.",
    [mode]
  );

  const switchMode = (nextMode) => {
    setMode(nextMode);
    navigate(nextMode === "register" ? "/register" : "/login", { replace: true });
  };

  return (
    <div className="agri-auth-page">
      <div className="agri-auth-bg-orb agri-auth-bg-orb--one" />
      <div className="agri-auth-bg-orb agri-auth-bg-orb--two" />

      <div className={`agri-auth-card ${mode === "register" ? "is-register" : ""}`}>
        <div className="agri-auth-head">
          <img src="/logo-full.svg" alt="AgriEase logo" className="agri-auth-logo" />
          <h1>{title}</h1>
          <p>{subtitle}</p>

          <div className="agri-auth-toggle" role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "active" : ""}
              onClick={() => switchMode("register")}
            >
              Register
            </button>
            <span className={`agri-auth-toggle-indicator ${mode === "register" ? "right" : ""}`} />
          </div>
        </div>

        <div className="agri-auth-flip-wrap">
          <div className="agri-auth-flip">
            <div className="agri-auth-face agri-auth-face--front">
              <LoginForm onSwitchToRegister={() => switchMode("register")} />
            </div>
            <div className="agri-auth-face agri-auth-face--back">
              <RegisterForm onSwitchToLogin={() => switchMode("login")} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
