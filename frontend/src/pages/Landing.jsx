import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../styles/landing.css";

const stats = [
  { label: "Verified Farmers", value: "2.4K+" },
  { label: "Supplier Listings", value: "650+" },
  { label: "On-Time Delivery", value: "98%" },
  { label: "Support Availability", value: "24/7" },
];

const highlights = [
  {
    title: "Equipment Access",
    text: "Book modern equipment on flexible schedules without high upfront cost.",
    image:
      "https://images.pexels.com/photos/2933243/pexels-photo-2933243.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "Input Marketplace",
    text: "Buy verified seeds, nutrients, and crop-care products from trusted suppliers.",
    image:
      "https://images.pexels.com/photos/2132250/pexels-photo-2132250.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "AI Disease Detection",
    text: "Upload crop photos and receive instant diagnosis with practical treatment tips.",
    image:
      "https://images.pexels.com/photos/7728084/pexels-photo-7728084.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const steps = [
  {
    id: "01",
    title: "Create Your Account",
    detail: "Join as farmer or supplier in under two minutes.",
    route: "/register",
  },
  {
    id: "02",
    title: "Discover Services",
    detail: "Browse products, equipment, and AI crop health tools.",
    route: "/login",
  },
  {
    id: "03",
    title: "Manage Everything",
    detail: "Track bookings, orders, delivery, and payments in one dashboard.",
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

  return (
    <div className="page landing-page">
      <div className="landing-background" aria-hidden="true" />

      <header className="landing-nav container">
        <button className="brand" onClick={() => navigate("/")}>
          <img
            src="/logo-full.svg"
            alt="AgriEase - Growing Smarter"
            className="brand-logo"
          />
        </button>

        <div className="nav-actions">
          <button className="btn outline" onClick={() => navigate("/login")}>
            Login
          </button>
          <button className="btn primary" onClick={() => navigate("/register")}>
            Register
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
            <span className="pill">Smart agriculture ecosystem</span>
            <h1>
              Grow faster with <span>AgriEase</span>
            </h1>
            <p>
              A single platform for equipment rentals, agri-input purchases, and
              AI-powered crop disease detection designed for real farm workflows.
            </p>

            <div className="hero-actions">
              <button
                className="btn primary"
                onClick={() => navigate("/register", { state: { role: "FARMER" } })}
              >
                Join as Farmer
              </button>
              <button
                className="btn outline"
                onClick={() => navigate("/register", { state: { role: "SUPPLIER" } })}
              >
                Join as Supplier
              </button>
              <button className="btn ghost" onClick={() => navigate("/login")}>
                Already have an account
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
              key={item.label}
              className="stat-card"
              variants={fadeUp}
              transition={{ duration: 0.45 }}
            >
              <strong>{item.value}</strong>
              <p>{item.label}</p>
            </motion.article>
          ))}
        </motion.section>

        <section className="features-section">
          <div className="section-heading">
            <span className="pill muted">Why AgriEase</span>
            <h2>Purpose-built tools for modern agriculture</h2>
            <p>
              Structured workflows, trusted suppliers, and AI insights so teams can
              act quickly with confidence.
            </p>
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
                key={card.title}
                className="feature-card"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <div className="feature-image">
                  <img src={card.image} alt={card.title} loading="lazy" onError={handleImageError} />
                </div>
                <div className="feature-body">
                  <h3>{card.title}</h3>
                  <p>{card.text}</p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </section>

        <section className="workflow-section">
          <div className="section-heading">
            <span className="pill muted">How it works</span>
            <h2>Get started in three clear steps</h2>
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
                <h3>{step.title}</h3>
                <p>{step.detail}</p>
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
            <p className="pill inverted">Start today</p>
            <h2>Bring your farm operations into one reliable platform</h2>
            <p>
              Improve decisions, reduce delays, and keep your crop lifecycle data
              connected from field to delivery.
            </p>
          </div>
          <button className="btn primary" onClick={() => navigate("/register")}>
            Create Free Account
          </button>
        </motion.section>
      </main>

      <footer className="landing-footer container">
        <span>{`(c) ${new Date().getFullYear()} AgriEase`}</span>
        <Link to="/login">Already a member? Login</Link>
      </footer>
    </div>
  );
}
