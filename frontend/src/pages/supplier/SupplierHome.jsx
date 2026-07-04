import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DashboardPanel,
  DashboardQuickActionCard,
  DashboardStatCard,
  dashboardFadeUp,
  dashboardStagger,
} from "../../components/dashboard/DashboardUi";
import PremiumLoader from "../../components/PremiumLoader";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function SupplierHome() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user);
  const [products, setProducts] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, productsRes, equipmentRes, ordersRes] = await Promise.all([
        api.get("/supplier/profile"),
        api.get("/supplier/products"),
        api.get("/supplier/equipment"),
        api.get("/supplier/orders"),
      ]);

      setProfile(profileRes.data);
      updateUser(profileRes.data);
      setProducts(productsRes.data || []);
      setEquipment(equipmentRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Failed to load supplier dashboard", err);
      setError(t("messages.unableSync"));
      setProfile((prev) => prev || user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "mr" ? "mr-IN" : "en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    [language]
  );

  const orderStats = useMemo(() => {
    if (!orders.length) {
      return {
        total: 0,
        pending: 0,
        fulfilled: 0,
        revenue: 0,
        monthRevenue: 0,
        avgTicket: 0,
        fulfillmentRate: 0,
      };
    }

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let revenue = 0;
    let monthRevenue = 0;
    let fulfilled = 0;
    let pending = 0;

    orders.forEach((order) => {
      const status = (order.status || "PENDING").toUpperCase();
      const totalAmount = Number(order.totalAmount || 0);
      if (status === "DELIVERED") {
        fulfilled += 1;
        revenue += totalAmount;
      }
      if (status === "PENDING") {
        pending += 1;
      }
      if (order.createdAt) {
        const created = new Date(order.createdAt);
        if (created.getMonth() === month && created.getFullYear() === year) {
          monthRevenue += totalAmount;
        }
      }
    });

    const avgTicket = fulfilled ? revenue / fulfilled : 0;
    const fulfillmentRate = orders.length ? Math.round((fulfilled / orders.length) * 100) : 0;

    return {
      total: orders.length,
      pending,
      fulfilled,
      revenue,
      monthRevenue,
      avgTicket,
      fulfillmentRate,
    };
  }, [orders]);

  const cropSku = products.filter((product) => (product.type || "").toUpperCase() === "CROP").length;
  const supplySku = products.filter((product) => (product.type || "").toUpperCase() === "TOOL").length;
  const availableEquipment = equipment.filter((item) => item.available !== false).length;

  const statCards = [
    {
      label: t("supplier.home.stats.productsLive"),
      value: products.length,
      helper: `${cropSku} ${t("supplier.home.stats.crops")} ${t("supplier.home.stats.and")} ${supplySku} ${t("supplier.home.stats.supplies")}`,
      icon: "📦",
      accent: "#2563eb",
    },
    {
      label: t("supplier.home.stats.equipmentFleet"),
      value: equipment.length,
      helper: `${availableEquipment} ${t("supplier.home.stats.availableToday")}`,
      icon: "🚜",
      accent: "#3b82f6",
    },
    {
      label: t("supplier.home.stats.pendingOrders"),
      value: orderStats.pending,
      helper: `${orderStats.fulfillmentRate}% ${t("supplier.home.stats.fulfillmentRate")}`,
      icon: "🧾",
      accent: "#0f62fe",
    },
    {
      label: t("supplier.home.stats.revenueMonth"),
      value: currencyFormatter.format(orderStats.monthRevenue),
      helper: `${orderStats.total} ${t("supplier.home.stats.totalOrders")}`,
      icon: "💰",
      accent: "#60a5fa",
    },
  ];

  const quickCards = [
    {
      title: t("supplier.home.quick.manageProducts.title"),
      subtitle: t("supplier.home.quick.manageProducts.subtitle"),
      accent: "#2563eb",
      icon: "📦",
      path: "/supplier/products",
    },
    {
      title: t("supplier.home.quick.manageEquipment.title"),
      subtitle: t("supplier.home.quick.manageEquipment.subtitle"),
      accent: "#1d4ed8",
      icon: "🚜",
      path: "/supplier/equipment",
    },
    {
      title: t("supplier.home.quick.reviewOrders.title"),
      subtitle: t("supplier.home.quick.reviewOrders.subtitle"),
      accent: "#3b82f6",
      icon: "📑",
      path: "/supplier/orders",
    },
    {
      title: t("supplier.home.quick.editProfile.title"),
      subtitle: t("supplier.home.quick.editProfile.subtitle"),
      accent: "#0ea5e9",
      icon: "👤",
      path: "/supplier/profile",
    },
  ];

  const orderPipeline = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 4);
  }, [orders]);

  const inventoryCards = [
    {
      title: t("supplier.home.inventory.topProducts"),
      detail: products.length > 0 ? products.slice(0, 3).map((product) => product.name).join(", ") : t("supplier.home.inventory.addBestSellers"),
      meta: `${products.length} ${t("supplier.home.inventory.skusListed")}`,
    },
    {
      title: t("supplier.home.inventory.equipmentRates"),
      detail: equipment.length > 0
        ? `${currencyFormatter.format(
            equipment.reduce((sum, item) => sum + Number(item.dailyRate || 0), 0) / equipment.length || 0
          )} ${t("supplier.home.inventory.avgPerDay")}`
        : t("supplier.home.inventory.noEquipment"),
      meta: `${availableEquipment}/${equipment.length || 0} ${t("common.labels.available")}`,
    },
    {
      title: t("supplier.home.inventory.avgOrderValue"),
      detail: currencyFormatter.format(orderStats.avgTicket),
      meta: `${orderStats.fulfilled} ${t("supplier.home.inventory.fulfilledOrders")}`,
    },
  ];

  const supplierName = profile?.businessName || profile?.name || user?.name || t("common.supplier");

  const orderChartData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    return months.map((month, index) => {
      const sampleOrder = orders[index];
      const amount = Number(sampleOrder?.totalAmount || 0);
      const status = (sampleOrder?.status || "").toUpperCase();
      return {
        month,
        revenue: amount || Math.max(1, Math.round(orderStats.monthRevenue / Math.max(months.length, 1))),
        orders: sampleOrder ? 1 + index : 0,
        fulfilled: status === "DELIVERED" ? 1 : 0,
      };
    });
  }, [orderStats.monthRevenue, orders]);

  const spotlightRows = useMemo(() => {
    return [
      {
        label: t("supplier.home.spotlight.catalogCoverage"),
        value: `${products.length} ${t("supplier.home.spotlight.activeListings")}`,
        note: cropSku
          ? `${cropSku} ${t("supplier.home.spotlight.cropFocusedAvailable")}`
          : t("supplier.home.spotlight.addCropProducts"),
      },
      {
        label: t("supplier.home.spotlight.equipmentReadiness"),
        value: `${availableEquipment}/${equipment.length || 0} ${t("supplier.home.spotlight.ready")}`,
        note: equipment.length
          ? t("supplier.home.spotlight.fleetRealtime")
          : t("supplier.home.spotlight.addRentalEquipment"),
      },
      {
        label: t("supplier.home.spotlight.orderFulfillment"),
        value: `${orderStats.fulfillmentRate}%`,
        note: orderStats.pending
          ? `${orderStats.pending} ${t("supplier.home.spotlight.ordersNeedAction")}`
          : t("supplier.home.spotlight.allOnPace"),
      },
    ];
  }, [availableEquipment, cropSku, equipment.length, orderStats.fulfillmentRate, orderStats.pending, products.length, t]);

  return (
    <motion.div
      className="supplier-dashboard role-dashboard role-dashboard--supplier"
      initial="hidden"
      animate="show"
      variants={dashboardStagger}
    >
      {loading && <PremiumLoader label={t("supplier.home.loading")} role="supplier" />}
      {error && <p className="inline-error">{error}</p>}

      <section className="role-dashboard__top">
        <div className="role-dashboard__hero-stack">
          <DashboardPanel className="role-panel role-panel--hero" kicker={t("supplier.home.kicker")} title={`${t("farmer.home.heroGreetingPrefix")}, ${supplierName.split(" ")[0]}`}>
            <div className="hero-copy">
              <p className="hero-date">{todayLabel}</p>
              <p className="dash-subtitle">
                {t("supplier.home.heroSubtitle")}
              </p>
              <div className="hero-chip-row">
                <span className="hero-chip">{products.length} {t("supplier.home.heroChips.productsLive")}</span>
                <span className="hero-chip">{equipment.length} {t("supplier.home.heroChips.equipmentItems")}</span>
                <span className="hero-chip">{orderStats.pending} {t("supplier.home.heroChips.pendingApprovals")}</span>
              </div>
            </div>
            <div className="hero-actions">
              <Button className="btn outline" onClick={loadDashboard} loading={loading}>
                {t("common.actions.refresh")}
              </Button>
              <Button className="btn ghost" onClick={() => navigate("/supplier/orders")}>
                {t("supplier.home.openOrderCenter")}
              </Button>
            </div>
          </DashboardPanel>

          <DashboardPanel className="role-panel role-panel--compact" kicker={t("supplier.home.actionsKicker")} title={t("supplier.home.shortcutsTitle")}>
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
          <DashboardPanel className="role-panel role-panel--compact" kicker={t("supplier.home.pipelineKicker")} title={t("supplier.home.pipelineTitle")}>
            <div className="order-pipeline">
              {orderPipeline.length === 0 && <p>{t("supplier.home.noOrdersYet")}</p>}
              {orderPipeline.map((order) => {
                const status = (order.status || "PENDING").toLowerCase();
                const statusKey = status.replace(/\s+/g, "_");
                return (
                  <motion.article
                    key={order.id}
                    className="order-card"
                    whileHover={{ scale: 1.01, x: 4 }}
                  >
                    <div>
                      <p className="order-id">{t("common.labels.orderId")} #{order.displayOrderNumber ?? order.orderNumber ?? order.id}</p>
                      <p className="order-meta">
                        {order.user?.name || t("common.farmer")} {t("supplier.home.and")} {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <div className="order-stats">
                      <span className={`status-pill ${status}`}>{t(`status.${statusKey}`)}</span>
                      <strong>{currencyFormatter.format(order.totalAmount || 0)}</strong>
                    </div>
                  </motion.article>
                );
              })}
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
          className="supplier-section dashboard-panel--chart"
          kicker={t("supplier.home.commercialKicker")}
          title={t("supplier.home.commercialTitle")}
          action={(
            <Button className="btn ghost" onClick={() => navigate("/supplier/orders")}>
              {t("common.actions.viewAll")}
            </Button>
          )}
        >
          <div className="dashboard-chart-shell">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderChartData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(37, 99, 235, 0.12)" />
                <XAxis dataKey="month" stroke="#315b9f" tickLine={false} axisLine={false} />
                <YAxis stroke="#315b9f" tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid rgba(37, 99, 235, 0.16)",
                    background: "rgba(255,255,255,0.94)",
                    boxShadow: "0 20px 40px rgba(15, 44, 28, 0.12)",
                  }}
                />
                <Bar dataKey="orders" fill="#93c5fd" radius={[10, 10, 0, 0]} />
                <Bar dataKey="revenue" fill="#2563eb" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-summary-grid">
            {spotlightRows.map((row) => (
              <article key={row.label} className="dashboard-summary-card">
                <p className="dashboard-summary-card__label">{row.label}</p>
                <strong className="dashboard-summary-card__value">{row.value}</strong>
                <p className="dashboard-summary-card__note">{row.note}</p>
              </article>
            ))}
          </div>
        </DashboardPanel>

        <div className="dashboard-side-column role-dashboard__details">
          <DashboardPanel
            className="supplier-section"
            kicker={t("supplier.home.inventoryKicker")}
            title={t("supplier.home.inventoryTitle")}
            action={(
              <Button className="btn ghost" onClick={() => navigate("/supplier/products")}>
                {t("supplier.home.updateCatalog")}
              </Button>
            )}
          >
            <div className="inventory-grid">
              {inventoryCards.map((card) => (
                <motion.article
                  key={card.title}
                  className="inventory-card"
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <h3>{card.title}</h3>
                  <p className="inventory-detail">{card.detail}</p>
                  <span className="inventory-meta">{card.meta}</span>
                </motion.article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            className="supplier-section"
            kicker={t("supplier.home.detailsKicker")}
            title={t("supplier.home.businessOverview")}
            action={(
              <Button className="btn ghost" onClick={() => navigate("/supplier/profile")}>
                {t("supplier.home.openProfile")}
              </Button>
            )}
          >
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">{t("supplier.home.business.totalRevenue")}</span>
                <span className="info-value">{currencyFormatter.format(orderStats.revenue)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("supplier.home.business.monthRevenue")}</span>
                <span className="info-value">{currencyFormatter.format(orderStats.monthRevenue)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("supplier.home.business.avgOrderTicket")}</span>
                <span className="info-value">{currencyFormatter.format(orderStats.avgTicket)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t("supplier.home.business.fulfillmentRate")}</span>
                <span className="info-value">{orderStats.fulfillmentRate}%</span>
              </div>
            </div>
          </DashboardPanel>
        </div>
      </section>
    </motion.div>
  );
}
