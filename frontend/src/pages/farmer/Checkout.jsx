import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
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
        state: {
          orderId: orderResponse.orderId,
          orderNumber: orderResponse.displayOrderNumber ?? orderResponse.orderNumber ?? orderResponse.orderId,
          amount: getCartTotal(),
        },
      });
      return;
    }

    toast.success(t("farmer.checkout.toastSuccess"));
    clearCart();
    navigate("/farmer/orders");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName || !formData.phone || !formData.address) {
      toast.error(t("messages.requiredFields"));
      return;
    }

    if (!cartItems.length) {
      toast.error(t("messages.cartEmpty"));
      return;
    }

    const hasMissingSupplier = cartItems.some((item) => item.supplierId == null);
    if (hasMissingSupplier) {
      toast.error("Some cart items are outdated. Please clear cart and add items again.");
      return;
    }

    const supplierIds = [...new Set(cartItems.map((item) => item.supplierId).filter((id) => id != null))];
    if (supplierIds.length > 1) {
      toast.error("Your cart has items from multiple suppliers. Please place separate orders.");
      return;
    }

    const paymentMethodName = formData.paymentMethod === "upi"
      ? t("farmer.checkout.upiOption")
      : t("farmer.checkout.codOption");
    const confirmMessage =
      `${t("farmer.checkout.confirmTitle")}\n\n` +
      `${t("farmer.checkout.confirmItems")}: ${cartItems.length}\n` +
      `${t("farmer.checkout.confirmTotal")}: INR ${getCartTotal()}\n` +
      `${t("farmer.checkout.confirmPayment")}: ${paymentMethodName}\n` +
      `${t("farmer.checkout.confirmDelivery")}: ${formData.fullName}, ${formData.address}\n\n` +
      t("farmer.checkout.confirmCta");

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        items: cartItems,
        supplierId: supplierIds[0] ?? null,
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
        toast.success(t("farmer.checkout.toastSuccess"));
        clearCart();
        navigate("/farmer/orders");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      const errorMsg = error.response?.data?.error || t("farmer.checkout.toastError");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems || !cartItems.length) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h2>{t("farmer.checkout.emptyTitle")}</h2>
        <Button
          className="btn primary square"
          onClick={() => navigate("/farmer/market")}
          style={{ marginTop: "20px" }}
        >
          {t("farmer.checkout.emptyAction")}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dash-title">{t("farmer.checkout.title")}</h2>
      <p className="dash-subtitle">{t("farmer.checkout.subtitle")}</p>

      <div className="checkout-alert">
        <p>
          <strong>{t("common.labels.important")}: </strong>
          {t("farmer.checkout.alertText")}
        </p>
      </div>

      <div className="checkout-grid">
        <div className="product-card">
          <h3>{t("common.labels.shippingDetails")}</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>{t("common.labels.fullName")} *</label>
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
              <label>{t("common.labels.phoneNumber")} *</label>
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
              <label>{t("common.labels.address")} *</label>
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
                <label>{t("common.labels.city")}</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="input"
                />
              </div>

              <div className="form-group">
                <label>{t("common.labels.state")}</label>
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
              <label>{t("common.labels.pincode")}</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.paymentMethod")} *</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="upi">{t("farmer.checkout.upiOption")}</option>
                <option value="cod">{t("farmer.checkout.codOption")}</option>
              </select>
            </div>

            <Button type="submit" className="btn primary square" disabled={loading} style={{ marginTop: "16px" }}>
              {loading ? t("common.actions.processing") : t("common.actions.placeOrder")}
            </Button>
          </form>
        </div>

        <div>
          <div className="product-card">
            <h3>{t("common.labels.orderSummary")}</h3>
            <div style={{ marginTop: "16px" }}>
              {cartItems.map((item, index) => (
                <div key={index} className="checkout-summary-item">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", marginBottom: "4px" }}>{item.name}</p>
                    <p style={{ fontSize: "14px", color: "var(--muted)" }}>
                      {t("common.labels.qty")}: {item.quantity || 1}
                    </p>
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
                <span>{t("common.labels.total")}:</span>
                <span style={{ color: "#15803d" }}>INR {getCartTotal()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
