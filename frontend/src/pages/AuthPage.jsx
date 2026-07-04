import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../context/LanguageContext";
import "../styles/Auth.css";

export default function AuthPage({ initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode === "register" ? "register" : "login");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const title = useMemo(
    () => (mode === "login" ? t("authPage.loginTitle") : t("authPage.registerTitle")),
    [mode, t]
  );

  const subtitle = useMemo(
    () =>
      mode === "login"
        ? t("authPage.loginSubtitle")
        : t("authPage.registerSubtitle"),
    [mode, t]
  );

  const switchMode = (nextMode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    navigate(nextMode === "register" ? "/register" : "/login", { replace: true });
  };

  return (
    <div className="agri-auth-page">
      <div className="agri-auth-card">
        <div className="agri-auth-image-panel">
          <div className="agri-auth-image-overlay">
            <h2>{t("authPage.imageTitle")}</h2>
            <p>{t("authPage.imageSubtitle")}</p>
          </div>
          <img
            src="/images/auth-panel.jpg"
            alt={t("authPage.imageAlt")}
            className="agri-auth-feature-image"
          />
        </div>

        <div className="agri-auth-content-panel">
          <div className="agri-auth-head">
            <div className="agri-auth-head-actions">
              <button 
                type="button" 
                className="agri-back-btn"
                onClick={() => navigate("/")}
                aria-label={t("authPage.backAria")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5m7-7-7 7 7 7"/>
                </svg>
                {t("authPage.backToHome")}
              </button>
              <ThemeToggle />
            </div>
            <img src="/logo-full.svg" alt={t("authPage.logoAlt")} className="agri-auth-logo" />
            <h1>{title}</h1>
            <p>{subtitle}</p>

            <div className="agri-auth-toggle" role="tablist" aria-label={t("authPage.tablistAria")}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                className={mode === "login" ? "active" : ""}
                onClick={() => switchMode("login")}
              >
                {t("authPage.tabLogin")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                className={mode === "register" ? "active" : ""}
                onClick={() => switchMode("register")}
              >
                {t("authPage.tabRegister")}
              </button>
              <span className={`agri-auth-toggle-indicator ${mode === "register" ? "right" : ""}`} />
            </div>
          </div>

          <div className="agri-auth-form-wrap">
            {mode === "login" ? (
              <LoginForm onSwitchToRegister={() => switchMode("register")} />
            ) : (
              <RegisterForm onSwitchToLogin={() => switchMode("login")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
