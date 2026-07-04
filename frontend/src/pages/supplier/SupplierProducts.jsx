import { useState, useEffect, useCallback } from "react";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { uploadToCloudinary } from "../../services/cloudinary";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function SupplierProducts() {
  const { t } = useLanguage();
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

  const fetchProducts = useCallback(() => {
    api
      .get("/supplier/products")
      .then((res) => setProducts(res.data))
      .catch(() => toast.error(t("messages.loadProductsError")));
  }, [t]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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
        toast.info(t("messages.uploadingImage"));
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const dataToSend = { ...formData, imageUrl };

      if (editingId) {
        await api.put(`/supplier/products/${editingId}`, dataToSend);
        toast.success(t("supplier.products.toast.updated"));
      } else {
        await api.post("/supplier/products", dataToSend);
        toast.success(t("supplier.products.toast.added"));
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
      toast.error(t("supplier.products.toast.saveError"));
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
    if (!window.confirm(t("supplier.products.confirm.delete"))) {
      return;
    }
    try {
      await api.delete(`/supplier/products/${id}`);
      toast.success(t("supplier.products.toast.deleted"));
      fetchProducts();
    } catch {
      toast.error(t("supplier.products.toast.deleteError"));
    }
  };

  return (
    <div className="secondary-page">
      <BackButton />
      <div className="page-hero page-hero--supplier-products">
        <h1>{t("supplier.products.title")}</h1>
        <p>{t("supplier.products.subtitle")}</p>
      </div>

      <div className="page-header secondary-toolbar">
        <div>
          <h2 className="dash-title">{t("supplier.products.catalogTitle")}</h2>
          <p className="dash-subtitle">{t("supplier.products.catalogSubtitle")}</p>
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
          {showForm ? t("common.actions.cancel") : t("common.actions.addProduct")}
        </Button>
      </div>

      {showForm && (
        <div className="product-card secondary-panel">
          <h3>{editingId ? t("supplier.products.form.editTitle") : t("supplier.products.form.addTitle")}</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>{t("supplier.products.form.productName")} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder={t("supplier.products.form.productNamePlaceholder")}
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.description")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder={t("supplier.products.form.descriptionPlaceholder")}
              />
            </div>

            <div className="form-group">
              <label>{t("supplier.products.form.price")} (INR) *</label>
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
              <label>{t("supplier.products.form.type")}</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                <option value="PRODUCT">{t("common.labels.product")}</option>
                <option value="CROP">{t("supplier.products.types.cropSeeds")}</option>
                <option value="FERTILIZER">{t("supplier.products.types.fertilizer")}</option>
                <option value="PESTICIDE">{t("supplier.products.types.pesticide")}</option>
              </select>
            </div>

            <div className="form-group">
              <label>{t("supplier.products.form.image")}</label>
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
              {editingId ? t("common.actions.updateProduct") : t("common.actions.addProduct")}
            </Button>
          </form>
        </div>
      )}

      <div className="product-grid">
        {products.length === 0 && (
          <p className="empty-state" style={{ gridColumn: "1 / -1" }}>
            {t("supplier.products.empty")}
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
              {product.description || t("supplier.products.noDescription")}
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
                {t("common.actions.edit")}
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => handleDelete(product.id)}
                style={{ flex: 1, background: "#fee", color: "#b42318" }}
              >
                {t("common.actions.delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
