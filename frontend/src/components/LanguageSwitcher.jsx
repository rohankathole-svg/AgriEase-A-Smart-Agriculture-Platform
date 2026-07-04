import { useCallback, useEffect, useRef, useState } from "react";
import { AVAILABLE_LANGUAGES, useLanguage } from "../context/LanguageContext";

function LanguageSwitcher({ showLabel = false }) {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const currentLabel = AVAILABLE_LANGUAGES.find((l) => l.code === language)?.label ?? language;

  const handleSelect = useCallback(
    (code) => {
      setLanguage(code);
      setOpen(false);
    },
    [setLanguage]
  );

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className={`language-switcher${open ? " is-open" : ""}`} ref={ref}>
      <button
        type="button"
        className="language-switcher__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("common.language")}
      >
        <svg
          className="language-switcher__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
        {showLabel && <span className="language-switcher__text">{t("common.language")}</span>}
        <span className="language-switcher__label">{currentLabel}</span>
        <svg
          className="language-switcher__chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="language-switcher__menu" role="listbox">
          {AVAILABLE_LANGUAGES.map((lang) => (
            <li
              key={lang.code}
              role="option"
              aria-selected={lang.code === language}
              className={`language-switcher__option${lang.code === language ? " is-active" : ""}`}
              onClick={() => handleSelect(lang.code)}
            >
              {lang.label}
              {lang.code === language && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LanguageSwitcher;
