import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/landing.css";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import { useLanguage } from "../context/LanguageContext";

const stats = [
  { labelKey: "landing.stats.verifiedFarmers", value: "2.4K+" },
  { labelKey: "landing.stats.supplierListings", value: "650+" },
  { labelKey: "landing.stats.onTimeDelivery", value: "98%" },
  { labelKey: "landing.stats.supportAvailability", value: "24/7" },
];

const highlights = [
  {
    titleKey: "landing.features.highlights.equipment.title",
    textKey: "landing.features.highlights.equipment.text",
    image:
      "https://images.unsplash.com/photo-1530533718754-001dd19c4ee4?q=80&w=2670&auto=format&fit=crop", // Tractor
  },
  {
    titleKey: "landing.features.highlights.marketplace.title",
    textKey: "landing.features.highlights.marketplace.text",
    image:
      "https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2670&auto=format&fit=crop", // Fresh produce/farm
  },
  {
    titleKey: "landing.features.highlights.ai.title",
    textKey: "landing.features.highlights.ai.text",
    image:
      "https://images.unsplash.com/photo-1586771107445-d3af1b016d9a?q=80&w=2670&auto=format&fit=crop", // Examining crops/leaves
  },
];

const steps = [
  {
    id: "01",
    titleKey: "landing.workflow.steps.account.title",
    detailKey: "landing.workflow.steps.account.detail",
    route: "/register",
  },
  {
    id: "02",
    titleKey: "landing.workflow.steps.discover.title",
    detailKey: "landing.workflow.steps.discover.detail",
    route: "/login",
  },
  {
    id: "03",
    titleKey: "landing.workflow.steps.manage.title",
    detailKey: "landing.workflow.steps.manage.detail",
    route: "/login",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0 },
};

const staggerGroup = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

function handleImageError(event) {
  const node = event.currentTarget;
  if (node.dataset.fallbackApplied) {
    return;
  }
  node.dataset.fallbackApplied = "1";
  node.src =
    "https://images.pexels.com/photos/974314/pexels-photo-974314.jpeg?auto=compress&cs=tinysrgb&w=1200";
}

export default function Landing() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="page landing-page">
      <div className="landing-background" aria-hidden="true" />

      <header className="landing-nav container">
        <button className="brand" onClick={() => navigate("/")}>
          <img
            src="/logo-full.svg"
            alt={t("common.brandAlt")}
            className="brand-logo"
          />
        </button>

        <nav className="nav-links" aria-label={t("landing.nav.mainNavigation")}>
          <a href="#features">{t("landing.nav.features")}</a>
          <a href="#how-it-works">{t("landing.nav.howItWorks")}</a>
          <a href="#contact">{t("landing.nav.contact")}</a>
        </nav>

        <div className="nav-actions">
          <ThemeToggle />
          <LanguageSwitcher />
          <button className="btn outline" onClick={() => navigate("/login")}>
            {t("common.login")}
          </button>
          <button className="btn primary" onClick={() => navigate("/register")}>
            {t("common.register")}
          </button>
        </div>
      </header>

      <main className="container landing-content">
        <motion.section
          className="hero-section"
          variants={staggerGroup}
          initial="hidden"
          animate="show"
        >
          <motion.div className="hero-content" variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="pill">{t("landing.pill")}</span>
            <h1>
              {t("landing.heroTitle")} <span>{t("landing.heroHighlight")}</span>
            </h1>
            <p>{t("landing.heroDescription")}</p>

            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => navigate("/register", { state: { role: "FARMER" } })}
              >
                {t("common.joinFarmer")}
              </button>
              <button
                className="btn outline"
                onClick={() => navigate("/register", { state: { role: "SUPPLIER" } })}
              >
                {t("common.joinSupplier")}
              </button>
              <button className="btn ghost" onClick={() => navigate("/login")}>
                {t("common.alreadyAccount")}
              </button>
            </div>
          </motion.div>

          <motion.div className="hero-visual" variants={fadeUp} transition={{ duration: 0.55 }}>
            <div className="hero-image-frame">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=2070&auto=format&fit=crop"
                alt={t("landing.heroImageAlt")}
                loading="eager"
                onError={handleImageError}
                className="hero-image"
              />
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          className="stats-section"
          variants={staggerGroup}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
        >
          {stats.map((item, index) => (
            <motion.article
              key={item.labelKey}
              className="stat-card"
              variants={fadeUp}
              transition={{ duration: 0.45, delay: index * 0.1 }}
            >
              <strong>{item.value}</strong>
              <p>{t(item.labelKey)}</p>
            </motion.article>
          ))}
        </motion.section>

        <section id="features" className="features-section">
          <div className="section-heading">
            <span className="pill muted">{t("landing.features.pill")}</span>
            <h2>{t("landing.features.heading")}</h2>
            <p>{t("landing.features.description")}</p>
          </div>

          <motion.div
            className="features-grid"
            variants={staggerGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {highlights.map((card, index) => (
              <motion.article
                key={card.titleKey}
                className="feature-card"
                variants={fadeUp}
                transition={{ duration: 0.45, delay: index * 0.1 }}
              >
                <div className="feature-image">
                  <img 
                    src={card.image} 
                    alt={t(card.titleKey)} 
                    loading="lazy" 
                    onError={handleImageError}
                  />
                </div>
                <div className="feature-body">
                  <h3>{t(card.titleKey)}</h3>
                  <p>{t(card.textKey)}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section id="how-it-works" className="workflow-section">
          <div className="section-heading">
            <span className="pill muted">{t("landing.workflow.pill")}</span>
            <h2>{t("landing.workflow.heading")}</h2>
          </div>

          <motion.div
            className="workflow-grid"
            variants={staggerGroup}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
          >
            {steps.map((step, index) => (
              <motion.article
                key={step.id}
                className="workflow-card"
                variants={fadeUp}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <button className="step-id" onClick={() => navigate(step.route)}>
                  {step.id}
                </button>
                <h3>{t(step.titleKey)}</h3>
                <p>{t(step.detailKey)}</p>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <motion.section
          className="cta-panel"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <p className="pill inverted">{t("landing.cta.pill")}</p>
            <h2>{t("landing.cta.heading")}</h2>
            <p>{t("landing.cta.text")}</p>
          </div>
          <button className="btn primary" onClick={() => navigate("/register")}>
            {t("landing.cta.button")}
          </button>
        </motion.section>
      </main>

      <footer id="contact" className="landing-footer">
        <div className="footer-main container">
          <div className="footer-brand">
            <img src="/logo-full.svg" alt={t("common.brandAlt")} className="footer-logo" />
            <p className="footer-description">{t("landing.footer.description")}</p>
            <div className="footer-social">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label={t("landing.footer.social.facebook")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label={t("landing.footer.social.twitter")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label={t("landing.footer.social.instagram")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label={t("landing.footer.social.youtube")}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="white"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <h4>{t("landing.footer.quickLinks")}</h4>
            <ul>
              <li><a href="#">{t("landing.footer.linkHome")}</a></li>
              <li><a href="#features">{t("landing.footer.linkFeatures")}</a></li>
              <li><a href="#how-it-works">{t("landing.footer.linkHowItWorks")}</a></li>
              <li><Link to="/login">{t("landing.footer.linkLogin")}</Link></li>
              <li><Link to="/register">{t("landing.footer.linkRegister")}</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>{t("landing.footer.getInTouch")}</h4>
            <ul>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>{t("landing.footer.email")}</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                <span>{t("landing.footer.phone")}</span>
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{t("landing.footer.address")}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom container">
          <span>&copy; {new Date().getFullYear()} {t("landing.footer.copyright")}</span>
          <span>{t("landing.footer.madeWith")} &#x2764;&#xFE0F; {t("landing.footer.madeFor")}</span>
        </div>
      </footer>
    </div>
  );
}
