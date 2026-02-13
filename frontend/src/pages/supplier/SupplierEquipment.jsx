import { useState, useEffect } from "react";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { uploadToCloudinary } from "../../services/cloudinary";
import { getSafeImageUrl, onImageError } from "../../utils/imageUtils";

export default function SupplierEquipment() {
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

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = () => {
    api
      .get("/supplier/equipment")
      .then((res) => setEquipment(res.data))
      .catch(() => toast.error("Failed to load equipment"));
  };

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
        toast.info("Uploading image...");
        imageUrl = await uploadToCloudinary(imageFile);
      }

      const dataToSend = { ...formData, imageUrl };

      if (editingId) {
        await api.put(`/supplier/equipment/${editingId}`, dataToSend);
        toast.success("Equipment updated successfully!");
      } else {
        await api.post("/supplier/equipment", dataToSend);
        toast.success("Equipment added successfully!");
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
      toast.error("Failed to save equipment");
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
    if (!window.confirm("Are you sure you want to delete this equipment?")) {
      return;
    }
    try {
      await api.delete(`/supplier/equipment/${id}`);
      toast.success("Equipment deleted successfully!");
      fetchEquipment();
    } catch (error) {
      toast.error("Failed to delete equipment");
    }
  };

  const toggleAvailability = async (id, currentStatus) => {
    try {
      // Find the equipment item
      const item = equipment.find(eq => eq.id === id);
      if (!item) {
        toast.error("Equipment not found");
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
      
      toast.success("Availability updated!");
      fetchEquipment();
    } catch (error) {
      console.error("Toggle availability error:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to update availability");
      }
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 className="dash-title">Manage Equipment</h2>
          <p className="dash-subtitle">Add and manage equipment for rent</p>
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
          {showForm ? "Cancel" : "+ Add Equipment"}
        </Button>
      </div>

      {showForm && (
        <div className="product-card" style={{ marginBottom: "24px" }}>
          <h3>{editingId ? "Edit Equipment" : "Add New Equipment"}</h3>
          <form onSubmit={handleSubmit} className="form-row">
            <div className="form-group">
              <label>Equipment Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
                placeholder="e.g., Tractor"
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
                placeholder="Equipment description"
              />
            </div>

            <div className="form-group">
              <label>Daily Rate (INR) *</label>
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
              <label>Equipment Image</label>
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
                Available for rent
              </label>
            </div>

            <Button type="submit" className="btn primary square">
              {editingId ? "Update Equipment" : "Add Equipment"}
            </Button>
          </form>
        </div>
      )}

      <div className="product-grid supplier-grid">
        {equipment.length === 0 && (
          <p className="empty-state" style={{ gridColumn: "1 / -1" }}>
            No equipment yet. Click "Add Equipment" to get started!
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
                  {item.description || "No description"}
                </p>
              </div>
              <p className="product-rate">INR {item.dailyRate} / day</p>
              <span
                className={`availability-pill ${item.available ? "is-available" : "is-unavailable"}`}
              >
                {item.available ? "Available" : "Not Available"}
              </span>
            </div>
            <div className="product-actions">
              <Button
                className="btn secondary square"
                onClick={() => handleEdit(item)}
              >
                Edit
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => toggleAvailability(item.id, item.available)}
              >
                {item.available ? "Mark Unavailable" : "Mark Available"}
              </Button>
              <Button
                className="btn secondary square"
                onClick={() => handleDelete(item.id)}
                style={{ background: "#fee", color: "#b42318" }}
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
