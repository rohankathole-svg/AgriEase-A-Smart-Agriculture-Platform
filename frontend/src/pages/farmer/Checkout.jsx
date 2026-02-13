import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "upi",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      fullName: user.name || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
    }));
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePayment = (orderResponse) => {
    if (formData.paymentMethod === "upi") {
      navigate("/farmer/payment", {
        state: { orderId: orderResponse.orderId, amount: getCartTotal() },
      });
      return;
    }

    toast.success("Order placed. Waiting for supplier confirmation.");
    clearCart();
    navigate("/farmer/orders");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!cartItems.length) {
      toast.error("Your cart is empty");
      return;
    }

    const paymentMethodName = formData.paymentMethod === "upi" ? "UPI QR Code" : "Cash on Delivery";
    const confirmMessage =
      `Confirm your order?\n\n` +
      `Items: ${cartItems.length} item(s)\n` +
      `Total Amount: INR ${getCartTotal()}\n` +
      `Payment Method: ${paymentMethodName}\n` +
      `Delivery to: ${formData.fullName}, ${formData.address}\n\n` +
      "Click OK to place order";

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        },
        paymentMethod: formData.paymentMethod,
        totalAmount: getCartTotal(),
      };

      const { data } = await api.post("/farmer/orders", orderData);

      if (formData.paymentMethod !== "cod") {
        handlePayment(data);
      } else {
        toast.success("Order placed. Waiting for supplier confirmation.");
        clearCart();
        navigate("/farmer/orders");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      const errorMsg = error.response?.data?.error || "Failed to place order";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems || !cartItems.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>Your cart is empty</h2>
        <Button
          className="btn primary square"
          onClick={() => navigate("/farmer/market")}
          style={{ marginTop: "20px" }}
        >
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dash-title">Checkout</h2>
      <p className="dash-subtitle">Complete your order</p>

      <div className="checkout-alert">
        <p>
          <strong>Important:</strong> After payment, your order stays <strong>PENDING</strong> until
          supplier confirmation.
        </p>
      </div>

      <div className="checkout-grid">
        <div className="product-card">
          <h3>Shipping Details</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
                rows="3"
                required
              />
            </div>

            <div className="checkout-city-grid">
              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pincode</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>Payment Method *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="upi">UPI QR Code</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>

            <Button type="submit" className="btn primary square" disabled={loading} style={{ marginTop: "16px" }}>
              {loading ? "Processing..." : "Place Order"}
            </Button>
          </form>
        </div>

        <div>
          <div className="product-card">
            <h3>Order Summary</h3>
            <div style={{ marginTop: "16px" }}>
              {cartItems.map((item, index) => (
                <div key={index} className="checkout-summary-item">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", marginBottom: "4px" }}>{item.name}</p>
                    <p style={{ fontSize: "14px", color: "var(--muted)" }}>Qty: {item.quantity || 1}</p>
                  </div>
                  <p style={{ fontWeight: "700", color: "#15803d" }}>INR {item.price || item.dailyRate}</p>
                </div>
              ))}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "16px 0",
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                <span>Total:</span>
                <span style={{ color: "#15803d" }}>INR {getCartTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
