import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { useLanguage } from "../../context/LanguageContext";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const fetchOrders = useCallback(() => {
    api
      .get("/farmer/orders")
      .then((res) => {
        setOrders(res.data);
        setLoading(false);
      })
      .catch(() => {
        toast.error(t("messages.loadOrdersError"));
        setLoading(false);
      });
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    setCancelling(orderId);
    try {
      const response = await api.put(`/farmer/orders/${orderId}/cancel`);
      console.log("Cancel response:", response.data);
      toast.success(t("farmer.orders.toastCancelled"));
      fetchOrders(); // Refresh the orders list
    } catch (error) {
      console.error("Cancel error:", error);
      console.error("Error response:", error?.response);

      if (error?.response?.status === 401) {
        toast.error(t("messages.sessionExpired"));

        // Show localStorage data for debugging
        const userData = localStorage.getItem("user");
        console.log("Current user data in localStorage:", userData);

        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            console.log("Token exists:", !!parsed.token);
            console.log("Token preview:", parsed.token?.substring(0, 20));
          } catch {
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
      case "FAILED_DELIVERY":
        return "#c2410c";
      case "CANCELLED":
        return "#b42318";
      default:
        return "#6b7280";
    }
  };

  const translateStatusLabel = (status) => {
    if (!status) return "";
    const normalized = status.toLowerCase();
    return t(`status.${normalized}`) || status;
  };

  const getStatusMessage = (status, paymentStatus) => {
    switch (status) {
      case "PENDING":
        return paymentStatus === "PAID"
          ? t("farmer.orders.status.pendingPaid")
          : t("farmer.orders.status.pendingUnpaid");
      case "CONFIRMED":
        return t("farmer.orders.status.confirmed");
      case "DELIVERED":
        return t("farmer.orders.status.delivered");
      case "FAILED_DELIVERY":
        return "Delivery agent rejected this request. Supplier will reassign a new agent.";
      case "CANCELLED":
        return t("farmer.orders.status.cancelled");
      default:
        return "";
    }
  };

  if (loading) {
    return <p>{t("common.labels.loadingOrders")}</p>;
  }

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div className="secondary-page" initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div
        className="page-hero"
        style={{ backgroundImage: "url('/images/orders.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.orders.title")}</h1>
        <p>{t("farmer.orders.subtitle")}</p>
      </motion.div>

      <motion.div style={{ marginTop: "24px", display: "grid", gap: "16px" }} variants={staggerContainer}>
        {orders.length === 0 && (
          <motion.div className="order-card order-card--empty" variants={fadeUp}>
            <div className="order-card__empty-state">
              <p style={{ fontSize: "18px", color: "var(--muted)", fontWeight: "500" }}>
                {t("farmer.orders.empty")}
              </p>
              <Button
                className="btn primary square"
                onClick={() => navigate("/farmer/market")}
                style={{ marginTop: "16px" }}
              >
                {t("common.actions.browseMarket")}
              </Button>
            </div>
          </motion.div>
        )}

        {orders.map((order, idx) => {
          const displayOrderNumber = order.displayOrderNumber ?? order.id;
          return (
            <motion.div
              key={order.id}
              className="order-card order-card--premium"
              variants={fadeUp}
              whileHover={{ scale: 1.01, boxShadow: "0 12px 32px rgba(21, 128, 61, 0.12)" }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="order-card__header">
                <div className="order-card__header-left">
                  <div className="order-card__id-badge">
                    <span>#{displayOrderNumber}</span>
                  </div>
                  <div className="order-card__titles">
                    <h3 className="order-card__title">{t("common.labels.orderId")} #{displayOrderNumber}</h3>
                    <span
                      className="order-card__status-badge"
                      style={{
                        background: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                      }}
                    >
                      {translateStatusLabel(order.status)}
                    </span>
                  </div>
                </div>
                <div className="order-card__amount">
                  <p className="order-card__total">INR {order.totalAmount}</p>
                  <p className="order-card__payment-status" style={{ color: order.paymentStatus === "PAID" ? "#15803d" : "#f59e0b" }}>
                    {order.paymentStatus === "PAID"
                      ? t("common.labels.paymentPaid")
                      : t("common.labels.paymentPending")}
                  </p>
                </div>
              </div>

              <div className="order-card__status-message">
                <p style={{ fontSize: "13px", color: getStatusColor(order.status), marginBottom: "0", fontWeight: "500" }}>
                  {getStatusMessage(order.status, order.paymentStatus)}
                </p>
              </div>

              <div className="order-card__divider"></div>

              <div className="order-card__meta">
                <p className="order-card__date">
                  <span className="order-card__meta-label">{t("common.labels.orderDate")}:</span>
                  <span className="order-card__meta-value">
                    {new Date(order.createdAt).toLocaleDateString(language === "mr" ? "mr-IN" : "en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </p>
              </div>

              <div className="order-card__items">
                <p className="order-card__items-label">{t("common.labels.items")}</p>
                <div className="order-card__items-list">
                  {order.items?.map((item, index) => (
                    <div key={index} className="order-card__item">
                      <span className="order-card__item-name">{item.name}</span>
                      <span className="order-card__item-qty">×{item.quantity || 1}</span>
                      <span className="order-card__item-price">INR {item.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {order.shippingAddress && (
                <div className="order-card__shipping">
                  <p className="order-card__shipping-label">{t("common.labels.shippingAddress")}</p>
                  <div className="order-card__address">
                    <p className="address-item"><strong>{order.shippingAddress.fullName}</strong></p>
                    <p className="address-item">{order.shippingAddress.phone}</p>
                    <p className="address-item">{order.shippingAddress.address}, {order.shippingAddress.city}</p>
                  </div>
                </div>
              )}

              <div className="order-card__actions">
                {order.status === "PENDING" && (
                  <motion.button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancelling === order.id}
                    className="order-card__btn order-card__btn--danger"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {cancelling === order.id ? t("farmer.orders.cancelling") : t("common.actions.cancelOrder")}
                  </motion.button>
                )}

                <motion.button
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="order-card__btn order-card__btn--primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Track Order
                </motion.button>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </motion.div>
  );
}
