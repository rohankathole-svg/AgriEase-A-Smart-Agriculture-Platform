import { useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function BackButton() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <button
      onClick={() => navigate(-1)}
      className="back-btn"
      aria-label={t("common.back") || "Go back"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5" />
        <path d="M12 19l-7-7 7-7" />
      </svg>
      <span>{t("common.back") || "Back"}</span>
    </button>
  );
}
