import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
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
        style={{ backgroundImage: "url('/images/crops.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.crops.title")}</h1>
        <p>{t("farmer.crops.subtitle")}</p>
      </motion.div>

      <motion.div className="product-grid" variants={staggerContainer}>
        {crops.length === 0 && <p>{t("farmer.crops.empty")}</p>}

        {crops.map((p) => (
          <motion.div
            key={p.id}
            className="product-card"
            variants={fadeUp}
            whileHover={{ scale: 1.02, y: -4 }}
          >
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
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default Crops;
