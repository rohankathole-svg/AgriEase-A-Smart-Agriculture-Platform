import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../context/CartContext";
import Chatbot from "./Chatbot";
import "../styles/dashboard.css";

export default function DashboardLayout({ roleLabel, basePath, children }) {
  const { logout } = useAuth();
  const { getCartCount } = useCart();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const baseLinks = [{ key: "home", label: "Home", path: basePath, icon: "🏠" }];

  const supplierLinks =
    roleLabel === "Supplier"
      ? [
          { key: "products", label: "Products", path: `${basePath}/products`, icon: "📦" },
          { key: "equipment", label: "Equipment", path: `${basePath}/equipment`, icon: "🚜" },
          { key: "orders", label: "Orders", path: `${basePath}/orders`, icon: "📑" },
        ]
      : [];

  const farmerLinks =
    roleLabel === "Farmer"
      ? [
          { key: "tools", label: "Tools", path: `${basePath}/tools`, icon: "🛠️" },
          { key: "crops", label: "Crops", path: `${basePath}/crops`, icon: "🌾" },
          { key: "market", label: "Market", path: `${basePath}/market`, icon: "🛍️" },
          { key: "disease", label: "Disease", path: `${basePath}/disease`, icon: "🧪" },
          { key: "cart", label: "Cart", path: `${basePath}/cart`, icon: "🛒", type: "cart" },
          { key: "orders", label: "Orders", path: `${basePath}/orders`, icon: "📑" },
        ]
      : [];

  const profileLink = [{ key: "profile", label: "Profile", path: `${basePath}/profile`, icon: "👤" }];

  const navLinks = [...baseLinks, ...supplierLinks, ...farmerLinks, ...profileLink];

  return (
    <div className="dashboard-shell">
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <Link to="/" className="sidebar-brand" onClick={closeSidebar} aria-label="Go to landing">
            <img src="/logo.svg" alt="AgriEase" className="sidebar-logo" width={36} height={36} />
            <span>AgriEase</span>
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

        <div className="pill sidebar-role">{roleLabel}</div>

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
              <span className="nav-label">{link.label}</span>
              {link.type === "cart" && getCartCount() > 0 && (
                <span className="cart-badge">{getCartCount()}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <button className="sidebar-logout" onClick={logout}>
          Logout
        </button>
      </aside>

      <div
        className={`sidebar-overlay ${isSidebarOpen ? "visible" : ""}`}
        onClick={closeSidebar}
        aria-hidden={!isSidebarOpen}
      />

      <main className="dashboard-main">
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
