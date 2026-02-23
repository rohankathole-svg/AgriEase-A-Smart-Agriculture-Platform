import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastContainer } from "react-toastify";

import Landing from "./pages/Landing";
import AuthPage from "./pages/AuthPage";
import Login from "./pages/Login";
import Register from "./pages/Register";

import FarmerDashboard from "./pages/farmer/FarmerDashboard";
import SupplierDashboard from "./pages/supplier/SupplierDashboard";

function Protected({ children, role }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== role) {
    const redirectPath = user.role === "SUPPLIER" ? "/supplier" : "/farmer";
    return <Navigate to={redirectPath} replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
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
        </Routes>
        <ToastContainer position="top-right" />
      </CartProvider>
    </AuthProvider>
  );
}
