import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import api from "../../api/axios";
import Button from "../../components/ui/Button";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    api
      .get("/farmer/orders")
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load orders");
        setLoading(false);
      });
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelling(orderId);
    try {
      const response = await api.put(`/farmer/orders/${orderId}/cancel`);
      console.log("Cancel response:", response.data);
      toast.success("Order cancelled successfully");
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error("Cancel error:", error);
      console.error("Error response:", error?.response);
      
      if (error?.response?.status === 401) {
        toast.error("Session expired. Please logout and login again.");
        
        // Show localStorage data for debugging
        const userData = localStorage.getItem("user");
        console.log("Current user data in localStorage:", userData);
        
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            console.log("Token exists:", !!parsed.token);
            console.log("Token preview:", parsed.token?.substring(0, 20));
          } catch (e) {
            console.error("Error parsing user data");
          }
        }
      } else {
        const errorMessage = error?.response?.data?.error 
          || error?.response?.data?.message 
          || error?.message 
          || "Failed to cancel order";
        toast.error(errorMessage);
      }
    } finally {
      setCancelling(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "#f59e0b";
      case "CONFIRMED":
        return "#3b82f6";
      case "DELIVERED":
        return "#15803d";
      case "CANCELLED":
        return "#b42318";
      default:
        return "#6b7280";
    }
  };

  const getStatusMessage = (status, paymentStatus) => {
    switch (status) {
      case "PENDING":
        return paymentStatus === "PAID" 
          ? "🕐 Waiting for supplier confirmation" 
          : "🕐 Pending payment & supplier confirmation";
      case "CONFIRMED":
        return "✅ Confirmed by supplier - Being prepared";
      case "DELIVERED":
        return "📦 Delivered";
      case "CANCELLED":
        return "❌ Cancelled";
      default:
        return "";
    }
  };

  if (loading) {
    return <p>Loading orders...</p>;
  }

  return (
    <div>
      <h2 className="dash-title">My Orders</h2>
      <p className="dash-subtitle">Track your order and booking history</p>

      <div style={{ marginTop: "24px" }}>
        {orders.length === 0 && (
          <div className="product-card" style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "18px", color: "var(--muted)" }}>
              No orders yet. Start shopping!
            </p>
          </div>
        )}

        {orders.map((order) => (
          <div key={order.id} className="product-card" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <h4>Order #{order.id}</h4>
                  <span
                    className="cart-item-type"
                    style={{
                      background: `${getStatusColor(order.status)}20`,
                      color: getStatusColor(order.status),
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <p style={{ fontSize: "13px", color: getStatusColor(order.status), marginBottom: "8px", fontWeight: "500" }}>
                  {getStatusMessage(order.status, order.paymentStatus)}
                </p>

                <p style={{ fontSize: "14px", color: "var(--muted)", marginBottom: "8px" }}>
                  Placed on: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontWeight: "600", marginBottom: "8px" }}>Items:</p>
                  {order.items?.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      <span>{item.name} x {item.quantity || 1}</span>
                      <span style={{ fontWeight: "600" }}>INR {item.price}</span>
                    </div>
                  ))}
                </div>

                {order.shippingAddress && (
                  <div style={{ marginTop: "16px" }}>
                    <p style={{ fontWeight: "600", marginBottom: "4px" }}>Shipping Address:</p>
                    <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                      {order.shippingAddress.fullName}<br />
                      {order.shippingAddress.phone}<br />
                      {order.shippingAddress.address}, {order.shippingAddress.city}
                    </p>
                  </div>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "24px", fontWeight: "700", color: "#15803d" }}>
                  INR {order.totalAmount}
                </p>
                <p style={{ fontSize: "14px", color: "var(--muted)", marginTop: "4px" }}>
                  {order.paymentMethod?.toUpperCase()}
                </p>
                
                {order.status === "PENDING" && (
                  <Button
                    className="btn secondary square"
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelling === order.id}
                    style={{ 
                      marginTop: "16px",
                      fontSize: "14px",
                      padding: "8px 16px",
                      backgroundColor: "#fee",
                      color: "#b42318",
                      border: "1px solid #fdd"
                    }}
                  >
                    {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
