import { useEffect, useState } from "react";
import api from "../../api/axios";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

export default function Market() {
  const [products, setProducts] = useState([]);
  const { addProduct } = useCart();

  useEffect(() => {
    api
      .get("/farmer/products")
      .then((res) => setProducts(res.data))
      .catch((err) => console.error("Failed to load products", err));
  }, []);

  return (
    <div>
      <h2 className="dash-title">Marketplace</h2>
      <p className="dash-subtitle">Add supplies and place orders in minutes.</p>

      <div className="product-grid">
        {products.length === 0 && <p>No products available</p>}
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
            <Button className="btn primary square" onClick={() => addProduct(p)}>
              Add to Cart
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
