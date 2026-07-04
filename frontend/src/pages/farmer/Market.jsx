import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { useCart } from "../../context/CartContext";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function Market() {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
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

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const getCategoryLabel = (product) => {
    return (
      product.category ||
      product.type ||
      product.productType ||
      product.productCategory ||
      t("farmer.market.other")
    );
  };

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        products
          .map((product) => getCategoryLabel(product))
          .filter(Boolean)
      )
    );

    return ["all", ...uniqueCategories];
  }, [products]);

  const visibleProducts = useMemo(() => {
    let nextProducts = [...products];

    if (selectedCategory !== "all") {
      nextProducts = nextProducts.filter(
        (product) => getCategoryLabel(product) === selectedCategory
      );
    }

    if (sortBy === "price-low-high") {
      nextProducts.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sortBy === "price-high-low") {
      nextProducts.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sortBy === "name-asc") {
      nextProducts.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    }

    return nextProducts;
  }, [products, selectedCategory, sortBy]);

  return (
    <motion.div className="secondary-page" initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div
        className="page-hero"
        style={{ backgroundImage: "url('/images/market.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.market.title")}</h1>
        <p>{t("farmer.market.subtitle")}</p>
      </motion.div>

      <motion.div className="market-toolbar market-toolbar--premium" variants={fadeUp}>
        <div className="market-toolbar__group">
          <span className="market-toolbar__label">{t("farmer.market.categories")}</span>
          <div className="chip-row">
            {categories.map((category) => {
              const isActive = category === selectedCategory;
              return (
                <motion.button
                  key={category}
                  type="button"
                  className={`market-chip ${isActive ? "is-active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {category === "all" ? t("farmer.market.all") : category}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="market-toolbar__group market-toolbar__group--sort">
          <label className="market-toolbar__label" htmlFor="market-sort">
            {t("farmer.market.sortBy")}
          </label>
          <select
            id="market-sort"
            className="select market-toolbar__select market-toolbar__select--premium"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">{t("farmer.market.sort.default")}</option>
            <option value="name-asc">{t("farmer.market.sort.nameAsc")}</option>
            <option value="price-low-high">{t("farmer.market.sort.priceLowHigh")}</option>
            <option value="price-high-low">{t("farmer.market.sort.priceHighLow")}</option>
          </select>
        </div>
      </motion.div>

      <motion.div className="product-grid" variants={staggerContainer}>
        {visibleProducts.length === 0 && (
          <motion.div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }} variants={fadeUp}>
            <p style={{ fontSize: "16px", color: "var(--muted)", fontWeight: "500" }}>{t("farmer.market.empty")}</p>
          </motion.div>
        )}
        {visibleProducts.map((p) => (
          <motion.div
            key={p.id}
            className="product-card product-card--premium"
            variants={fadeUp}
            whileHover={{ scale: 1.04, y: -6 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="product-card__image-wrapper">
              <img
                src={getSafeImageUrl(p.imageUrl, "product")}
                alt={p.name}
                className="product-card__image"
                loading="lazy"
                onError={onImageError("product")}
              />
            </div>
            <div className="product-card__content">
              <div className="product-card__header">
                <h4 className="product-card__title">{p.name}</h4>
                <span className="availability-pill is-available">{getCategoryLabel(p)}</span>
              </div>
              {p.supplier && (
                <div className="product-card__supplier">
                  <p className="product-card__supplier-name">{p.supplier.name}</p>
                  <div className="product-card__supplier-meta">
                    <span className="rating-badge">★ {p.supplier.rating?.toFixed(1) ?? "N/A"}</span>
                    {p.supplier.location && <span className="location-badge">📍 {p.supplier.location}</span>}
                  </div>
                </div>
              )}
              <div className="product-card__footer">
                <p className="product-card__price">INR {p.price}</p>
                <Button className="btn primary square product-card__btn" onClick={() => addProduct(p)}>
                  {t("common.actions.addToCart")}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
