import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

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
      setError("Unable to load equipment. Please try again.");
      toast.error("Failed to load equipment");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateFromCache();
    fetchEquipment();
    return () => controllerRef.current?.abort?.();
  }, [fetchEquipment, hydrateFromCache]);

  const handleAddToCart = (tool) => {
    if (!startDate || !endDate) {
      toast.error("Select rental dates to proceed");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }
    addToolBooking(tool, startDate, endDate);
    toast.success("Equipment reserved in cart");
  };

  return (
    <div>
      <h2 className="dash-title">Rent Tools</h2>
      <p className="dash-subtitle">Reserve equipment with flexible dates.</p>

      <div className="chip-row">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input"
        />
        <input
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => setEndDate(e.target.value)}
          className="input"
        />
        <Button
          className="btn ghost"
          onClick={fetchEquipment}
          loading={isLoading}
          type="button"
        >
          Refresh list
        </Button>
      </div>

      {lastSynced && (
        <p className="data-sync-meta">
          Last synced: {new Date(lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}

      {error && <p className="inline-error">{error}</p>}

      <div className="product-grid">
        {isLoading && tools.length === 0 && <p>Loading equipment...</p>}
        {!isLoading && tools.length === 0 && !error && <p>No tools available</p>}

        {tools.map((p) => (
          <div key={p.id} className="product-card reveal">
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
            <span
              className="cart-item-type"
              style={{
                background: p.available ? "rgba(21, 128, 61, 0.1)" : "rgba(180, 35, 24, 0.1)",
                color: p.available ? "#15803d" : "#b42318",
                marginBottom: "8px",
                display: "inline-block"
              }}
            >
              {p.available ? "Available" : "Not Available"}
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
              {p.available ? "Add to Cart" : "Unavailable"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tools;
