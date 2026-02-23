import { AVAILABLE_LANGUAGES, useLanguage } from "../context/LanguageContext";

function LanguageSwitcher({ showLabel = false }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="language-switcher">
      {showLabel && <span className="language-switcher__text">{t("common.language")}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value)}
        aria-label={t("common.language")}
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default LanguageSwitcher;
