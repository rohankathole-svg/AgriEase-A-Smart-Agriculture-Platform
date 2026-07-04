import { useState, useEffect, useCallback } from "react";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { uploadToCloudinary } from "../../services/cloudinary";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";
import { useLanguage } from "../../context/LanguageContext";

export default function SupplierEquipment() {
  const { t } = useLanguage();
  const [equipment, setEquipment] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dailyRate: "",
    available: true,
    imageUrl: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchEquipment = useCallback(() => {
    api
      .get("/supplier/equipment")
      .then((res) => setEquipment(res.data))
      .catch(() => toast.error(t("messages.loadEquipmentError")));
  }, [t]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
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
        await api.put(`/supplier/equipment/${editingId}`, dataToSend);
        toast.success(t("supplier.equipment.toast.updated"));
      } else {
        await api.post("/supplier/equipment", dataToSend);
        toast.success(t("supplier.equipment.toast.added"));
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        dailyRate: "",
        available: true,
        imageUrl: "",
      });
      setImageFile(null);
      setImagePreview(null);
      fetchEquipment();
    } catch (error) {
      console.error("Equipment save error:", error);
      toast.error(t("supplier.equipment.toast.saveError"));
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      description: item.description,
      dailyRate: item.dailyRate,
      available: item.available,
      imageUrl: item.imageUrl,
    });
    setImageFile(null);
    setImagePreview(item.imageUrl);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("supplier.equipment.confirm.delete"))) {
      return;
    }
    try {
      await api.delete(`/supplier/equipment/${id}`);
      toast.success(t("supplier.equipment.toast.deleted"));
      fetchEquipment();
    } catch {
      toast.error(t("supplier.equipment.toast.deleteError"));
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      // Find the equipment item
      const item = equipment.find(eq => eq.id === id);
      if (!item) {
        toast.error(t("supplier.equipment.toast.notFound"));
        return;
      }

      // Send complete data with updated availability
      const updatedData = {
        name: item.name,
        description: item.description,
        dailyRate: item.dailyRate,
        imageUrl: item.imageUrl,
        available: !currentStatus
      };

      console.log("Updating equipment availability:", { id, updatedData });
      const response = await api.put(`/supplier/equipment/${id}`, updatedData);
      console.log("Update response:", response.data);
      
      toast.success(t("supplier.equipment.toast.availabilityUpdated"));
      fetchEquipment();
    } catch (error) {
      console.error("Toggle availability error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error(t("messages.sessionExpired"));
      } else {
        toast.error(error.response?.data?.message || t("supplier.equipment.toast.availabilityError"));
      }
    }
  };

  return (
    <div className="secondary-page">
      <BackButton />
      <div className="page-hero page-hero--supplier-equipment">
        <h1>{t("supplier.equipment.title")}</h1>
        <p>{t("supplier.equipment.subtitle")}</p>
      </div>

      <div className="page-header secondary-toolbar">
        <div>
          <h2 className="dash-title">{t("supplier.equipment.fleetTitle")}</h2>
          <p className="dash-subtitle">{t("supplier.equipment.fleetSubtitle")}</p>
        </div>
        <Button
          className="btn primary square"
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
            setFormData({
              name: "",
              description: "",
              dailyRate: "",
              available: true,
              imageUrl: "",
            });
            setImageFile(null);
            setImagePreview(null);
          }}
        >
          {showForm ? t("common.actions.cancel") : t("common.actions.addEquipment")}
        </Button>
      </div>

      {showForm && (
        <div className="product-card secondary-panel">
          <h3>{editingId ? t("supplier.equipment.form.editTitle") : t("supplier.equipment.form.addTitle")}</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>{t("supplier.equipment.form.name")} *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder={t("supplier.equipment.form.namePlaceholder")}
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
                placeholder={t("supplier.equipment.form.descriptionPlaceholder")}
              />
            </div>

            <div className="form-group">
              <label>{t("supplier.equipment.form.dailyRate")} (INR) *</label>
              <input
                type="number"
                name="dailyRate"
                value={formData.dailyRate}
                onChange={handleChange}
                className="input"
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="form-group">
              <label>{t("supplier.equipment.form.image")}</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="input"
              />
              {imagePreview && (
                <img
                  src={getSafeImageUrl(imagePreview, "equipment")}
                  alt="Preview"
                  onError={onImageError("equipment")}
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

            <div className="form-group">
              <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                />
                {t("supplier.equipment.form.availableForRent")}
              </label>
            </div>

            <Button type="submit" className="btn primary square">
              {editingId ? t("common.actions.updateEquipment") : t("common.actions.addEquipment")}
            </Button>
          </form>
        </div>
      )}

      <div className="product-grid supplier-grid">
        {equipment.length === 0 && (
          <p className="empty-state" style={{ gridColumn: "1 / -1" }}>
            {t("supplier.equipment.empty")}
          </p>
        )}
        {equipment.map((item) => (
          <div key={item.id} className="product-card supplier-card reveal">
            <img
              src={getSafeImageUrl(item.imageUrl, "equipment")}
              alt={item.name}
              loading="lazy"
              onError={onImageError("equipment")}
            />
            <div className="product-info">
              <div>
                <h4>{item.name}</h4>
                <p className="product-description">
                  {item.description || t("supplier.equipment.noDescription")}
                </p>
              </div>
              <p className="product-rate">INR {item.dailyRate} / day</p>
              <span
                className={`availability-pill ${item.available ? "is-available" : "is-unavailable"}`}
              >
                {item.available ? t("common.labels.available") : t("common.labels.unavailable")}
              </span>
            </div>
            <div className="product-actions">
              <Button
                className="btn secondary square"
                onClick={() => handleEdit(item)}
              >
                {t("common.actions.edit")}
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => toggleAvailability(item.id, item.available)}
              >
                {item.available ? t("common.actions.markUnavailable") : t("common.actions.markAvailable")}
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => handleDelete(item.id)}
                style={{ background: "#fee", color: "#b42318" }}
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
