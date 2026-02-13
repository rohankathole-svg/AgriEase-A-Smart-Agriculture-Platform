import { useCart } from "../../context/CartContext";
import Button from "../../components/ui/Button";
import { useNavigate } from "react-router-dom";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

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

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }
    navigate("/farmer/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div>
        <h2 className="dash-title">Shopping Cart</h2>
        <p className="dash-subtitle">Your cart is empty</p>
        <div style={{ marginTop: "2rem" }}>
          <Button
            className="btn primary square"
            onClick={() => navigate("/farmer/market")}
          >
            Browse Market
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="dash-title">Shopping Cart</h2>
      <p className="dash-subtitle">
        Review and manage your items before checkout
      </p>

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
                    ? "Product"
                    : item.type === "crop"
                    ? "Crop"
                    : "Equipment Rental"}
                </span>

                {item.type === "tool" ? (
                  <div className="cart-tool-info">
                    <p>
                      <strong>Rate:</strong> INR {item.dailyRate} / day
                    </p>
                    <p>
                      <strong>Duration:</strong> {item.days} days
                    </p>
                    <p>
                      <strong>Dates:</strong> {item.startDate} to {item.endDate}
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
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-line">
            <span>Total Items:</span>
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
              <strong>Total:</strong>
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
              Checkout
            </Button>
            <Button
              className="btn secondary square"
              onClick={clearCart}
              style={{ width: "100%" }}
            >
              Clear Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
