import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { orderId, amount } = location.state || {};
  const [upiId, setUpiId] = useState("agriease@paytm"); // Replace with your UPI ID
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [loading, setLoading] = useState(false);

  // QR Code generation using UPI deep link
  const upiLink = `upi://pay?pa=${upiId}&pn=AgriEase&am=${amount}&cu=INR&tn=Order${orderId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    upiLink
  )}`;

  const handleConfirmPayment = async () => {
    if (!transactionId) {
      toast.error("Please enter transaction ID");
      return;
    }

    if (transactionId.length < 12) {
      toast.error("Transaction ID must be at least 12 characters");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/farmer/payment/confirm", {
        orderId,
        transactionId,
        paymentMethod: "UPI",
      });

      toast.success("✅ Payment confirmed! Waiting for supplier confirmation.");
      setPaymentConfirmed(true);
      clearCart();

      setTimeout(() => {
        navigate("/farmer/orders");
      }, 2000);
    } catch (error) {
      console.error("Payment confirmation error:", error);
      const errorMsg = error.response?.data?.error || "Failed to confirm payment. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!orderId) {
    navigate("/farmer/cart");
    return null;
  }

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto" }}>
      <h2 className="dash-title">Complete Payment</h2>
      <p className="dash-subtitle">Scan QR code to pay via UPI</p>

      <div style={{ 
        background: "#fef3c7", 
        border: "1px solid #fbbf24", 
        borderRadius: "8px", 
        padding: "12px 16px", 
        marginTop: "16px",
        marginBottom: "16px"
      }}>
        <p style={{ fontSize: "14px", color: "#92400e", margin: 0 }}>
          ℹ️ <strong>Note:</strong> After payment, your order will be PENDING until the supplier confirms it.
        </p>
      </div>

      <div className="product-card" style={{ textAlign: "center", marginTop: "24px" }}>
        <div
          style={{
            background: "#fff",
            padding: "20px",
            borderRadius: "12px",
            display: "inline-block",
          }}
        >
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            style={{ width: "300px", height: "300px" }}
          />
        </div>

        <div style={{ marginTop: "24px" }}>
          <p style={{ fontSize: "24px", fontWeight: "700", color: "#15803d" }}>
            INR {amount}
          </p>
          <p style={{ fontSize: "16px", color: "var(--muted)", marginTop: "8px" }}>
            Order ID: {orderId}
          </p>
        </div>

        <div style={{ marginTop: "24px", textAlign: "left" }}>
          <h4 style={{ marginBottom: "12px" }}>📱 Payment Instructions:</h4>
          <ol style={{ marginTop: "12px", lineHeight: "1.8", paddingLeft: "20px" }}>
            <li>Open any UPI app (GPay, PhonePe, Paytm, BHIM, etc.)</li>
            <li>Tap on "Scan QR" and scan the QR code above</li>
            <li>Verify the amount: <strong>INR {amount}</strong></li>
            <li>Complete the payment using your UPI PIN</li>
            <li>Copy the <strong>12-digit Transaction/UTR ID</strong> from your app</li>
            <li>Enter the Transaction ID below and click "Confirm Payment"</li>
          </ol>
        </div>

        <div style={{ marginTop: "24px" }}>
          <div className="form-group" style={{ textAlign: "left" }}>
            <label>UPI Transaction ID *</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value.trim())}
              className="input"
              placeholder="Enter 12-digit UTR/Transaction ID"
              disabled={paymentConfirmed || loading}
              maxLength="30"
              style={{ fontFamily: "monospace", letterSpacing: "1px" }}
            />
            {transactionId && transactionId.length < 12 && (
              <p style={{ fontSize: "12px", color: "#dc2626", marginTop: "4px" }}>
                Transaction ID must be at least 12 characters
              </p>
            )}
          </div>

          <Button
            className="btn primary square"
            onClick={handleConfirmPayment}
            disabled={paymentConfirmed || loading || !transactionId || transactionId.length < 12}
            style={{ marginTop: "16px", width: "100%" }}
          >
            {loading ? "⏳ Processing..." : paymentConfirmed ? "✅ Payment Confirmed" : "Confirm Payment"}
          </Button>

          <Button
            className="btn outline square"
            onClick={() => navigate("/farmer/cart")}
            style={{ marginTop: "12px", width: "100%" }}
          >
            Back to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
