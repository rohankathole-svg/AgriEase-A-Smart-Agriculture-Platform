import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/landing.css";
import LanguageSwitcher from "../components/LanguageSwitcher";
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
      "https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    titleKey: "landing.features.highlights.marketplace.title",
    textKey: "landing.features.highlights.marketplace.text",
    image:
      "https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    titleKey: "landing.features.highlights.ai.title",
    textKey: "landing.features.highlights.ai.text",
    image:
      "https://images.pexels.com/photos/7728084/pexels-photo-7728084.jpeg?auto=compress&cs=tinysrgb&w=1200",
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

        <div className="nav-actions">
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
                src="https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1400"
                alt="Healthy farm field"
                loading="eager"
                onError={handleImageError}
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
          {stats.map((item) => (
            <motion.article
              key={item.labelKey}
              className="stat-card"
              variants={fadeUp}
              transition={{ duration: 0.45 }}
            >
              <strong>{item.value}</strong>
              <p>{t(item.labelKey)}</p>
            </motion.article>
          ))}
        </motion.section>

        <section className="features-section">
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
            {highlights.map((card) => (
              <motion.article
                key={card.titleKey}
                className="feature-card"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <div className="feature-image">
                  <img src={card.image} alt={t(card.titleKey)} loading="lazy" onError={handleImageError} />
                </div>
                <div className="feature-body">
                  <h3>{t(card.titleKey)}</h3>
                  <p>{t(card.textKey)}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section className="workflow-section">
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
            {steps.map((step) => (
              <motion.article
                key={step.id}
                className="workflow-card"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
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

      <footer className="landing-footer container">
        <span>{`(c) ${new Date().getFullYear()} ${t("common.brandName")}`}</span>
        <Link to="/login">{t("landing.footer.loginLink")}</Link>
      </footer>
    </div>
  );
}
