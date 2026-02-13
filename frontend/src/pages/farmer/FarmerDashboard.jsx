import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import FarmerHome from "./FarmerHome";
import Tools from "./Tools";
import Crops from "./Crops";
import Market from "./Market";
import FarmerDisease from "./FarmerDisease";
import Cart from "./Cart";
import Checkout from "./Checkout";
import Payment from "./Payment";
import Orders from "./Orders";
import FarmerProfile from "./FarmerProfile";

export default function FarmerDashboard() {
  const basePath = "/farmer";

  return (
    <DashboardLayout roleLabel="Farmer" basePath={basePath}>
      <Routes>
        <Route path="/" element={<FarmerHome />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/crops" element={<Crops />} />
        <Route path="/market" element={<Market />} />
        <Route path="/disease" element={<FarmerDisease />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<FarmerProfile />} />
      </Routes>
    </DashboardLayout>
  );
}
