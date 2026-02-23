import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import api from "../../api/axios";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

function Crops() {
  const [crops, setCrops] = useState([]);
  const { addCrop } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    const isCropType = (value) => (value || "").toUpperCase() === "CROP";
    const loadCrops = async () => {
      try {
        const res = await api.get("/farmer/products");
        const list = Array.isArray(res.data) ? res.data : [];
        const cropProducts = list.filter((p) => isCropType(p.type));
        if (cropProducts.length > 0) {
          setCrops(cropProducts);
          return;
        }

        const fallback = await api.get("/products");
        const fallbackList = Array.isArray(fallback.data) ? fallback.data : [];
        setCrops(fallbackList.filter((p) => isCropType(p.type)));
      } catch (err) {
        console.error("Failed to load crops", err);
        const products = JSON.parse(localStorage.getItem("products")) || [];
        setCrops(products.filter((p) => isCropType(p.type)));
      }
    };

    loadCrops();
  }, []);

  return (
    <div>
      <h2 className="dash-title">{t("farmer.crops.title")}</h2>
      <p className="dash-subtitle">{t("farmer.crops.subtitle")}</p>

      <div className="product-grid">
        {crops.length === 0 && <p>{t("farmer.crops.empty")}</p>}

        {crops.map((p) => (
          <div key={p.id} className="product-card reveal">
            <img
              src={getSafeImageUrl(p.imageUrl, "crop")}
              alt={p.name}
              loading="lazy"
              onError={onImageError("crop")}
            />
            <h4>{p.name}</h4>
            <p>INR {p.price}</p>
            {p.supplier && (
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
                Supplier: {p.supplier.name} | Rating: {p.supplier.rating ?? 0} | {p.supplier.location || "Location N/A"}
              </p>
            )}
            <Button className="btn primary square" onClick={() => addCrop(p)}>
              {t("common.actions.addToCart")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Crops;
