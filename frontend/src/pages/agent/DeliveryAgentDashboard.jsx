import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import PremiumLoader from "../../components/PremiumLoader";
import ThemeToggle from "../../components/ThemeToggle";
import Button from "../../components/ui/Button";
import { useLanguage } from "../../context/LanguageContext";
import "../../styles/delivery-agent-dashboard.css";

const STATUS_STEPS = ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"];

const ACTION_BY_STATUS = {
  ASSIGNED: "pickup",
  PICKED_UP: "out-for-delivery",
  OUT_FOR_DELIVERY: "delivered",
};

function normalizeStatus(status) {
  return (status || "").trim().toUpperCase();
}

function getSupplierName(order, fallback) {
  const pickup = order?.supplierPickupLocation || "";
  return pickup.split(",")[0]?.trim() || fallback;
}

function toDisplayProduct(fallback) {
  return fallback;
}

function getMapUrl(origin, destination) {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (key) {
    return `https://www.google.com/maps/embed/v1/directions?key=${encodeURIComponent(
      key
    )}&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(`${origin} to ${destination}`)}&output=embed`;
}

export default function DeliveryAgentDashboard() {
  const { t, language } = useLanguage();
  const { user, updateUser, logout } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [proofFiles, setProofFiles] = useState({});
  const [proofPreviewByOrder, setProofPreviewByOrder] = useState({});
  const [acceptedOrderIds, setAcceptedOrderIds] = useState(new Set());
  const [rejectedOrderIds, setRejectedOrderIds] = useState(new Set());
  const [deliveredAtByOrder, setDeliveredAtByOrder] = useState({});
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    vehicleName: "",
    vehicleNumber: "",
    deliveryArea: "",
    rating: "",
  });

  const locale = language === "mr" ? "mr-IN" : "en-IN";

  const loadAgentProfile = useCallback(async () => {
    try {
      const response = await api.get("/api/agent/profile");
      const profile = response.data || {};
      setProfileForm({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        vehicleName: profile.vehicleName || t("agent.dashboard.defaultVehicleName"),
        vehicleNumber: profile.vehicleNumber || "",
        deliveryArea: profile.deliveryArea || "",
        rating: profile.rating ?? "5.0",
      });
      updateUser({
        name: profile.name || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        vehicleName: profile.vehicleName || t("agent.dashboard.defaultVehicleName"),
        vehicleNumber: profile.vehicleNumber || "",
        deliveryArea: profile.deliveryArea || "",
        rating: profile.rating ?? "5.0",
      });
    } catch (error) {
      toast.error(error?.response?.data?.message || t("supplier.profile.loadProfileFailed"));
    }
  }, [t, updateUser, user?.email]);

  const agentProfile = useMemo(
    () => ({
      name: profileForm.name || user?.name || t("agent.dashboard.deliveryAgent"),
      phone: profileForm.phone || user?.phone || t("agent.dashboard.notProvided"),
      vehicleName:
        profileForm.vehicleName || user?.vehicleName || t("agent.dashboard.defaultVehicleName"),
      vehicleNumber: profileForm.vehicleNumber || user?.vehicleNumber || t("agent.dashboard.notProvided"),
      deliveryArea: profileForm.deliveryArea || user?.deliveryArea || t("agent.dashboard.localServiceArea"),
      rating: profileForm.rating || user?.rating || "5.0",
      email: profileForm.email || user?.email || "",
      address: profileForm.address || user?.address || "",
    }),
    [profileForm, t, user]
  );

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/agent/orders");
      const fetched = res.data || [];
      setOrders(fetched);
      if (!selectedOrderId && fetched.length) {
        setSelectedOrderId(fetched[0].orderId);
      }
      setLastUpdated(new Date());
    } catch (error) {
      toast.error(error?.response?.data?.message || t("agent.dashboard.loadOrdersFailed"));
    } finally {
      setLoading(false);
    }
  }, [selectedOrderId, t]);

  useEffect(() => {
    fetchOrders();
    loadAgentProfile();
  }, [fetchOrders, loadAgentProfile]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async () => {
    try {
      setProfileSaving(true);
      const payload = {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        vehicleName: profileForm.vehicleName,
        vehicleNumber: profileForm.vehicleNumber,
        deliveryArea: profileForm.deliveryArea,
      };
      const response = await api.put("/api/agent/profile", payload);
      const updatedProfile = response?.data?.user || response?.data || {};
      setProfileForm((prev) => ({
        ...prev,
        name: updatedProfile.name || prev.name,
        email: updatedProfile.email || prev.email,
        phone: updatedProfile.phone || prev.phone,
        address: updatedProfile.address || prev.address,
        vehicleName: updatedProfile.vehicleName || prev.vehicleName,
        vehicleNumber: updatedProfile.vehicleNumber || prev.vehicleNumber,
        deliveryArea: updatedProfile.deliveryArea || prev.deliveryArea,
        rating: updatedProfile.rating ?? prev.rating,
      }));
      updateUser(updatedProfile);
      setIsEditingProfile(false);
      toast.success(t("messages.profileUpdated"));
    } catch (error) {
      toast.error(error?.response?.data?.message || t("messages.profileUpdateError"));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(t("agent.dashboard.deleteConfirm"));
    if (!confirmed) return;

    try {
      setDeletingProfile(true);
      try {
        await api.delete("/api/user/account");
      } catch (error) {
        if (error?.response?.status === 404) {
          await api.delete("/user/account");
        } else {
          throw error;
        }
      }
      toast.success(t("agent.dashboard.profileDeleted"));
      logout();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("agent.dashboard.deleteProfileFailed"));
    } finally {
      setDeletingProfile(false);
    }
  };

  const updateStatus = async (orderId, action, payload = {}) => {
    try {
      await api.put(`/api/delivery/${orderId}/${action}`, payload);
      toast.success(t("agent.dashboard.orderUpdated"));
      if (action === "delivered") {
        setDeliveredAtByOrder((prev) => ({ ...prev, [orderId]: new Date().toISOString() }));
      }
      fetchOrders();
      return true;
    } catch (error) {
      toast.error(error?.response?.data?.message || t("messages.updateStatusError"));
      return false;
    }
  };

  const uploadProof = async (orderId) => {
    const file = proofFiles[orderId];
    if (!file) {
      toast.error(t("agent.dashboard.chooseImageFirst"));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post(`/api/delivery/${orderId}/upload-proof`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProofPreviewByOrder((prev) => ({
        ...prev,
        [orderId]: URL.createObjectURL(file),
      }));
      toast.success(t("agent.dashboard.proofUploaded"));
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("agent.dashboard.proofUploadFailed"));
    }
  };

  const collectCodPayment = async (orderId) => {
    try {
      await api.put(`/api/delivery/${orderId}/collect-payment`);
      toast.success(t("agent.dashboard.paymentCollected"));
      fetchOrders();
    } catch (error) {
      toast.error(error?.response?.data?.message || t("agent.dashboard.collectPaymentFailed"));
    }
  };

  const incomingRequests = useMemo(
    () =>
      orders.filter(
        (order) => normalizeStatus(order.status) === "ASSIGNED" && !rejectedOrderIds.has(order.orderId)
      ),
    [orders, rejectedOrderIds]
  );

  const acceptedOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (rejectedOrderIds.has(order.orderId)) return false;
        const status = normalizeStatus(order.status);
        if (status === "FAILED_DELIVERY" || status === "CANCELLED" || status === "RETURNED") {
          return false;
        }
        return acceptedOrderIds.has(order.orderId) || status !== "ASSIGNED";
      }),
    [orders, acceptedOrderIds, rejectedOrderIds]
  );

  const historyOrders = useMemo(
    () => orders.filter((order) => normalizeStatus(order.status) === "DELIVERED"),
    [orders]
  );

  const selectableOrders = useMemo(
    () => orders.filter((order) => !rejectedOrderIds.has(order.orderId)),
    [orders, rejectedOrderIds]
  );

  const selectedOrder =
    selectableOrders.find((order) => order.orderId === selectedOrderId) || selectableOrders[0] || null;

  const stats = useMemo(() => {
    const assigned = incomingRequests.length;
    const pending = incomingRequests.length;
    const inTransit = orders.filter((order) => {
      const status = normalizeStatus(order.status);
      return status === "PICKED_UP" || status === "OUT_FOR_DELIVERY";
    }).length;
    const deliveredToday = historyOrders.length;
    return { assigned, pending, inTransit, deliveredToday };
  }, [incomingRequests.length, orders, historyOrders.length]);

  const chartData = useMemo(
    () => [
      { label: t("agent.dashboard.chart.assigned"), value: stats.assigned, fill: "#f59e0b" },
      { label: t("agent.dashboard.chart.pending"), value: stats.pending, fill: "#fb923c" },
      { label: t("agent.dashboard.chart.transit"), value: stats.inTransit, fill: "#f97316" },
      { label: t("agent.dashboard.chart.delivered"), value: stats.deliveredToday, fill: "#ea580c" },
    ],
    [stats, t]
  );

  const stepState = (status, step) => {
    const normalized = normalizeStatus(status);
    if (step === "IN_TRANSIT") {
      if (normalized === "PICKED_UP" || normalized === "OUT_FOR_DELIVERY" || normalized === "DELIVERED") {
        return "complete";
      }
      return "todo";
    }
    const order = ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED"];
    const currentIndex = order.indexOf(normalized);
    const stepIndex = order.indexOf(step);
    if (normalized === step) return "active";
    if (stepIndex !== -1 && currentIndex >= stepIndex) return "complete";
    return "todo";
  };

  const handleAccept = async (orderId) => {
    const updated = await updateStatus(orderId, "accept");
    if (!updated) return;
    setAcceptedOrderIds((prev) => new Set([...prev, orderId]));
    setSelectedOrderId(orderId);
  };

  const handleReject = async (orderId) => {
    const reasonInput = window.prompt(t("agent.dashboard.rejectPrompt"), "");
    if (reasonInput === null) {
      return;
    }
    const reason = reasonInput.trim();
    const payload = reason ? { reason } : {};
    const updated = await updateStatus(orderId, "reject", payload);
    if (!updated) return;
    setRejectedOrderIds((prev) => new Set([...prev, orderId]));
    setSelectedOrderId((prevSelected) => {
      if (prevSelected !== orderId) return prevSelected;
      const fallback = orders.find((order) => order.orderId !== orderId && !rejectedOrderIds.has(order.orderId));
      return fallback?.orderId ?? null;
    });
    toast.info(`${t("agent.dashboard.orderRejected")} #${orderId}`);
  };

  const handleViewDetails = (orderId) => {
    setSelectedOrderId(orderId);
    const detailsSection = document.querySelector(".agent-dashboard-grid--bottom");
    detailsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleNavigate = (order) => {
    const origin = order?.supplierPickupLocation || t("agent.dashboard.supplierLocationFallback");
    const destination = order?.farmerDeliveryLocation || t("agent.dashboard.farmerLocationFallback");
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
      origin
    )}&destination=${encodeURIComponent(destination)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const nextAction = selectedOrder ? ACTION_BY_STATUS[normalizeStatus(selectedOrder.status)] : null;

  const dashboardDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    [locale]
  );

  return (
    <motion.div
      className="agent-dashboard"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      {loading && <PremiumLoader label={t("agent.dashboard.loadingDashboard")} role="delivery" />}

      <header className="agent-topbar">
        <Link to="/" className="agent-topbar__brand">
          <img src="/logo.svg" alt={t("common.brandAlt")} width="34" height="34" />
          <div>
            <strong>{t("common.brandName")}</strong>
            <span>{t("agent.dashboard.workspace")}</span>
          </div>
        </Link>
        <div className="agent-topbar__meta">
          <span className="agent-topbar__chip">{dashboardDateLabel}</span>
          <span className="agent-topbar__chip">{user?.email || user?.name || t("agent.dashboard.deliveryAgent")}</span>
          <ThemeToggle />
        </div>
      </header>

      <div className="agent-brandbar">
        <Link to="/" className="agent-brand">
          <img src="/logo.svg" alt={t("common.brandAlt")} width="32" height="32" />
          <span>{t("common.brandName")}</span>
        </Link>
        <span className="agent-brand-pill">{t("agent.dashboard.portal")}</span>
      </div>

      <div className="agent-dashboard__header">
        <div>
          <p className="agent-header-kicker">{t("agent.dashboard.kicker")}</p>
          <h1>{t("agent.dashboard.title")}</h1>
          <p>{t("agent.dashboard.subtitle")}</p>
          <div className="agent-hero-chips">
            <span className="agent-hero-chip">{stats.assigned} {t("agent.dashboard.assigned")}</span>
            <span className="agent-hero-chip">{stats.inTransit} {t("agent.dashboard.inTransit")}</span>
            <span className="agent-hero-chip">{historyOrders.length} {t("agent.dashboard.completed")}</span>
          </div>
        </div>
        <div className="agent-dashboard__header-actions">
          <LanguageSwitcher />
          <Button className="btn primary square" onClick={fetchOrders}>
            {t("agent.dashboard.refreshOrders")}
          </Button>
          <Button className="btn square" onClick={() => setIsEditingProfile((prev) => !prev)}>
            {isEditingProfile ? t("agent.dashboard.closeEdit") : t("common.actions.editProfile")}
          </Button>
          <Button className="btn square agent-logout-btn" onClick={logout}>
            {t("common.logout")}
          </Button>
          {lastUpdated && <span>{t("agent.dashboard.lastUpdated")}: {lastUpdated.toLocaleTimeString(locale)}</span>}
        </div>
      </div>

      <section className="agent-dashboard-grid agent-dashboard-grid--top">
        <article className="agent-card agent-card--map-overview">
          <div className="agent-card__heading">
            <div>
              <p className="agent-card__eyebrow">{t("agent.dashboard.routeOverview")}</p>
              <h2>{t("agent.dashboard.liveRouteMap")}</h2>
            </div>
            <span className="agent-card__tag">{t("agent.dashboard.tracking")}</span>
          </div>
          {!selectedOrder && <p className="agent-empty">{t("agent.dashboard.selectOrderForMap")}</p>}
          {selectedOrder && (
            <>
              <p className="agent-map-meta"><strong>{t("common.supplier")}:</strong> {selectedOrder.supplierPickupLocation || "-"}</p>
              <p className="agent-map-meta"><strong>{t("common.farmer")}:</strong> {selectedOrder.farmerDeliveryLocation || "-"}</p>
              <div className="agent-map-frame">
                <iframe
                  title={t("agent.dashboard.mapTitle")}
                  src={getMapUrl(
                    selectedOrder.supplierPickupLocation || t("agent.dashboard.supplierLocationFallback"),
                    selectedOrder.farmerDeliveryLocation || t("agent.dashboard.farmerLocationFallback")
                  )}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </>
          )}
        </article>

        <div className="agent-analytics-stack">
          <article className="agent-card agent-card--compact">
            <h2>{t("agent.dashboard.agentSnapshot")}</h2>
            <div className="agent-profile-row"><span>{t("common.labels.fullName")}</span><strong>{agentProfile.name}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.vehicle")}</span><strong>{agentProfile.vehicleName}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.vehicleNo")}</span><strong>{agentProfile.vehicleNumber}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.serviceArea")}</span><strong>{agentProfile.deliveryArea}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.rating")}</span><strong>{agentProfile.rating}</strong></div>
          </article>

          <article className="agent-card agent-card--compact">
            <h2>{t("agent.dashboard.operationsPulse")}</h2>
            <div className="agent-metric-strip">
              <div className="agent-metric-chip">
                <span>{t("agent.dashboard.incomingRequests")}</span>
                <strong>{incomingRequests.length}</strong>
              </div>
              <div className="agent-metric-chip">
                <span>{t("agent.dashboard.acceptedOrders")}</span>
                <strong>{acceptedOrders.length}</strong>
              </div>
              <div className="agent-metric-chip">
                <span>{t("agent.dashboard.selectedOrder")}</span>
                <strong>{selectedOrder ? `#${selectedOrder.orderId}` : t("agent.dashboard.none")}</strong>
              </div>
            </div>
          </article>

          <article className="agent-card agent-card--compact">
            <h2>{t("agent.dashboard.paymentTracking")}</h2>
            <div className="agent-metric-strip">
              <div className="agent-metric-chip">
                <span>{t("agent.dashboard.codFollowUps")}</span>
                <strong>{acceptedOrders.filter((order) => (order.paymentMethod || "").toLowerCase() === "cod" && (order.paymentStatus || "").toUpperCase() !== "PAID").length}</strong>
              </div>
              <div className="agent-metric-chip">
                <span>{t("agent.dashboard.completedDeliveries")}</span>
                <strong>{historyOrders.length}</strong>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="agent-dashboard-grid agent-dashboard-grid--middle">
        <article className="agent-stat-card">
          <span className="agent-stat-icon">AO</span>
          <div><p>{t("agent.dashboard.assignedOrders")}</p><strong>{stats.assigned}</strong></div>
        </article>
        <article className="agent-stat-card">
          <span className="agent-stat-icon">PR</span>
          <div><p>{t("agent.dashboard.pendingRequests")}</p><strong>{stats.pending}</strong></div>
        </article>
        <article className="agent-stat-card">
          <span className="agent-stat-icon">IT</span>
          <div><p>{t("agent.dashboard.inTransitOrders")}</p><strong>{stats.inTransit}</strong></div>
        </article>
        <article className="agent-stat-card">
          <span className="agent-stat-icon">DT</span>
          <div><p>{t("agent.dashboard.deliveredToday")}</p><strong>{stats.deliveredToday}</strong></div>
        </article>
      </section>

      <section className="agent-dashboard-grid agent-dashboard-grid--bottom">
        <article className="agent-card agent-card--chart">
          <div className="agent-card__heading">
            <div>
              <p className="agent-card__eyebrow">{t("agent.dashboard.dispatchAnalytics")}</p>
              <h2>{t("agent.dashboard.dailyDeliveryLoad")}</h2>
            </div>
            <span className="agent-card__tag">{t("agent.dashboard.liveStats")}</span>
          </div>
          <div className="agent-chart-shell">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(249, 115, 22, 0.14)" />
                <XAxis dataKey="label" stroke="#9a3412" tickLine={false} axisLine={false} />
                <YAxis stroke="#9a3412" tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid rgba(249, 115, 22, 0.16)",
                    background: "rgba(255,255,255,0.94)",
                    boxShadow: "0 20px 40px rgba(120, 53, 15, 0.14)",
                  }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="agent-card">
          <h2>{t("agent.dashboard.deliveryStatusDetails")}</h2>
          {!selectedOrder && <p className="agent-empty">{t("agent.dashboard.selectOrderForProgress")}</p>}
          {selectedOrder && (
            <>
              <p className="agent-order-meta">
                {t("agent.dashboard.trackingOrder")} <strong>#{selectedOrder.orderId}</strong> {t("agent.dashboard.for")} {selectedOrder.farmerName || t("common.farmer")}.
              </p>
              <div className="agent-progress">
                {STATUS_STEPS.map((step) => {
                  const state = stepState(selectedOrder.status, step);
                  return (
                    <div key={step} className={`agent-progress-step agent-progress-step--${state}`}>
                      <span>{step}</span>
                    </div>
                  );
                })}
              </div>
              {nextAction && (
                <Button className="btn primary square" onClick={() => updateStatus(selectedOrder.orderId, nextAction)}>
                  {t("agent.dashboard.moveToNextStage")}
                </Button>
              )}
              {normalizeStatus(selectedOrder.status) === "DELIVERED" && (
                <>
                  <div className="agent-proof-uploader">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        setProofFiles((prev) => ({ ...prev, [selectedOrder.orderId]: file }));
                      }}
                    />
                    <Button className="btn square" onClick={() => uploadProof(selectedOrder.orderId)}>
                      {t("agent.dashboard.uploadDeliveryPhoto")}
                    </Button>
                  </div>
                  {(selectedOrder.paymentMethod || "").toLowerCase() === "cod" &&
                    (selectedOrder.paymentStatus || "").toUpperCase() !== "PAID" && (
                    <div className="agent-cod-collect">
                      <p>{t("agent.dashboard.codOrder")}: <strong>{t("common.labels.amount")}: INR {selectedOrder.totalAmount || "N/A"}</strong></p>
                      <Button className="btn primary square" onClick={() => collectCodPayment(selectedOrder.orderId)}>
                        {t("agent.dashboard.markPaymentCollected")}
                      </Button>
                    </div>
                  )}
                  {(selectedOrder.paymentStatus || "").toUpperCase() === "PAID" && (
                    <p className="agent-payment-collected">{t("agent.dashboard.paymentCollectedLabel")}</p>
                  )}
                </>
              )}
            </>
          )}
        </article>
      </section>

      <section className="agent-card agent-card--profile">
        <h2>{t("agent.dashboard.profileTitle")}</h2>
        {!isEditingProfile ? (
          <>
            <div className="agent-profile-row"><span>{t("common.labels.fullName")}</span><strong>{agentProfile.name}</strong></div>
            <div className="agent-profile-row"><span>{t("common.labels.email")}</span><strong>{agentProfile.email || "-"}</strong></div>
            <div className="agent-profile-row"><span>{t("common.labels.phoneNumber")}</span><strong>{agentProfile.phone}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.vehicle")}</span><strong>{agentProfile.vehicleName}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.vehicleNo")}</span><strong>{agentProfile.vehicleNumber}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.serviceArea")}</span><strong>{agentProfile.deliveryArea}</strong></div>
            <div className="agent-profile-row"><span>{t("common.labels.address")}</span><strong>{agentProfile.address || "-"}</strong></div>
            <div className="agent-profile-row"><span>{t("agent.dashboard.rating")}</span><strong>{agentProfile.rating}</strong></div>
          </>
        ) : (
          <div className="agent-profile-form">
            <label>
              {t("common.labels.fullName")}
              <input name="name" value={profileForm.name} onChange={handleProfileChange} className="input" />
            </label>
            <label>
              {t("common.labels.email")}
              <input name="email" value={profileForm.email} className="input" disabled />
            </label>
            <label>
              {t("common.labels.phoneNumber")}
              <input name="phone" value={profileForm.phone} onChange={handleProfileChange} className="input" />
            </label>
            <label>
              {t("agent.dashboard.vehicle")}
              <input name="vehicleName" value={profileForm.vehicleName} onChange={handleProfileChange} className="input" />
            </label>
            <label>
              {t("agent.dashboard.vehicleNo")}
              <input name="vehicleNumber" value={profileForm.vehicleNumber} onChange={handleProfileChange} className="input" />
            </label>
            <label>
              {t("agent.dashboard.serviceArea")}
              <input name="deliveryArea" value={profileForm.deliveryArea} onChange={handleProfileChange} className="input" />
            </label>
            <label>
              {t("common.labels.address")}
              <textarea name="address" value={profileForm.address} onChange={handleProfileChange} className="input" rows="3" />
            </label>
            <div className="agent-profile-actions">
              <Button className="btn primary square" onClick={handleProfileSave} loading={profileSaving}>
                {t("common.actions.saveChanges")}
              </Button>
              <Button className="btn square" onClick={() => { setIsEditingProfile(false); loadAgentProfile(); }}>
                {t("common.actions.cancel")}
              </Button>
              <Button
                className="btn square agent-delete-btn"
                onClick={handleDeleteProfile}
                loading={deletingProfile}
              >
                {t("supplier.profile.deleteAccount")}
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="agent-card">
        <h2>{t("agent.dashboard.incomingRequestsTitle")}</h2>
        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>{t("common.labels.orderId")}</th>
                <th>{t("agent.dashboard.table.supplierName")}</th>
                <th>{t("agent.dashboard.table.farmerName")}</th>
                <th>{t("agent.dashboard.table.product")}</th>
                <th>{t("agent.dashboard.table.deliveryAddress")}</th>
                <th>{t("agent.dashboard.table.accept")}</th>
                <th>{t("agent.dashboard.table.reject")}</th>
                <th>{t("agent.dashboard.table.viewDetails")}</th>
              </tr>
            </thead>
            <tbody>
              {incomingRequests.map((order) => (
                <tr key={order.orderId}>
                  <td>#{order.orderId}</td>
                  <td>{getSupplierName(order, t("agent.dashboard.defaultSupplierName"))}</td>
                  <td>{order.farmerName || "-"}</td>
                  <td>{toDisplayProduct(t("agent.dashboard.defaultProductName"))}</td>
                  <td>{order.farmerDeliveryLocation || "-"}</td>
                  <td><Button className="btn square" onClick={() => handleAccept(order.orderId)}>{t("agent.dashboard.table.accept")}</Button></td>
                  <td><Button className="btn square" onClick={() => handleReject(order.orderId)}>{t("agent.dashboard.table.reject")}</Button></td>
                  <td><Button className="btn square" onClick={() => handleViewDetails(order.orderId)}>{t("agent.dashboard.table.viewDetails")}</Button></td>
                </tr>
              ))}
              {!incomingRequests.length && (
                <tr><td colSpan={8} className="agent-empty">{t("agent.dashboard.noIncomingRequests")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="agent-card">
        <h2>{t("agent.dashboard.acceptedOrders")}</h2>
        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>{t("common.labels.orderId")}</th>
                <th>{t("common.farmer")}</th>
                <th>{t("common.supplier")}</th>
                <th>{t("common.labels.status")}</th>
                <th>{t("common.labels.paymentStatus")}</th>
                <th>{t("agent.dashboard.table.updateStatus")}</th>
                <th>{t("agent.dashboard.table.navigation")}</th>
              </tr>
            </thead>
            <tbody>
              {acceptedOrders.map((order) => {
                const status = normalizeStatus(order.status);
                const action = ACTION_BY_STATUS[status];
                const isCod = (order.paymentMethod || "").toLowerCase() === "cod";
                const isPaid = (order.paymentStatus || "").toUpperCase() === "PAID";
                return (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>{order.farmerName || "-"}</td>
                    <td>{getSupplierName(order, t("agent.dashboard.defaultSupplierName"))}</td>
                    <td><span className={`agent-status agent-status--${status.toLowerCase()}`}>{status}</span></td>
                    <td>
                      <span className={`agent-payment-badge ${isPaid ? "agent-payment-badge--paid" : "agent-payment-badge--pending"}`}>
                        {isCod ? t("agent.dashboard.codBadge") : t("agent.dashboard.upiBadge")} - {isPaid ? t("agent.dashboard.paid") : t("agent.dashboard.pending")}
                      </span>
                      {isCod && !isPaid && status === "DELIVERED" && (
                        <Button className="btn square agent-collect-btn" onClick={() => collectCodPayment(order.orderId)}>
                          {t("agent.dashboard.collectPayment")}
                        </Button>
                      )}
                    </td>
                    <td>
                      {action ? (
                        <Button className="btn square" onClick={() => updateStatus(order.orderId, action)}>
                          {action === "pickup"
                            ? t("agent.dashboard.actionPickedUp")
                            : action === "out-for-delivery"
                              ? t("agent.dashboard.actionOutForDelivery")
                              : t("agent.dashboard.actionDelivered")}
                        </Button>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td>
                      <Button className="btn square" onClick={() => handleNavigate(order)}>
                        {t("agent.dashboard.navigation")}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!acceptedOrders.length && (
                <tr><td colSpan={7} className="agent-empty">{t("agent.dashboard.noAcceptedOrders")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="agent-card">
        <h2>{t("agent.dashboard.deliveryHistory")}</h2>
        <div className="agent-table-wrap">
          <table className="agent-table">
            <thead>
              <tr>
                <th>{t("common.labels.orderId")}</th>
                <th>{t("common.farmer")}</th>
                <th>{t("common.labels.paymentStatus")}</th>
                <th>{t("agent.dashboard.deliveryDate")}</th>
                <th>{t("agent.dashboard.deliveryProof")}</th>
              </tr>
            </thead>
            <tbody>
              {historyOrders.map((order) => {
                const isCod = (order.paymentMethod || "").toLowerCase() === "cod";
                const isPaid = (order.paymentStatus || "").toUpperCase() === "PAID";
                return (
                  <tr key={order.orderId}>
                    <td>#{order.orderId}</td>
                    <td>{order.farmerName || "-"}</td>
                    <td>
                      <span className={`agent-payment-badge ${isPaid ? "agent-payment-badge--paid" : "agent-payment-badge--pending"}`}>
                        {isCod ? t("agent.dashboard.codBadge") : t("agent.dashboard.upiBadge")} - {isPaid ? t("agent.dashboard.paid") : t("agent.dashboard.pending")}
                      </span>
                      {isCod && !isPaid && (
                        <Button className="btn square agent-collect-btn" onClick={() => collectCodPayment(order.orderId)}>
                          {t("agent.dashboard.collect")}
                        </Button>
                      )}
                    </td>
                    <td>
                      {deliveredAtByOrder[order.orderId]
                        ? new Date(deliveredAtByOrder[order.orderId]).toLocaleString(locale)
                        : "-"}
                    </td>
                    <td>
                      {proofPreviewByOrder[order.orderId] ? (
                        <a href={proofPreviewByOrder[order.orderId]} target="_blank" rel="noreferrer">
                          {t("agent.dashboard.viewProof")}
                        </a>
                      ) : (
                        <span>{t("agent.dashboard.noProofUploaded")}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!historyOrders.length && (
                <tr><td colSpan={5} className="agent-empty">{t("agent.dashboard.noHistory")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <div className="agent-loading">
          <p>{t("agent.dashboard.loadingAssignedOrders")}</p>
        </div>
      )}
      {!loading && !orders.length && (
        <div className="agent-loading">
          <p>{t("agent.dashboard.noAssignedOrders")}</p>
        </div>
      )}

      <footer className="agent-footer">
        <div>
          <strong>{t("common.brandName")}</strong> (c) {new Date().getFullYear()} {t("agent.dashboard.footerLine1")}
        </div>
        <div>{t("agent.dashboard.footerLine2")}</div>
      </footer>
    </motion.div>
  );
}
