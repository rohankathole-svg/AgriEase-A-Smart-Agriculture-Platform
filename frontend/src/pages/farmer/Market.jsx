import { useEffect, useState } from "react";
import api from "../../api/axios";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function Market() {
  const [products, setProducts] = useState([]);
  const { addProduct } = useCart();
  const { t } = useLanguage();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await api.get("/farmer/products");
        const farmerProducts = Array.isArray(res.data) ? res.data : [];
        if (farmerProducts.length > 0) {
          setProducts(farmerProducts);
          return;
        }
        const fallback = await api.get("/products");
        setProducts(Array.isArray(fallback.data) ? fallback.data : []);
      } catch (err) {
        console.error("Failed to load products", err);
      }
    };
    loadProducts();
  }, []);

  return (
    <div>
      <h2 className="dash-title">{t("farmer.market.title")}</h2>
      <p className="dash-subtitle">{t("farmer.market.subtitle")}</p>

      <div className="product-grid">
        {products.length === 0 && <p>{t("farmer.market.empty")}</p>}
        {products.map((p) => (
          <div key={p.id} className="product-card reveal">
            <img
              src={getSafeImageUrl(p.imageUrl, "product")}
              alt={p.name}
              loading="lazy"
              onError={onImageError("product")}
            />
            <h4>{p.name}</h4>
            <p>INR {p.price}</p>
            {p.supplier && (
              <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>
                Supplier: {p.supplier.name} | Rating: {p.supplier.rating ?? 0} | {p.supplier.location || "Location N/A"}
              </p>
            )}
            <Button className="btn primary square" onClick={() => addProduct(p)}>
              {t("common.actions.addToCart")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
