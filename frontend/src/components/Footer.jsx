import { useLanguage } from "../context/LanguageContext";

function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="container">
        <strong>{t("common.brandName")}</strong> (c) {new Date().getFullYear()} {t("footer.rights")}
        <div>{t("footer.tagline")}</div>
      </div>
    </footer>
  );
}

export default Footer;
