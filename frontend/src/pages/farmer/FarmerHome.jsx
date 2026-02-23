import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import WeatherWidget from "../../components/WeatherWidget";
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
      : `${farmSizeRaw} acres`
    : t("farmer.home.addFarmSize");

  const cropSummary = useMemo(() => {
    const fromProfile = (profile?.cropTypes || user?.cropTypes || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    if (fromProfile.length === 0) {
      return [
        { crop: "Rice", acres: Math.max(2, Math.round(farmAcres / 2) || 3), score: 91 },
        { crop: "Wheat", acres: Math.max(1, Math.round(farmAcres / 2) || 2), score: 84 },
      ];
    }

    return fromProfile.map((crop, index) => {
      const seed = `${crop}-${index}`.toLowerCase();
      const hash = seed
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const score = 70 + (hash % 30);
      const acresPerCrop = farmAcres && fromProfile.length
        ? Math.max(1, Math.round(farmAcres / fromProfile.length))
        : Math.max(1, 5 - index);
      return { crop, acres: acresPerCrop, score };
    });
  }, [farmAcres, profile?.cropTypes, user?.cropTypes]);

  const avgHealth = cropSummary.length
    ? Math.round(
        cropSummary.reduce((acc, item) => acc + item.score, 0) /
          cropSummary.length
      )
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
      background: "linear-gradient(135deg, #c7f7d4, #a7ebb8)",
    },
    {
      label: t("farmer.home.stat.avgHealth.label"),
      value: `${avgHealth || 0}%`,
      helper: t("farmer.home.stat.avgHealth.helper"),
      icon: "📊",
      background: "linear-gradient(135deg, #dbe8ff, #b7cbff)",
    },
    {
      label: t("farmer.home.stat.marketOrders.label"),
      value: orders.length,
      helper: t("farmer.home.stat.marketOrders.helper"),
      icon: "📦",
      background: "linear-gradient(135deg, #f2dcff, #e0b7ff)",
    },
    {
      label: t("farmer.home.stat.rentals.label"),
      value: activeRentals,
      helper: t("farmer.home.stat.rentals.helper"),
      icon: "🛠️",
      background: "linear-gradient(135deg, #ffd9b3, #ffba82)",
    },
  ];

  const quickCards = [
    {
      title: t("farmer.home.quick.market.title"),
      subtitle: t("farmer.home.quick.market.subtitle"),
      accent: "#2b73ff",
      icon: "🛒",
      path: "/farmer/market",
    },
    {
      title: t("farmer.home.quick.tools.title"),
      subtitle: t("farmer.home.quick.tools.subtitle"),
      accent: "#f59f00",
      icon: "🛠️",
      path: "/farmer/tools",
    },
    {
      title: t("farmer.home.quick.disease.title"),
      subtitle: t("farmer.home.quick.disease.subtitle"),
      accent: "#7c3aed",
      icon: "🔬",
      path: "/farmer/disease",
    },
    {
      title: t("farmer.home.quick.orders.title"),
      subtitle: t("farmer.home.quick.orders.subtitle"),
      accent: "#ef476f",
      icon: "📦",
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

  const greetingName = profile?.name || user?.name || "farmer";

  return (
    <div className="farmer-dashboard">
      <div className="farmer-hero">
        <div>
          <p className="hero-date">{formattedDate}</p>
          <h1>
            {t("farmer.home.heroGreetingPrefix")}, {greetingName.split(" ")[0]}! <span role="img" aria-label="farmer">👩‍🌾</span>
          </h1>
          <p className="dash-subtitle">{t("farmer.home.heroSubtitle")}</p>
        </div>
        <Button className="btn outline" onClick={loadDashboard} loading={loading}>
          {t("farmer.home.refresh")}
        </Button>
      </div>

      {error && <p className="inline-error">{error}</p>}

      <div className="stat-grid">
        {statCards.map((card) => (
          <article
            key={card.label}
            className="stat-card"
            style={{ background: card.background }}
          >
            <span className="stat-icon" aria-hidden="true">
              {card.icon}
            </span>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-helper">{card.helper}</p>
          </article>
        ))}
      </div>

      <div className="farmer-quick-actions">
        {quickCards.map((card) => (
          <button
            key={card.title}
            className="quick-card"
            style={{ background: card.accent }}
            type="button"
            onClick={() => navigate(card.path)}
          >
            <div>
              <p className="quick-label">{card.title}</p>
              <h3>{card.subtitle}</h3>
            </div>
            <span className="quick-icon" aria-hidden="true">
              {card.icon}
            </span>
          </button>
        ))}
      </div>

      <section className="farmer-section">
        <header>
          <div>
            <p className="section-kicker">{t("farmer.home.cropsSection.kicker")}</p>
            <h2>{t("farmer.home.cropsSection.title")}</h2>
          </div>
          <Button className="btn ghost" onClick={() => navigate("/farmer/disease")}>
            {t("farmer.home.cropsSection.cta")}
          </Button>
        </header>
        <div className="crop-list">
          {cropSummary.map((item, index) => {
            const statusKey = item.score >= 85 ? "healthy" : item.score >= 75 ? "monitor" : "attention";
            const status = t(`farmer.home.cropsSection.statuses.${statusKey}`);
            const badgeClass = item.score >= 85 ? "success" : item.score >= 75 ? "warn" : "alert";
            return (
              <article key={`${item.crop}-${index}`} className="crop-item">
                <div>
                  <p className="crop-name">{item.crop}</p>
                  <span className="crop-meta">{item.acres} {t("farmer.home.cropsSection.acres")}</span>
                </div>
                <div className="crop-score">
                  <span className={`score-badge ${badgeClass}`}>{status}</span>
                  <strong>{item.score}%</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <div className="dashboard-widgets">
        <WeatherWidget />
      </div>
    </div>
  );
}

export default FarmerHome;
