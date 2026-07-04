import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

const EQUIPMENT_CACHE_KEY = "agriease-equipment-cache-v1";

function Tools() {
  const [tools, setTools] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const { addToolBooking } = useCart();
  const controllerRef = useRef();
  const { t, language } = useLanguage();

  const hydrateFromCache = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const cached = window.sessionStorage.getItem(EQUIPMENT_CACHE_KEY);
      if (!cached) return;
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed?.data)) {
        setTools(parsed.data);
        setLastSynced(parsed.timestamp || null);
      }
    } catch (cacheError) {
      console.warn("Failed to hydrate equipment cache", cacheError);
    }
  }, []);

  const fetchEquipment = useCallback(async () => {
    controllerRef.current?.abort?.();
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      setIsLoading(true);
      setError("");
      const response = await api.get("/farmer/equipment", { signal: controller.signal });
      const payload = Array.isArray(response.data) ? response.data : [];
      setTools(payload);
      const timestamp = Date.now();
      setLastSynced(timestamp);
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(
          EQUIPMENT_CACHE_KEY,
          JSON.stringify({ data: payload, timestamp })
        );
      }
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.name === "CanceledError") {
        return;
      }
      console.error("Failed to load equipment", err);
      setError(t("messages.loadEquipmentError"));
      toast.error(t("messages.loadEquipmentError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    hydrateFromCache();
    fetchEquipment();
    return () => controllerRef.current?.abort?.();
  }, [fetchEquipment, hydrateFromCache]);

  const handleAddToCart = (tool) => {
    if (!startDate || !endDate) {
      toast.error(t("messages.selectRentalDates"));
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error(t("messages.endDateInvalid"));
      return;
    }
    addToolBooking(tool, startDate, endDate);
    toast.success(t("messages.equipmentReserved"));
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div
        className="page-hero"
        style={{ backgroundImage: "url('/images/tools.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.tools.title")}</h1>
        <p>{t("farmer.tools.subtitle")}</p>
      </motion.div>

      <motion.div className="chip-row" variants={fadeUp} style={{ alignItems: "center" }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
          style={{ maxWidth: 180, fontSize: 13, padding: "6px 10px" }}
        />
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
          className="input"
          style={{ maxWidth: 180, fontSize: 13, padding: "6px 10px" }}
        />
        <Button
          className="btn ghost"
          onClick={fetchEquipment}
          loading={isLoading}
          type="button"
          style={{ fontSize: 13, padding: "6px 14px", height: 36 }}
        >
          {t("farmer.home.refresh")}
        </Button>
      </motion.div>

      {lastSynced && (
        <motion.p className="data-sync-meta" variants={fadeUp}>
          {t("common.labels.lastSynced")}: {new Date(lastSynced).toLocaleTimeString(language === "mr" ? "mr-IN" : undefined, { hour: "2-digit", minute: "2-digit" })}
        </motion.p>
      )}

      {error && <motion.p className="inline-error" variants={fadeUp}>{error}</motion.p>}

      <motion.div className="product-grid" variants={staggerContainer}>
        {isLoading && tools.length === 0 && <p>{t("farmer.tools.loading")}</p>}
        {!isLoading && tools.length === 0 && !error && <p>{t("farmer.tools.empty")}</p>}

        {tools.map((p) => (
          <motion.div
            key={p.id}
            className="product-card"
            variants={fadeUp}
            whileHover={{ scale: 1.02, y: -4 }}
          >
            <img
              src={getSafeImageUrl(p.imageUrl, "equipment")}
              alt={p.name}
              loading="lazy"
              onError={onImageError("equipment")}
            />
            <h4>{p.name}</h4>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              {p.description || "No description"}
            </p>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#15803d" }}>
              INR {p.dailyRate} / day
            </p>
            {p.supplier && (
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
                Supplier: {p.supplier.businessName || p.supplier.name} | Rating: {p.supplier.rating ?? 0} | {(p.supplier.city || "") + (p.supplier.state ? `, ${p.supplier.state}` : "")}
              </p>
            )}
            <span
              className="cart-item-type"
              style={{
                background: p.available ? "rgba(21, 128, 61, 0.1)" : "rgba(180, 35, 24, 0.1)",
                color: p.available ? "#15803d" : "#b42318",
                marginBottom: "8px",
                display: "inline-block"
              }}
            >
              {p.available ? t("farmer.tools.available") : t("farmer.tools.unavailable")}
            </span>
            <Button
              className="btn primary square"
              onClick={() => handleAddToCart(p)}
              disabled={!p.available}
              style={{
                opacity: p.available ? 1 : 0.5,
                cursor: p.available ? "pointer" : "not-allowed",
              }}
            >
              {p.available ? t("common.actions.addToCart") : t("farmer.tools.unavailable")}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Tools;
