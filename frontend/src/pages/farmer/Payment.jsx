import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { orderId, orderNumber, displayOrderNumber, amount } = location.state || {};
  const { t } = useLanguage();
  const upiId = "agriease@paytm";
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const finalOrderNumber = displayOrderNumber ?? orderNumber ?? orderId;

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !paymentConfirmed) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, paymentConfirmed]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // QR Code generation using UPI deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=AgriEase&am=${amount}&cu=INR&tn=Order${finalOrderNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiLink)}`;

  const handleConfirmPayment = async () => {
    if (!transactionId) {
      toast.error(t("messages.paymentEnterTxn"));
      return;
    }

    if (transactionId.length < 12) {
      toast.error(t("messages.paymentTxnLength"));
      return;
    }

    setLoading(true);
    try {
      await api.post("/farmer/payment/confirm", {
        orderId,
        transactionId,
        paymentMethod: "UPI",
      });

      toast.success(`✅ ${t("messages.paymentConfirmed")}`);
      setPaymentConfirmed(true);
      clearCart();

      setTimeout(() => {
        navigate("/farmer/orders");
      }, 2000);
    } catch (error) {
      console.error("Payment confirmation error:", error);
      const errorMsg = error.response?.data?.error || t("messages.paymentConfirmError");
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    navigate("/farmer/cart");
    return null;
  }

  const paymentStyles = {
    container: {
      maxWidth: "800px",
      margin: "0 auto",
      padding: "20px",
      background: "#f8fafc"
    },
    header: {
      background: "linear-gradient(135deg, #2563eb 0%, #1e40af 100%)",
      color: "white",
      padding: "24px",
      borderRadius: "12px 12px 0 0",
      textAlign: "center"
    },
    paymentCard: {
      background: "white",
      borderRadius: "0 0 12px 12px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      overflow: "hidden"
    },
    amountSection: {
      background: "#f1f5f9",
      padding: "20px",
      borderBottom: "1px solid #e2e8f0",
      textAlign: "center"
    },
    paymentBody: {
      padding: "32px"
    },
    qrContainer: {
      background: "#ffffff",
      border: "2px dashed #e2e8f0",
      borderRadius: "16px",
      padding: "24px",
      textAlign: "center",
      marginBottom: "24px"
    },
    methodTab: {
      background: "#2563eb",
      color: "white",
      padding: "8px 16px",
      borderRadius: "20px",
      fontSize: "14px",
      fontWeight: "500",
      display: "inline-block",
      marginBottom: "16px"
    },
    timer: {
      background: "#fef3c7",
      border: "1px solid #f59e0b",
      color: "#92400e",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      textAlign: "center",
      marginBottom: "20px"
    },
    inputGroup: {
      marginBottom: "20px"
    },
    label: {
      display: "block",
      fontSize: "14px",
      fontWeight: "600",
      color: "#374151",
      marginBottom: "8px"
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      border: "2px solid #e5e7eb",
      borderRadius: "8px",
      fontSize: "16px",
      fontFamily: "monospace",
      letterSpacing: "1px",
      outline: "none",
      transition: "border-color 0.2s",
      background: "#f9fafb"
    },
    submitBtn: {
      background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
      color: "white",
      border: "none",
      padding: "14px 24px",
      borderRadius: "8px",
      fontSize: "16px",
      fontWeight: "600",
      width: "100%",
      cursor: "pointer",
      transition: "all 0.2s",
      marginBottom: "12px"
    },
    secondaryBtn: {
      background: "transparent",
      color: "#6b7280",
      border: "2px solid #e5e7eb",
      padding: "12px 24px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      width: "100%",
      cursor: "pointer",
      transition: "all 0.2s"
    },
    securityNote: {
      background: "#f0f9ff",
      border: "1px solid #0ea5e9",
      color: "#0369a1",
      padding: "12px 16px",
      borderRadius: "8px",
      fontSize: "13px",
      marginTop: "16px",
      textAlign: "center"
    }
  };

  return (
    <motion.div
      style={paymentStyles.container}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div style={paymentStyles.header}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700" }}>
          {t("farmer.payment.title")}
        </h2>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9 }}>
          {t("common.labels.orderId")} #{finalOrderNumber}
        </p>
      </div>

      <div style={paymentStyles.paymentCard}>
        {/* Amount Section */}
        <div style={paymentStyles.amountSection}>
          <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "4px" }}>
            {t("farmer.payment.amountToPay")}
          </div>
          <div style={{ fontSize: "32px", fontWeight: "700", color: "#1e293b" }}>
            ₹{amount}
          </div>
        </div>

        {/* Payment Body */}
        <div style={paymentStyles.paymentBody}>
          {/* Payment Method */}
          <div style={paymentStyles.methodTab}>
            📱 {t("farmer.payment.upiPayment")}
          </div>

          {/* Timer */}
          <div style={paymentStyles.timer}>
            ⏰ {t("farmer.payment.completeWithin")} {formatTime(timeLeft)}
          </div>

          {/* QR Code Section */}
          <div style={paymentStyles.qrContainer}>
            <div style={{ marginBottom: "16px" }}>
              <img
                src={qrCodeUrl}
                alt="UPI QR Code"
                style={{
                  width: "280px",
                  height: "280px",
                  border: "4px solid #f1f5f9",
                  borderRadius: "12px"
                }}
              />
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "#1e293b", marginBottom: "8px" }}>
              {t("farmer.payment.scanQrPrompt")}
            </div>
            <div style={{ fontSize: "14px", color: "#64748b", marginBottom: "12px" }}>
              {t("farmer.payment.payTo")}: {upiId}
            </div>
            <div style={{
              background: "#e0f2fe",
              color: "#0369a1",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              display: "inline-block"
            }}>
              {t("farmer.payment.supportedApps")}
            </div>
          </div>

          {/* Transaction ID Input */}
          <div style={paymentStyles.inputGroup}>
            <label style={paymentStyles.label}>
              {t("common.labels.transactionId")}
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.trim())}
              placeholder={t("common.labels.transactionPlaceholder")}
              disabled={paymentConfirmed || loading}
              maxLength="30"
              style={{
                ...paymentStyles.input,
                borderColor: transactionId && transactionId.length < 12 ? "#ef4444" : "#e5e7eb"
              }}
            />
            {transactionId && transactionId.length < 12 && (
              <p style={{ fontSize: "12px", color: "#ef4444", marginTop: "4px" }}>
                {t("common.labels.transactionValidation")}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <button
            style={{
              ...paymentStyles.submitBtn,
              opacity: paymentConfirmed || loading || !transactionId || transactionId.length < 12 ? 0.6 : 1,
              cursor: paymentConfirmed || loading || !transactionId || transactionId.length < 12 ? 'not-allowed' : 'pointer'
            }}
            onClick={handleConfirmPayment}
            disabled={paymentConfirmed || loading || !transactionId || transactionId.length < 12}
          >
            {loading
              ? `⏳ ${t("farmer.payment.verifying")}`
              : paymentConfirmed
                ? `✅ ${t("common.actions.paymentConfirmed")}`
                : t("common.actions.confirmPayment")}
          </button>

          <button
            style={paymentStyles.secondaryBtn}
            onClick={() => navigate("/farmer/cart")}
          >
            ← {t("common.actions.backToCart")}
          </button>

          {/* Security Note */}
          <div style={paymentStyles.securityNote}>
            🔒 {t("farmer.payment.securityNote")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
