import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import WeatherWidget from "../../components/WeatherWidget";
import PremiumLoader from "../../components/PremiumLoader";
import {
  DashboardPanel,
  DashboardQuickActionCard,
  DashboardStatCard,
  dashboardFadeUp,
  dashboardStagger,
} from "../../components/dashboard/DashboardUi";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

function FarmerHome() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t, language } = useLanguage();
  const [profile, setProfile] = useState(user);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, ordersRes, bookingsRes] = await Promise.all([
        api.get("/farmer/profile"),
        api.get("/farmer/orders"),
        api.get("/farmer/bookings"),
      ]);
      setProfile(profileRes.data);
      updateUser(profileRes.data);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setBookings(Array.isArray(bookingsRes.data) ? bookingsRes.data : []);
    } catch (err) {
      console.error("Failed to load farmer dashboard", err);
      setError(t("messages.unableSync"));
    } finally {
      setLoading(false);
    }
  };

  const farmSizeRaw = profile?.farmSize || user?.farmSize || "";
  const farmAcres = useMemo(() => {
    if (!farmSizeRaw) return 0;
    const numeric = parseFloat(String(farmSizeRaw).replace(/[^0-9.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [farmSizeRaw]);

  const farmSizeDisplay = farmSizeRaw
    ? farmSizeRaw.toLowerCase().includes("acre")
      ? farmSizeRaw
      : `${farmSizeRaw} ${t("farmer.home.cropsSection.acres")}`
    : t("farmer.home.addFarmSize");

  const cropSummary = useMemo(() => {
    const fromProfile = (profile?.cropTypes || user?.cropTypes || "")
      .split(",")
      .map((crop) => crop.trim())
      .filter(Boolean);

    if (fromProfile.length === 0) {
      return [
        { crop: t("farmer.home.defaultCrops.rice"), acres: Math.max(2, Math.round(farmAcres / 2) || 3), score: 91 },
        { crop: t("farmer.home.defaultCrops.wheat"), acres: Math.max(1, Math.round(farmAcres / 2) || 2), score: 84 },
      ];
    }

    return fromProfile.map((crop, index) => {
      const seed = `${crop}-${index}`.toLowerCase();
      const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const score = 70 + (hash % 30);
      const acresPerCrop = farmAcres && fromProfile.length
        ? Math.max(1, Math.round(farmAcres / fromProfile.length))
        : Math.max(1, 5 - index);
      return { crop, acres: acresPerCrop, score };
    });
  }, [farmAcres, profile?.cropTypes, user?.cropTypes]);

  const avgHealth = cropSummary.length
    ? Math.round(cropSummary.reduce((acc, item) => acc + item.score, 0) / cropSummary.length)
    : 0;

  const activeRentals = bookings.filter((booking) => {
    const status = (booking.status || "").toUpperCase();
    return status !== "COMPLETED" && status !== "CANCELLED";
  }).length;

  const statCards = [
    {
      label: t("farmer.home.stat.farmSize.label"),
      value: farmSizeDisplay,
      helper: t("farmer.home.stat.farmSize.helper"),
      icon: "🌱",
      accent: "#2f855a",
    },
    {
      label: t("farmer.home.stat.avgHealth.label"),
      value: `${avgHealth || 0}%`,
      helper: t("farmer.home.stat.avgHealth.helper"),
      icon: "📈",
      accent: "#15803d",
    },
    {
      label: t("farmer.home.stat.marketOrders.label"),
      value: orders.length,
      helper: t("farmer.home.stat.marketOrders.helper"),
      icon: "📦",
      accent: "#3fa86f",
    },
    {
      label: t("farmer.home.stat.rentals.label"),
      value: activeRentals,
      helper: t("farmer.home.stat.rentals.helper"),
      icon: "🚜",
      accent: "#7bc47f",
    },
  ];

  const quickCards = [
    {
      title: t("farmer.home.quick.market.title"),
      subtitle: t("farmer.home.quick.market.subtitle"),
      accent: "#2b8a57",
      icon: "🛍️",
      path: "/farmer/market",
    },
    {
      title: t("farmer.home.quick.tools.title"),
      subtitle: t("farmer.home.quick.tools.subtitle"),
      accent: "#13795b",
      icon: "🛠️",
      path: "/farmer/tools",
    },
    {
      title: t("farmer.home.quick.disease.title"),
      subtitle: t("farmer.home.quick.disease.subtitle"),
      accent: "#1f7a3f",
      icon: "🧪",
      path: "/farmer/disease",
    },
    {
      title: t("farmer.home.quick.orders.title"),
      subtitle: t("farmer.home.quick.orders.subtitle"),
      accent: "#3f9a5d",
      icon: "📑",
      path: "/farmer/orders",
    },
  ];

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(language === "mr" ? "mr-IN" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
  }, [language]);

  const greetingName = profile?.name || user?.name || t("common.farmer");

  const cropHealthChartData = useMemo(() => {
    return cropSummary.map((item) => ({
      name: item.crop,
      health: item.score,
      acres: item.acres,
    }));
  }, [cropSummary]);

  const activityFeed = useMemo(() => {
    return [
      {
        title: t("farmer.home.stat.marketOrders.label"),
        value: `${orders.length} ${t("farmer.home.activity.active")}`,
        hint: orders.length ? t("farmer.home.activity.ordersMoving") : t("farmer.home.activity.noActiveOrders"),
      },
      {
        title: t("farmer.home.stat.rentals.label"),
        value: `${activeRentals} ${t("farmer.home.activity.running")}`,
        hint: activeRentals ? t("farmer.home.activity.equipmentInProgress") : t("farmer.home.activity.rentalClear"),
      },
      {
        title: t("farmer.home.stat.avgHealth.label"),
        value: `${avgHealth}%`,
        hint: avgHealth >= 85 ? t("farmer.home.activity.cropStable") : t("farmer.home.activity.cropMonitor"),
      },
    ];
  }, [activeRentals, avgHealth, orders.length, t]);

  return (
    <motion.div
      className="farmer-dashboard role-dashboard role-dashboard--farmer"
      initial="hidden"
      animate="show"
      variants={dashboardStagger}
    >
      {loading && <PremiumLoader label={t("farmer.home.loading")} role="farmer" />}
      {error && <p className="inline-error">{error}</p>}

      <section className="role-dashboard__top">
        <div className="role-dashboard__hero-stack">
          <DashboardPanel className="role-panel role-panel--hero" kicker={t("farmer.home.heroKicker")} title={`${t("farmer.home.heroGreetingPrefix")}, ${greetingName.split(" ")[0]}`}>
            <div className="hero-copy">
              <p className="hero-date">{formattedDate}</p>
              <p className="dash-subtitle">{t("farmer.home.heroSubtitle")}</p>
              <div className="hero-chip-row">
                <span className="hero-chip">{t("farmer.home.heroChipOverview")}</span>
                <span className="hero-chip">{cropSummary.length} {t("farmer.home.heroChipCropsTracked")}</span>
                <span className="hero-chip">{orders.length} {t("farmer.home.heroChipOrdersInFlow")}</span>
              </div>
            </div>
            <div className="hero-actions">
              <Button className="btn outline" onClick={loadDashboard} loading={loading}>
                {t("farmer.home.refresh")}
              </Button>
              <Button className="btn ghost" onClick={() => navigate("/farmer/crop-advisor")}>
                {t("farmer.home.openCropAdvisor")}
              </Button>
            </div>
          </DashboardPanel>

          <DashboardPanel className="role-panel role-panel--compact" kicker={t("supplier.home.actionsKicker")} title={t("farmer.home.shortcutsTitle")}>
            <motion.div className="dashboard-quick-grid dashboard-quick-grid--compact" variants={dashboardStagger}>
              {quickCards.map((card) => (
                <DashboardQuickActionCard
                  key={card.title}
                  {...card}
                  onClick={() => navigate(card.path)}
                />
              ))}
            </motion.div>
          </DashboardPanel>
        </div>

        <div className="role-dashboard__analytics">
          <DashboardPanel className="role-panel role-panel--compact" kicker={t("farmer.home.liveActivityKicker")} title={t("farmer.home.fieldPulseTitle")}>
            <div className="activity-list">
              {activityFeed.map((item) => (
                <article key={item.title} className="activity-item">
                  <div>
                    <p className="activity-item__title">{item.title}</p>
                    <strong className="activity-item__value">{item.value}</strong>
                  </div>
                  <p className="activity-item__hint">{item.hint}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </div>
      </section>

      <section className="role-dashboard__middle">
        <motion.div className="dashboard-stat-grid dashboard-stat-grid--fixed" variants={dashboardStagger}>
          {statCards.map((card) => (
            <DashboardStatCard key={card.label} {...card} />
          ))}
        </motion.div>
      </section>

      <section className="role-dashboard__bottom">
        <DashboardPanel
          className="farmer-section dashboard-panel--chart"
          kicker={t("farmer.home.cropsSection.kicker")}
          title={t("farmer.home.cropsSection.title")}
          action={(
            <Button className="btn ghost" onClick={() => navigate("/farmer/disease")}>
              {t("farmer.home.cropsSection.cta")}
            </Button>
          )}
        >
          <div className="dashboard-chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={cropHealthChartData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="farmerHealthFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2f855a" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#2f855a" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 133, 90, 0.12)" />
                <XAxis dataKey="name" stroke="#35654b" tickLine={false} axisLine={false} />
                <YAxis stroke="#35654b" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid rgba(47, 133, 90, 0.16)",
                    background: "rgba(255,255,255,0.94)",
                    boxShadow: "0 20px 40px rgba(15, 44, 28, 0.12)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="health"
                  stroke="#2f855a"
                  strokeWidth={3}
                  fill="url(#farmerHealthFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="crop-list crop-list--compact">
            {cropSummary.map((item, index) => {
              const statusKey = item.score >= 85 ? "healthy" : item.score >= 75 ? "monitor" : "attention";
              const status = t(`farmer.home.cropsSection.statuses.${statusKey}`);
              const badgeClass = item.score >= 85 ? "success" : item.score >= 75 ? "warn" : "alert";
              return (
                <motion.article
                  key={`${item.crop}-${index}`}
                  className="crop-item"
                  whileHover={{ scale: 1.01, x: 4 }}
                >
                  <div>
                    <p className="crop-name">{item.crop}</p>
                    <span className="crop-meta">{item.acres} {t("farmer.home.cropsSection.acres")}</span>
                  </div>
                  <div className="crop-score">
                    <span className={`score-badge ${badgeClass}`}>{status}</span>
                    <strong>{item.score}%</strong>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </DashboardPanel>

        <div className="dashboard-side-column role-dashboard__details">
          <DashboardPanel className="farmer-section dashboard-panel--activity" kicker={t("farmer.home.detailsKicker")} title={t("farmer.home.farmDetailsTitle")}>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">{t("farmer.home.stat.farmSize.label")}</span>
                <span className="info-value">{farmSizeDisplay}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("farmer.home.stat.avgHealth.label")}</span>
                <span className="info-value">{avgHealth}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("farmer.home.stat.marketOrders.label")}</span>
                <span className="info-value">{orders.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("farmer.home.stat.rentals.label")}</span>
                <span className="info-value">{activeRentals}</span>
              </div>
            </div>
          </DashboardPanel>
          <motion.div variants={dashboardFadeUp} className="dashboard-widgets">
            <WeatherWidget />
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

export default FarmerHome;
