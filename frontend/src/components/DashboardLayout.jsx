import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import Chatbot from "./Chatbot";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import "../styles/dashboard.css";

function getIsDesktopViewport() {
  if (typeof window === "undefined") return true;
  return window.innerWidth > 1024;
}

export default function DashboardLayout({ roleLabel, basePath, children }) {
  const { user, logout, switchRole } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDesktopViewport, setIsDesktopViewport] = useState(getIsDesktopViewport);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || "");
  const { t, language } = useLanguage();
  const availableRoles = user?.roles || [];
  const canSwitch = availableRoles.length > 1;
  const roleTheme = roleLabel.toLowerCase();

  useEffect(() => {
    setSelectedRole(user?.role || "");
  }, [user?.role]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = getIsDesktopViewport();
      setIsDesktopViewport(desktop);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isDesktopViewport) {
      document.body.style.overflow = "";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktopViewport, isSidebarOpen]);

  // Close sidebar and scroll to top when route changes
  useEffect(() => {
    closeSidebar();
    window.scrollTo(0, 0);
  }, [location.key]);

  const baseLinks = [{ key: "home", labelKey: "dashboard.nav.home", path: basePath, icon: "🏠" }];

  const supplierLinks =
    roleLabel === "Supplier"
      ? [
          { key: "products", labelKey: "dashboard.nav.products", path: `${basePath}/products`, icon: "📦" },
          { key: "equipment", labelKey: "dashboard.nav.equipment", path: `${basePath}/equipment`, icon: "🚜" },
          { key: "orders", labelKey: "dashboard.nav.orders", path: `${basePath}/orders`, icon: "📑" },
        ]
      : [];

  const farmerLinks =
    roleLabel === "Farmer"
      ? [
          { key: "tools", labelKey: "dashboard.nav.tools", path: `${basePath}/tools`, icon: "🛠️" },
          { key: "crops", labelKey: "dashboard.nav.crops", path: `${basePath}/crops`, icon: "🌾" },
          { key: "market", labelKey: "dashboard.nav.market", path: `${basePath}/market`, icon: "🛍️" },
          { key: "disease", labelKey: "dashboard.nav.disease", path: `${basePath}/disease`, icon: "🧪" },
          { key: "crop-advisor", labelKey: "dashboard.nav.cropAdvisor", path: `${basePath}/crop-advisor`, icon: "🤖" },
          { key: "land-measurement", labelKey: "dashboard.nav.landMeasurement", path: `${basePath}/land-measurement`, icon: "📍" },
          { key: "weekly-schedule", labelKey: "dashboard.nav.weeklySchedule", path: `${basePath}/weekly-schedule`, icon: "📅" },
          { key: "cart", labelKey: "dashboard.nav.cart", path: `${basePath}/cart`, icon: "🛒", type: "cart" },
          { key: "orders", labelKey: "dashboard.nav.orders", path: `${basePath}/orders`, icon: "📑" },
        ]
      : [];

  const profileLink = [{ key: "profile", labelKey: "dashboard.nav.profile", path: `${basePath}/profile`, icon: "👤" }];

  const navLinks = [...baseLinks, ...supplierLinks, ...farmerLinks, ...profileLink];

  const localizedRoleLabel = useMemo(() => {
    if (roleLabel === "Farmer") {
      return t("common.farmer");
    }
    if (roleLabel === "Supplier") {
      return t("common.supplier") || "Supplier";
    }
    return roleLabel;
  }, [roleLabel, t]);

  const currentPageTitle = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const normalizedBasePath = basePath.replace(/\/+$/, "");

    const matchedLink = navLinks
      .slice()
      .sort((a, b) => b.path.length - a.path.length)
      .find((link) => {
        const linkPath = link.path.replace(/\/+$/, "");
        if (linkPath === normalizedBasePath) {
          return path === normalizedBasePath;
        }
        return path === linkPath || path.startsWith(`${linkPath}/`);
      });

    if (matchedLink?.labelKey) {
      return t(matchedLink.labelKey);
    }
    return matchedLink?.label || t("dashboard.nav.home");
  }, [basePath, location.pathname, navLinks, t]);

  const isHomePage = useMemo(() => {
    const path = location.pathname.replace(/\/+$/, "");
    const normalizedBasePath = basePath.replace(/\/+$/, "");
    return path === normalizedBasePath;
  }, [basePath, location.pathname]);

  const dashboardDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "mr" ? "mr-IN" : "en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [language]
  );

  const handleRoleSwitch = async () => {
    if (!canSwitch || !selectedRole || selectedRole === user?.role || isSwitchingRole) return;
    try {
      setIsSwitchingRole(true);
      await switchRole?.(selectedRole);
      closeSidebar();
      navigate(selectedRole === "SUPPLIER" ? "/supplier" : "/farmer");
    } catch {
      toast.error(t("messages.roleSwitchFailed"));
    } finally {
      setIsSwitchingRole(false);
    }
  };

  return (
    <div
      className={`dashboard-shell dashboard-shell--${roleTheme} ${isSidebarOpen ? "sidebar-open" : "sidebar-collapsed"}`}
    >
      <motion.aside
        className={`sidebar sidebar--${roleTheme} ${isSidebarOpen ? "open" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeSidebar} aria-label={t("dashboard.layout.goToLanding")}>
            <img src="/logo.svg" alt={t("common.brandAlt")} className="sidebar-logo" width={36} height={36} />
            <span>{t("common.brandName")}</span>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label={t("dashboard.layout.closeNavigation")}
          >
            x
          </button>
        </div>

        <div className="sidebar-role-wrap">
          <div className="pill sidebar-role">{localizedRoleLabel}</div>
          <p className="sidebar-helper">{user?.name || t("common.brandName")}</p>
        </div>

        <div className="sidebar-language">
          <LanguageSwitcher showLabel />
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.key}
              to={link.path}
              onClick={closeSidebar}
              className={({ isActive }) =>
                `sidebar-link ${link.type === "cart" ? "cart-link" : ""} ${isActive ? "active" : ""}`
              }
            >
              <span className="nav-icon" aria-hidden="true">
                {link.icon}
              </span>
              <span className="nav-label">{link.labelKey ? t(link.labelKey) : link.label}</span>
              {link.type === "cart" && getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          {t("common.logout")}
        </button>
      </motion.aside>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden={isDesktopViewport || !isSidebarOpen}
      />

      <main className="dashboard-main">
        <motion.header
          className="dashboard-headerbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link to="/" className="dashboard-headerbar__brand" aria-label={t("dashboard.layout.goToLanding")}>
            <img src="/logo.svg" alt={t("common.brandAlt")} width={34} height={34} />
            <div>
              <strong>{t("common.brandName")}</strong>
              <span>{localizedRoleLabel} {t("dashboard.layout.workspace")}</span>
            </div>
          </Link>
          <div className="dashboard-headerbar__meta">
            <span className="dashboard-headerbar__chip">{dashboardDateLabel}</span>
            <span className="dashboard-headerbar__chip">{user?.email || user?.name || t("common.brandName")}</span>
            <LanguageSwitcher />
            <ThemeToggle />
            <button type="button" className="dashboard-headerbar__icon-btn" aria-label={t("dashboard.layout.notifications")}>
              <span aria-hidden="true">🔔</span>
            </button>
            <button type="button" className="dashboard-headerbar__icon-btn" aria-label={t("dashboard.layout.settings")}>
              <span aria-hidden="true">⚙️</span>
            </button>
          </div>
        </motion.header>
        <motion.div
          className="dashboard-toolbar dashboard-toolbar--glass"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="dashboard-toolbar__meta">
            <p className="dashboard-toolbar__eyebrow">{localizedRoleLabel}</p>
            <h1 className="dashboard-toolbar__title">{currentPageTitle}</h1>
            <p className="dashboard-toolbar__subtitle">
              {isHomePage ? (user?.name || t("common.brandName")) : `${localizedRoleLabel} workspace`}
            </p>
          </div>
          <div className="dashboard-toolbar__actions">
            {canSwitch && (
              <div className="role-switcher">
                <label className="role-switcher__label" htmlFor="role-select">
                  {t("common.labels.activeRole")}
                </label>
                <div className="role-switcher__controls">
                  <select
                    id="role-select"
                    className="role-switcher__select"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    {availableRoles.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption === "SUPPLIER" ? (t("common.supplier") || "Supplier") : t("common.farmer")}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="role-switch-btn"
                    onClick={handleRoleSwitch}
                    disabled={isSwitchingRole || !selectedRole || selectedRole === user?.role}
                  >
                    {isSwitchingRole ? t("common.actions.processing") : t("common.actions.switchProfile")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
        <button
          type="button"
          className="sidebar-fab"
          onClick={toggleSidebar}
          aria-label={t("dashboard.layout.toggleMenu")}
          aria-expanded={isSidebarOpen}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        {roleLabel === "Farmer" && (
          <Link to={`${basePath}/cart`} className="farmer-cart-fab" aria-label={t("dashboard.layout.openCart")}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="20" r="1" />
              <circle cx="20" cy="20" r="1" />
              <path d="M1 1h4l2.6 12.5a2 2 0 0 0 2 1.5h9.6a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {getCartCount() > 0 && <span className="farmer-cart-fab__badge">{getCartCount()}</span>}
          </Link>
        )}
        <div key={location.key} className="dashboard-content page-transition">
          {children}
        </div>
        <footer className="dashboard-footer">
          <div className="dashboard-footer__left">{t("appFooter.copyright")}</div>
          <div className="dashboard-footer__right">
            <a href="#" className="dashboard-footer__link">{t("appFooter.privacy")}</a>
            <a href="#" className="dashboard-footer__link">{t("appFooter.terms")}</a>
            <a href="#" className="dashboard-footer__link">{t("appFooter.support")}</a>
          </div>
        </footer>
      </main>
      <Chatbot />
    </div>
  );
}
