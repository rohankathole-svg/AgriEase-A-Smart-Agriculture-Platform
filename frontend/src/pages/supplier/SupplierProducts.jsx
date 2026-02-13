import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { uploadToCloudinary } from "../../services/cloudinary";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

export default function SupplierProducts() {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    type: "PRODUCT",
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    api
      .get("/supplier/products")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Failed to load products"));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = formData.imageUrl;
      
      if (imageFile) {
        toast.info("Uploading image...");
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const dataToSend = { ...formData, imageUrl };

      if (editingId) {
        await api.put(`/supplier/products/${editingId}`, dataToSend);
        toast.success("Product updated successfully!");
      } else {
        await api.post("/supplier/products", dataToSend);
        toast.success("Product added successfully!");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        type: "PRODUCT",
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    } catch (error) {
      console.error("Product save error:", error);
      toast.error("Failed to save product");
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      type: product.type,
      imageUrl: product.imageUrl,
    });
    setImageFile(null);
    setImagePreview(product.imageUrl);
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await api.delete(`/supplier/products/${id}`);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 className="dash-title">Manage Products</h2>
          <p className="dash-subtitle">Add and manage your product listings</p>
        </div>
        <Button
          className="btn primary square"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              description: "",
              price: "",
              type: "PRODUCT",
              imageUrl: "",
            });
            setImageFile(null);
            setImagePreview(null);
          }}
        >
          {showForm ? "Cancel" : "+ Add Product"}
        </Button>
      </div>

      {showForm && (
        <div className="product-card" style={{ marginBottom: "24px" }}>
          <h3>{editingId ? "Edit Product" : "Add New Product"}</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="e.g., Organic Fertilizer"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Product description"
              />
            </div>

            <div className="form-group">
              <label>Price (INR) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                <option value="PRODUCT">Product</option>
                <option value="CROP">Crop/Seeds</option>
                <option value="FERTILIZER">Fertilizer</option>
                <option value="PESTICIDE">Pesticide</option>
              </select>
            </div>

            <div className="form-group">
              <label>Product Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input"
              />
              {imagePreview && (
                <img
                  src={getSafeImageUrl(imagePreview, "product")}
                  alt="Preview"
                  onError={onImageError("product")}
                  style={{
                    width: "200px",
                    height: "150px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginTop: "10px",
                  }}
                />
              )}
            </div>

            <Button type="submit" className="btn primary square">
              {editingId ? "Update Product" : "Add Product"}
            </Button>
          </form>
        </div>
      )}

      <div className="product-grid">
        {products.length === 0 && (
          <p className="empty-state" style={{ gridColumn: "1 / -1" }}>
            No products yet. Click "Add Product" to get started!
          </p>
        )}
        {products.map((product) => (
          <div key={product.id} className="product-card reveal">
            <img
              src={getSafeImageUrl(product.imageUrl, "product")}
              alt={product.name}
              loading="lazy"
              onError={onImageError("product")}
            />
            <h4>{product.name}</h4>
            <p style={{ fontSize: "14px", color: "var(--muted)" }}>
              {product.description || "No description"}
            </p>
            <p style={{ fontSize: "18px", fontWeight: "700", color: "#15803d" }}>
              INR {product.price}
            </p>
            <span className="cart-item-type">{product.type}</span>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <Button
                className="btn secondary square"
                onClick={() => handleEdit(product)}
                style={{ flex: 1 }}
              >
                Edit
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => handleDelete(product.id)}
                style={{ flex: 1, background: "#fee", color: "#b42318" }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
