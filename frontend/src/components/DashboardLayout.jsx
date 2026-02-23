import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../context/CartContext";
import Chatbot from "./Chatbot";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import "../styles/dashboard.css";

export default function DashboardLayout({ roleLabel, basePath, children }) {
  const { user, logout, switchRole } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || "");
  const { t } = useLanguage();
  const availableRoles = user?.roles || [];
  const canSwitch = availableRoles.length > 1;

  useEffect(() => {
    setSelectedRole(user?.role || "");
  }, [user?.role]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

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
      return t("common.supplier");
    }
    return roleLabel;
  }, [roleLabel, t]);

  const handleRoleSwitch = async () => {
    if (!canSwitch || !selectedRole || selectedRole === user?.role || isSwitchingRole) return;
    try {
      setIsSwitchingRole(true);
      await switchRole?.(selectedRole);
      closeSidebar();
      navigate(selectedRole === "SUPPLIER" ? "/supplier" : "/farmer");
    } catch (error) {
      toast.error(t("messages.roleSwitchFailed"));
    } finally {
      setIsSwitchingRole(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeSidebar} aria-label="Go to landing">
            <img src="/logo.svg" alt={t("common.brandAlt")} className="sidebar-logo" width={36} height={36} />
            <span>{t("common.brandName")}</span>
          </Link>
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={closeSidebar}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <div className="sidebar-language">
          <LanguageSwitcher showLabel />
        </div>

        <div className="pill sidebar-role">{localizedRoleLabel}</div>

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
              <span className="nav-label">{t(link.labelKey)}</span>
              {link.type === "cart" && getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          {t("common.logout")}
        </button>
      </aside>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
      />

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
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
                      {roleOption === "SUPPLIER" ? t("common.supplier") : t("common.farmer")}
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
          <LanguageSwitcher />
        </div>
        <button
          type="button"
          className="sidebar-fab"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          |||
        </button>
        <div key={location.pathname} className="dashboard-content page-transition">
          {children}
        </div>
      </main>
      <Chatbot />
    </div>
  );
}
