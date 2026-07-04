import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { CartProvider } from "./context/CartContext";
import { useLanguage } from "./context/LanguageContext";
import { ToastContainer } from "react-toastify";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";
import DeliveryAgentDashboard from "./pages/agent/DeliveryAgentDashboard";
import OrderTracking from "./pages/farmer/OrderTracking";

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    const redirectPath =
      user.role === "SUPPLIER"
        ? "/supplier"
        : user.role === "DELIVERY_AGENT"
          ? "/agent-dashboard"
          : "/farmer";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

function AppFooter() {
  const { t } = useLanguage();
  const location = useLocation();
  const isDashboardRoute =
    location.pathname.startsWith("/farmer") ||
    location.pathname.startsWith("/supplier") ||
    location.pathname.startsWith("/agent-dashboard");

  if (isDashboardRoute) return null;

  return (
    <footer className="app-footer">
      <div className="app-footer__left">{t("appFooter.copyright")}</div>
      <div className="app-footer__right">
        <a href="#" className="app-footer__link">{t("appFooter.privacy")}</a>
        <a href="#" className="app-footer__link">{t("appFooter.terms")}</a>
        <a href="#" className="app-footer__link">{t("appFooter.support")}</a>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-root app-container">
          <main className="app-main">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage initialMode="login" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route
                path="/farmer/*"
                element={
                  <Protected role="FARMER">
                    <FarmerDashboard />
                  </Protected>
                }
              />

              <Route
                path="/supplier/*"
                element={
                  <Protected role="SUPPLIER">
                    <SupplierDashboard />
                  </Protected>
                }
              />

              <Route
                path="/agent-dashboard"
                element={
                  <Protected role="DELIVERY_AGENT">
                    <DeliveryAgentDashboard />
                  </Protected>
                }
              />

              <Route
                path="/orders/:orderId"
                element={
                  <Protected role="FARMER">
                    <OrderTracking />
                  </Protected>
                }
              />
            </Routes>
          </main>
          <AppFooter />
          <ToastContainer
            position="top-right"
            className="toast-container"
          />
        </div>
    </CartProvider>
  </AuthProvider>
  );
}
