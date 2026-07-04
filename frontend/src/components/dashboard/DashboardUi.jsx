import { motion } from "framer-motion";

export const dashboardFadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

export const dashboardStagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export function DashboardPanel({ className = "", kicker, title, action, children }) {
  return (
    <motion.section
      className={`dashboard-panel ${className}`.trim()}
      variants={dashboardFadeUp}
      whileHover={{ y: -3 }}
    >
      {(kicker || title || action) && (
        <header className="dashboard-panel__header">
          <div>
            {kicker ? <p className="dashboard-panel__kicker">{kicker}</p> : null}
            {title ? <h2 className="dashboard-panel__title">{title}</h2> : null}
          </div>
          {action ? <div className="dashboard-panel__action">{action}</div> : null}
        </header>
      )}
      {children}
    </motion.section>
  );
}

export function DashboardStatCard({ className = "", label, value, helper, icon, accent }) {
  return (
    <motion.article
      className={`dashboard-stat-card ${className}`.trim()}
      variants={dashboardFadeUp}
      whileHover={{ scale: 1.02, y: -4 }}
      style={accent ? { "--stat-accent": accent } : undefined}
    >
      <div className="dashboard-stat-card__icon" aria-hidden="true">
        {icon}
      </div>
      <div className="dashboard-stat-card__content">
        <p className="dashboard-stat-card__label">{label}</p>
        <strong className="dashboard-stat-card__value">{value}</strong>
        <p className="dashboard-stat-card__helper">{helper}</p>
      </div>
    </motion.article>
  );
}

export function DashboardQuickActionCard({
  title,
  subtitle,
  accent,
  icon,
  onClick,
}) {
  return (
    <motion.button
      type="button"
      className="dashboard-quick-card"
      onClick={onClick}
      variants={dashboardFadeUp}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      style={{ "--quick-accent": accent }}
    >
      <div className="dashboard-quick-card__content">
        <p className="dashboard-quick-card__label">{title}</p>
        <h3 className="dashboard-quick-card__title">{subtitle}</h3>
      </div>
      <span className="dashboard-quick-card__icon" aria-hidden="true">
        {icon}
      </span>
    </motion.button>
  );
}
