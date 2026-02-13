import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import { useCart } from "../../context/CartContext";
import api from "../../api/axios";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

function Crops() {
  const [crops, setCrops] = useState([]);
  const { addCrop } = useCart();

  useEffect(() => {
    // Fetch crops from API
    api
      .get("/farmer/products")
      .then((res) => {
        const cropProducts = res.data.filter((p) => p.type === "CROP");
        setCrops(cropProducts);
      })
      .catch((err) => {
        console.error("Failed to load crops", err);
        // Fallback to localStorage if API fails
        const products = JSON.parse(localStorage.getItem("products")) || [];
        setCrops(products.filter((p) => p.type === "CROP"));
      });
  }, []);

  return (
    <div>
      <h2 className="dash-title">Buy Crops</h2>
      <p className="dash-subtitle">Fresh inputs curated by suppliers.</p>

      <div className="product-grid">
        {crops.length === 0 && <p>No crops available</p>}

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
            <Button className="btn primary square" onClick={() => addCrop(p)}>
              Add to Cart
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Crops;
