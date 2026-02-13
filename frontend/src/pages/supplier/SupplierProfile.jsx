import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";

export default function SupplierProfile() {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    businessName: "",
    businessType: "",
    profilePhoto: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [businessStats, setBusinessStats] = useState({
    products: 0,
    equipment: 0,
    totalSales: 0,
    totalOrders: 0,
  });
  const [statsError, setStatsError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      console.log("Loading profile from backend...");
      const response = await api.get("/supplier/profile");
      if (response.data) {
        const userData = response.data;
        console.log("Profile loaded:", userData);
        updateUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          businessName: userData.businessName || "",
          businessType: userData.businessType || "",
          profilePhoto: userData.profilePhoto || "",
        });
        if (userData.profilePhoto) {
          setPhotoPreview(userData.profilePhoto);
        }
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      // Don't show error toast on initial load
    }
  }, [updateUser]);

  useEffect(() => {
    // Load fresh profile data from backend on mount
    loadProfile();
  }, [loadProfile]); // Now safe to include loadProfile

  const loadBusinessStats = useCallback(async () => {
    try {
      setStatsError("");
      const [productsRes, equipmentRes, ordersRes] = await Promise.all([
        api.get("/supplier/products"),
        api.get("/supplier/equipment"),
        api.get("/supplier/orders"),
      ]);

      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const equipment = Array.isArray(equipmentRes.data) ? equipmentRes.data : [];
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];

      const totalSales = orders.reduce((sum, order) => {
        const status = (order.status || "").toUpperCase();
        if (status === "DELIVERED" || status === "COMPLETED") {
          return sum + Number(order.totalAmount || 0);
        }
        return sum;
      }, 0);

      setBusinessStats({
        products: products.length,
        equipment: equipment.length,
        totalSales,
        totalOrders: orders.length,
      });
    } catch (error) {
      console.error("Failed to load business stats", error);
      setStatsError("Unable to load live stats right now");
    }
  }, []);

  useEffect(() => {
    loadBusinessStats();
  }, [loadBusinessStats]);

  useEffect(() => {
    // Update form data when user changes
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        businessName: user.businessName || "",
        businessType: user.businessType || "",
        profilePhoto: user.profilePhoto || "",
      });
      if (user.profilePhoto) {
        setPhotoPreview(user.profilePhoto);
      }
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }

      setUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setPhotoPreview(base64String);
        setFormData({
          ...formData,
          profilePhoto: base64String,
        });
        setUploadingPhoto(false);
      };
      reader.onerror = () => {
        toast.error("Failed to read image file");
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setFormData({
      ...formData,
      profilePhoto: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Form submitted, saving profile...");
    console.log("Form data being sent:", { ...formData, profilePhoto: formData.profilePhoto ? 'base64 image...' : 'none' });
    
    try {
      const response = await api.put("/supplier/profile", formData);
      
      console.log("Server response:", response.data);
      
      // Update user data in localStorage and context
      if (response.data.user) {
        updateUser(response.data.user);
        // Reload fresh data from backend
        await loadProfile();
      } else if (response.data) {
        // If response doesn't have user property, use the response data directly
        updateUser(response.data);
        await loadProfile();
      }
      
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      loadBusinessStats();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  return (
    <div>
      <h2 className="dash-title">My Profile</h2>
      <p className="dash-subtitle">Manage your account information</p>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "S"
                )}
              </div>
              {isEditing && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                    id="supplier-photo-upload"
                    disabled={uploadingPhoto}
                  />
                  <label 
                    htmlFor="supplier-photo-upload" 
                    style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer' }}
                  >
                    <span 
                      className="btn secondary square"
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        display: 'inline-block',
                        opacity: uploadingPhoto ? 0.6 : 1
                      }}
                    >
                      {uploadingPhoto ? "Uploading..." : "Change Photo"}
                    </span>
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      className="btn secondary square"
                      onClick={removePhoto}
                      style={{ fontSize: '12px', padding: '6px 12px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
            <div>
              <h3>{formData.name || user?.name || "Supplier"}</h3>
              <span className="profile-role">Supplier</span>
              {formData.phone && <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>📞 {formData.phone}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                rows="3"
                placeholder="Enter your business address"
              />
            </div>

            <div className="form-group">
              <label>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder="e.g., ABC Agri Supplies"
              />
            </div>

            <div className="form-group">
              <label>Business Type</label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
              >
                <option value="">Select business type</option>
                <option value="Equipment Rental">Equipment Rental</option>
                <option value="Seeds & Fertilizers">Seeds & Fertilizers</option>
                <option value="Pesticides">Pesticides</option>
                <option value="General Supplies">General Supplies</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <Button
                  type="button"
                  className="btn primary square"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("Edit Profile button clicked, entering edit mode");
                    setIsEditing(true);
                  }}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button type="submit" className="btn primary square">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    className="btn secondary square"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(false);
                      // Reset form data
                      setFormData({
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        address: user.address || "",
                        businessName: user.businessName || "",
                        businessType: user.businessType || "",
                        profilePhoto: user.profilePhoto || "",
                      });
                      setPhotoPreview(user.profilePhoto || null);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="profile-stats">
          <h3>Business Statistics</h3>
          {statsError && <p className="inline-error">{statsError}</p>}
          <div className="stat-card">
            <div className="stat-icon">📦</div>
            <div>
              <h4>Products Listed</h4>
              <p className="stat-value">{businessStats.products}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚜</div>
            <div>
              <h4>Equipment Listed</h4>
              <p className="stat-value">{businessStats.equipment}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div>
              <h4>Total Sales</h4>
              <p className="stat-value">{currencyFormatter.format(businessStats.totalSales)}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🧾</div>
            <div>
              <h4>Total Orders</h4>
              <p className="stat-value">{businessStats.totalOrders}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
