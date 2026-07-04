import { useCart } from "../../context/CartContext";
import { motion } from "framer-motion";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { useNavigate } from "react-router-dom";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function Cart() {
  const {
    cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    getCartTotal,
  } = useCart();

  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    navigate("/farmer/checkout");
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  if (cartItems.length === 0) {
    return (
      <motion.div initial="hidden" animate="show" variants={staggerContainer} style={{ textAlign: "center", padding: "40px", marginBottom: "40px" }}>
        <BackButton />
        <motion.div
          className="page-hero"
          style={{ backgroundImage: "url('/images/cart.jpg')" }}
          variants={fadeUp}
        >
          <h1>{t("common.labels.shoppingCart")}</h1>
          <p>{t("common.labels.cartEmpty")}</p>
        </motion.div>

        <motion.div style={{ marginTop: "2rem" }} variants={fadeUp}>
          <Button
            className="btn primary square"
            onClick={() => navigate("/farmer/market")}
          >
            {t("common.actions.browseMarket")}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div className="secondary-page" initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div
        className="page-hero"
        style={{ backgroundImage: "url('/images/cart.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("common.labels.shoppingCart")}</h1>
        <p>{t("common.labels.cartSubtitle")}</p>
      </motion.div>

      <motion.div className="cart-container" variants={staggerContainer}>
        <motion.div className="cart-items-section" variants={staggerContainer}>
          {cartItems.map((item, index) => (
            <motion.div
              key={`${item.type}-${item.id}`}
              className="cart-item-card cart-item-card--premium"
              variants={fadeUp}
              whileHover={{ scale: 1.01, x: 4, boxShadow: "0 12px 32px rgba(21, 128, 61, 0.15)" }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="cart-item__image-wrapper">
                <img
                  src={getSafeImageUrl(
                    item.imageUrl,
                    item.type === "tool" ? "equipment" : "product"
                  )}
                  alt={item.name}
                  className="cart-item-image"
                  loading="lazy"
                  onError={onImageError(item.type === "tool" ? "equipment" : "product")}
                />
              </div>

              <div className="cart-item-details">
                <div className="cart-item__header">
                  <h4 className="cart-item__title">{item.name}</h4>
                  <span className="cart-item-type">
                    {item.type === "product"
                      ? t("common.labels.product")
                      : item.type === "crop"
                        ? t("common.labels.crop")
                        : t("common.labels.equipmentRental")}
                  </span>
                </div>

                {item.type === "tool" ? (
                  <div className="cart-tool-info">
                    <p className="tool-info__item"><strong>{t("common.labels.rate")}:</strong> <span className="tool-info__value">INR {item.dailyRate} / day</span></p>
                    <p className="tool-info__item"><strong>{t("common.labels.duration")}:</strong> <span className="tool-info__value">{item.days} days</span></p>
                    <p className="tool-info__item"><strong>{t("common.labels.dates")}:</strong> <span className="tool-info__value">{item.startDate} → {item.endDate}</span></p>
                  </div>
                ) : (
                  <div className="cart-quantity-controls">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.type, item.quantity - 1)
                      }
                      className="quantity-btn"
                      aria-label={t("common.accessibility.decreaseQuantity")}
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.type, item.quantity + 1)
                      }
                      className="quantity-btn"
                      aria-label={t("common.accessibility.increaseQuantity")}
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <div className="cart-item-price">
                <p className="item-price">
                  INR{" "}
                  {item.type === "tool"
                    ? item.totalPrice
                    : item.price * item.quantity}
                </p>
                <motion.button
                  onClick={() => removeItem(item.id, item.type)}
                  className="remove-btn"
                  whileHover={{ backgroundColor: "rgba(180, 35, 24, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t("common.actions.remove")}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="cart-summary cart-summary--premium" variants={fadeUp}>
          <h3 className="cart-summary__title">{t("common.labels.orderSummary")}</h3>
          
          <div className="summary-line summary-line--header">
            <span className="summary-label">{t("common.labels.totalItems")}</span>
            <span className="summary-value">{cartItems.length} {t("common.labels.items")}</span>
          </div>

          <div className="summary-breakdown">
            {cartItems.map((item) => (
              <motion.div key={`${item.type}-${item.id}`} className="summary-item" layout>
                <span className="summary-item__name">
                  {item.name}{" "}
                  {item.type !== "tool" && <span className="summary-item__qty">×{item.quantity}</span>}
                </span>
                <span className="summary-item__price">
                  INR {item.type === "tool"
                    ? item.totalPrice
                    : (item.price * item.quantity).toFixed(2)}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total">
            <span className="summary-total__label">{t("common.labels.total")}</span>
            <span className="summary-total__value">INR {getCartTotal().toFixed(2)}</span>
          </div>

          <div className="cart-actions">
            <Button
              className="btn primary square"
              onClick={handleCheckout}
              style={{ width: "100%", marginBottom: "0.75rem" }}
            >
              {t("common.actions.checkout")}
            </Button>
            <Button
              className="btn secondary square"
              onClick={clearCart}
              style={{ width: "100%" }}
            >
              {t("common.actions.clearCart")}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
