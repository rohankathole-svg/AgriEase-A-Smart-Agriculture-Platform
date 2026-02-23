import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { useAuth } from "../../auth/AuthContext";

export default function SupplierHome() {
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
      setError("Unable to sync with server. Showing cached data.");
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
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date()),
    []
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
    const fulfillmentRate = orders.length
      ? Math.round((fulfilled / orders.length) * 100)
      : 0;

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

  const cropSku = products.filter(
    (p) => (p.type || "").toUpperCase() === "CROP"
  ).length;
  const supplySku = products.filter(
    (p) => (p.type || "").toUpperCase() === "TOOL"
  ).length;
  const availableEquipment = equipment.filter((item) => item.available !== false).length;

  const statCards = [
    {
      label: "Products live",
      value: products.length,
      helper: `${cropSku} crops · ${supplySku} supplies`,
      icon: "🛒",
      background: "linear-gradient(135deg,#c7f7ff,#a6e4ff)",
    },
    {
      label: "Equipment fleet",
      value: equipment.length,
      helper: `${availableEquipment} available today`,
      icon: "🚜",
      background: "linear-gradient(135deg,#fde1c8,#f9c68b)",
    },
    {
      label: "Pending orders",
      value: orderStats.pending,
      helper: `${orderStats.fulfillmentRate}% fulfillment rate`,
      icon: "📦",
      background: "linear-gradient(135deg,#f4dcff,#ddb7ff)",
    },
    {
      label: "Revenue (month)",
      value: currencyFormatter.format(orderStats.monthRevenue),
      helper: `${orderStats.total} total orders`,
      icon: "💰",
      background: "linear-gradient(135deg,#c8f7d3,#9ee6b2)",
    },
  ];

  const quickCards = [
    {
      title: "Manage Products",
      subtitle: "List crops & agri-inputs",
      accent: "#2563eb",
      icon: "📦",
      path: "/supplier/products",
    },
    {
      title: "Manage Equipment",
      subtitle: "Rent tractors & tools",
      accent: "#f97316",
      icon: "🚜",
      path: "/supplier/equipment",
    },
    {
      title: "Review Orders",
      subtitle: "Confirm & dispatch",
      accent: "#9333ea",
      icon: "📑",
      path: "/supplier/orders",
    },
    {
      title: "Edit Profile",
      subtitle: "Update business info",
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
      title: "Top products",
      detail:
        products.length > 0
          ? products
              .slice(0, 3)
              .map((p) => p.name)
              .join(", ")
          : "Add your best sellers",
      meta: `${products.length} SKUs listed`,
    },
    {
      title: "Equipment rates",
      detail:
        equipment.length > 0
          ? `${currencyFormatter.format(
              equipment.reduce((sum, item) => sum + Number(item.dailyRate || 0), 0) /
                equipment.length || 0
            )} avg/day`
          : "No equipment added yet",
      meta: `${availableEquipment}/${equipment.length || 0} available`,
    },
    {
      title: "Avg order value",
      detail: currencyFormatter.format(orderStats.avgTicket),
      meta: `${orderStats.fulfilled} fulfilled orders`,
    },
  ];

  const supplierName = profile?.businessName || profile?.name || user?.name || "Supplier";

  return (
    <div className="supplier-dashboard">
      <div className="supplier-hero">
        <div>
          <p className="hero-date">{todayLabel}</p>
          <h1>
            Welcome back, {supplierName.split(" ")[0]}! <span role="img" aria-label="handshake">🤝</span>
          </h1>
          <p className="dash-subtitle">
            Track live orders, keep your listings updated, and ensure farmers receive their supplies on time.
          </p>
        </div>
        <Button className="btn outline" onClick={loadDashboard} loading={loading}>
          Refresh data
        </Button>
      </div>

      {error && <p className="inline-error">{error}</p>}

      <div className="stat-grid">
        {statCards.map((card) => (
          <article key={card.label} className="stat-card" style={{ background: card.background }}>
            <span className="stat-icon" aria-hidden="true">
              {card.icon}
            </span>
            <p className="stat-label">{card.label}</p>
            <p className="stat-value">{card.value}</p>
            <p className="stat-helper">{card.helper}</p>
          </article>
        ))}
      </div>

      <div className="supplier-quick-actions">
        {quickCards.map((card) => (
          <button
            key={card.title}
            type="button"
            className="quick-card"
            style={{ background: card.accent }}
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

      <section className="supplier-section">
        <header>
          <div>
            <p className="section-kicker">Order Pipeline</p>
            <h2>Newest farmer requests</h2>
          </div>
          <Button className="btn ghost" onClick={() => navigate("/supplier/orders")}>
            View all →
          </Button>
        </header>
        <div className="order-pipeline">
          {orderPipeline.length === 0 && <p>No orders yet. Promote your listings to get started.</p>}
          {orderPipeline.map((order) => {
            const status = (order.status || "PENDING").toLowerCase();
            return (
              <article key={order.id} className="order-card">
                <div>
                  <p className="order-id">Order #{order.displayOrderNumber ?? order.orderNumber ?? order.id}</p>
                  <p className="order-meta">
                    {order.user?.name || "Farmer"} • {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="order-stats">
                  <span className={`status-pill ${status}`}>{status.replace(/^[a-z]/, (c) => c.toUpperCase())}</span>
                  <strong>{currencyFormatter.format(order.totalAmount || 0)}</strong>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="supplier-section">
        <header>
          <div>
            <p className="section-kicker">Inventory snapshot</p>
            <h2>Keep supply ready</h2>
          </div>
          <Button className="btn ghost" onClick={() => navigate("/supplier/products")}>
            Update catalog →
          </Button>
        </header>
        <div className="inventory-grid">
          {inventoryCards.map((card) => (
            <article key={card.title} className="inventory-card">
              <h3>{card.title}</h3>
              <p className="inventory-detail">{card.detail}</p>
              <span className="inventory-meta">{card.meta}</span>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
}

