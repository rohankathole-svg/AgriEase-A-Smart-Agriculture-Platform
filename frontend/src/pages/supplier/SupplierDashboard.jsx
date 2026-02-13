import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import SupplierProfile from "./SupplierProfile";
import SupplierHome from "./SupplierHome";
import SupplierProducts from "./SupplierProducts";
import SupplierEquipment from "./SupplierEquipment";
import SupplierOrders from "./SupplierOrders";

export default function SupplierDashboard() {
  const basePath = "/supplier";

  return (
    <DashboardLayout roleLabel="Supplier" basePath={basePath}>
      <Routes>
        <Route path="/" element={<SupplierHome />} />
        <Route path="/products" element={<SupplierProducts />} />
        <Route path="/equipment" element={<SupplierEquipment />} />
        <Route path="/orders" element={<SupplierOrders />} />
        <Route path="/profile" element={<SupplierProfile />} />
      </Routes>
    </DashboardLayout>
  );
}
