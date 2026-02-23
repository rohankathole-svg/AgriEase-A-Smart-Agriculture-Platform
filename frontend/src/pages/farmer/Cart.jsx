import { useCart } from "../../context/CartContext";
import Button from "../../components/ui/Button";
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
    checkout,
  } = useCart();

  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    navigate("/farmer/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div>
        <h2 className="dash-title">{t("common.labels.shoppingCart")}</h2>
        <p className="dash-subtitle">{t("common.labels.cartEmpty")}</p>
        <div style={{ marginTop: "2rem" }}>
          <Button
            className="btn primary square"
            onClick={() => navigate("/farmer/market")}
          >
            {t("common.actions.browseMarket")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dash-title">{t("common.labels.shoppingCart")}</h2>
      <p className="dash-subtitle">{t("common.labels.cartSubtitle")}</p>

      <div className="cart-container">
        <div className="cart-items-section">
          {cartItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="cart-item-card">
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

              <div className="cart-item-details">
                <h4>{item.name}</h4>
                <span className="cart-item-type">
                  {item.type === "product"
                    ? t("common.labels.product")
                    : item.type === "crop"
                    ? t("common.labels.crop")
                    : t("common.labels.equipmentRental")}
                </span>

                {item.type === "tool" ? (
                  <div className="cart-tool-info">
                    <p>
                      <strong>{t("common.labels.rate")}:</strong> INR {item.dailyRate} / day
                    </p>
                    <p>
                      <strong>{t("common.labels.duration")}:</strong> {item.days} days
                    </p>
                    <p>
                      <strong>{t("common.labels.dates")}:</strong> {item.startDate} to {item.endDate}
                    </p>
                  </div>
                ) : (
                  <div className="cart-quantity-controls">
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.type, item.quantity - 1)
                      }
                      className="quantity-btn"
                    >
                      −
                    </button>
                    <span className="quantity-display">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateQuantity(item.id, item.type, item.quantity + 1)
                      }
                      className="quantity-btn"
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
                <button
                  onClick={() => removeItem(item.id, item.type)}
                  className="remove-btn"
                >
                  {t("common.actions.remove")}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>{t("common.labels.orderSummary")}</h3>
          <div className="summary-line">
            <span>{t("common.labels.totalItems")}:</span>
            <span>{cartItems.length}</span>
          </div>

          <div className="summary-breakdown">
            {cartItems.map((item) => (
              <div key={`${item.type}-${item.id}`} className="summary-item">
                <span>
                  {item.name}{" "}
                  {item.type !== "tool" && `x${item.quantity}`}
                </span>
                <span>
                  INR{" "}
                  {item.type === "tool"
                    ? item.totalPrice
                    : item.price * item.quantity}
                </span>
              </div>
            ))}
          </div>

          <hr />

          <div className="summary-total">
            <span>
              <strong>{t("common.labels.total")}:</strong>
            </span>
            <span>
              <strong>INR {getCartTotal().toFixed(2)}</strong>
            </span>
          </div>

          <div className="cart-actions">
            <Button
              className="btn primary square"
              onClick={handleCheckout}
              style={{ width: "100%", marginBottom: "1rem" }}
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
        </div>
      </div>
    </div>
  );
}
