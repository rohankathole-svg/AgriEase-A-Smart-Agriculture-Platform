import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../../api/axios";
import BackButton from "../../components/BackButton";
import { useLanguage } from "../../context/LanguageContext";

const steps = [
  "PENDING",
  "CONFIRMED",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

export default function OrderTracking() {
  const { t, language } = useLanguage();
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadTracking = async (showErrorToast = true) => {
      try {
        const res = await api.get(`/api/orders/${orderId}/tracking`);
        if (isMounted) {
          setTracking(res.data);
        }
      } catch (error) {
        if (showErrorToast) {
          toast.error(error?.response?.data?.message || t("orderTracking.loadError"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadTracking(true);
    const intervalId = setInterval(() => {
      loadTracking(false);
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [orderId, t]);

  const labels = {
    PENDING: t("orderTracking.statusLabels.pending"),
    CONFIRMED: t("orderTracking.statusLabels.confirmed"),
    ASSIGNED: t("orderTracking.statusLabels.assigned"),
    PICKED_UP: t("orderTracking.statusLabels.pickedUp"),
    OUT_FOR_DELIVERY: t("orderTracking.statusLabels.outForDelivery"),
    DELIVERED: t("orderTracking.statusLabels.delivered"),
  };

  if (loading) {
    return <div style={{ padding: "24px" }}>{t("orderTracking.loading")}</div>;
  }

  if (!tracking) {
    return <div style={{ padding: "24px" }}>{t("orderTracking.noData")}</div>;
  }

  const reached = new Set((tracking.timeline || []).map((event) => event.status));

  return (
    <div style={{ maxWidth: "860px", margin: "0 auto", padding: "clamp(16px, 3vw, 24px)" }}>
      <BackButton />
      <h2 style={{ marginBottom: "8px" }}>{t("orderTracking.title")} #{tracking.orderId}</h2>
      <p style={{ color: "var(--muted)", marginBottom: "18px" }}>{t("orderTracking.currentStatus")}: <strong>{tracking.status}</strong></p>

      <div className="product-card" style={{ marginBottom: "18px" }}>
        <h3 style={{ marginBottom: "12px" }}>{t("orderTracking.deliveryProgress")}</h3>
        {steps.map((step, index) => (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: index === steps.length - 1 ? 0 : "10px" }}>
            <span
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: reached.has(step) ? "#15803d" : "#cbd5e1",
                display: "inline-block",
              }}
            />
            <span style={{ fontWeight: reached.has(step) ? "600" : "400" }}>
              {labels[step]}
            </span>
          </div>
        ))}
      </div>

      <div className="product-card">
        <h3 style={{ marginBottom: "12px" }}>{t("orderTracking.timeline")}</h3>
        {(tracking.timeline || []).map((entry, idx) => (
          <div key={`${entry.status}-${idx}`} style={{ borderBottom: idx === tracking.timeline.length - 1 ? "none" : "1px solid var(--border)", padding: "10px 0" }}>
            <div style={{ fontWeight: "600" }}>{entry.status}</div>
            <div style={{ fontSize: "14px", color: "var(--muted)" }}>
              {entry.time ? new Date(entry.time).toLocaleString(language === "mr" ? "mr-IN" : "en-IN") : "-"}
            </div>
            {entry.location && (
              <div style={{ fontSize: "14px", marginTop: "4px" }}>{t("orderTracking.location")}: {entry.location}</div>
            )}
            {entry.photoProofUrl && (
              <a href={entry.photoProofUrl} target="_blank" rel="noreferrer">
                {t("orderTracking.viewProof")}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
