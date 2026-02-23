import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

function Header() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <header className="site-header container">
      <button className="brand" onClick={() => navigate("/")}>
        <img
          src="/logo-full.svg"
          alt={t("common.brandAlt")}
          style={{ height: "64px", width: "auto" }}
        />
      </button>

      <div className="nav-actions">
        <LanguageSwitcher />
        <Button className="btn outline" onClick={() => navigate("/login")}>
          {t("common.login")}
        </Button>
        <Button className="btn primary" onClick={() => navigate("/register")}>
          {t("common.register")}
        </Button>
      </div>
    </header>
  );
}

export default Header;
