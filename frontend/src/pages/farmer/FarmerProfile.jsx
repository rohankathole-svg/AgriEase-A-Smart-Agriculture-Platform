import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function FarmerProfile() {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    farmSize: "",
    cropTypes: "",
    profilePhoto: "",
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [accountStats, setAccountStats] = useState({
    totalOrders: 0,
    equipmentBookings: 0,
    activeBookings: 0,
    diseaseScans: 0,
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      console.log("Loading farmer profile from backend...");
      const response = await api.get("/farmer/profile");
      if (response.data) {
        const userData = response.data;
        console.log("Farmer profile loaded:", userData);
        updateUser(userData);
        setFormData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          address: userData.address || "",
          farmSize: userData.farmSize || "",
          cropTypes: userData.cropTypes || "",
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
  }, [loadProfile]);

  const loadAccountStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError("");
      const [ordersRes, bookingsRes, diseaseRes] = await Promise.all([
        api.get("/farmer/orders"),
        api.get("/farmer/bookings"),
        api.get("/farmer/disease/reports"),
      ]);

      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const bookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
      const diseaseReports = Array.isArray(diseaseRes.data) ? diseaseRes.data : [];

      const activeBookings = bookings.filter((booking) => {
        const status = (booking.status || "").toUpperCase();
        return status !== "COMPLETED" && status !== "CANCELLED";
      }).length;

      setAccountStats({
        totalOrders: orders.length,
        equipmentBookings: bookings.length,
        activeBookings,
        diseaseScans: diseaseReports.length,
      });
    } catch (error) {
      console.error("Failed to load account stats", error);
      setStatsError(t("farmer.profile.statsError"));
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccountStats();
  }, [loadAccountStats]);

  useEffect(() => {
    // Update form data when user changes
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        farmSize: user.farmSize || "",
        cropTypes: user.cropTypes || "",
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
        toast.error(t("messages.imageTooLarge"));
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(t("messages.imageType"));
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
        toast.error(t("messages.imageReadError"));
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
    
    console.log("Farmer form submitted, saving profile...");
    console.log("Form data being sent:", { ...formData, profilePhoto: formData.profilePhoto ? 'base64 image...' : 'none' });
    
    try {
      const response = await api.put("/farmer/profile", formData);
      
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
      
      toast.success(t("messages.profileUpdated"));
      setIsEditing(false);
      loadAccountStats();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || t("messages.profileUpdateError"));
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your profile and related data. This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingAccount(true);
      try {
        await api.delete("/api/user/account");
      } catch (error) {
        if (error?.response?.status === 404) {
          await api.delete("/user/account");
        } else {
          throw error;
        }
      }
      toast.success("Account deleted successfully");
      logout();
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error?.response?.data?.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div>
      <h2 className="dash-title">{t("farmer.profile.title")}</h2>
      <p className="dash-subtitle">{t("farmer.profile.subtitle")}</p>

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "F"
                )}
              </div>
              {console.log("FarmerProfile - isEditing:", isEditing)}
              {isEditing && (
                <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                    id="farmer-photo-upload"
                    disabled={uploadingPhoto}
                  />
                  <label 
                    htmlFor="farmer-photo-upload" 
                    style={{ cursor: uploadingPhoto ? 'not-allowed' : 'pointer' }}
                  >
                    <span 
                      className="btn secondary square"
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        display: 'inline-block',
                        opacity: uploadingPhoto ? 0.6 : 1,
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      {uploadingPhoto ? t("messages.uploadingImage") : `📷 ${t("farmer.profile.changePhoto")}`}
                    </span>
                  </label>
                  {photoPreview && (
                    <button
                      type="button"
                      className="btn secondary square"
                      onClick={removePhoto}
                      style={{ 
                        fontSize: '12px', 
                        padding: '6px 12px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px'
                      }}
                    >
                      ✕ {t("farmer.profile.removePhoto")}
                    </button>
                  )}
                </div>
              )}
              {!isEditing && (
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                  {t("farmer.profile.avatarHint")}
                </div>
              )}
            </div>
            <div>
              <h3>{formData.name || user?.name || "Farmer"}</h3>
              <span className="profile-role">{t("farmer.profile.role")}</span>
              {formData.phone && <p style={{ margin: '4px 0', color: '#666', fontSize: '14px' }}>📞 {formData.phone}</p>}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>{t("common.labels.fullName")}</label>
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
              <label>{t("common.labels.email")}</label>
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
              <label>{t("common.labels.phoneNumber")}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder={t("farmer.profile.placeholders.phone")}
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.address")}</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                rows="3"
                placeholder={t("farmer.profile.placeholders.address")}
              />
            </div>

            <div className="form-group">
              <label>{t("farmer.profile.form.farmSizeLabel")}</label>
              <input
                type="text"
                name="farmSize"
                value={formData.farmSize}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder={t("farmer.profile.placeholders.farmSize")}
              />
            </div>

            <div className="form-group">
              <label>{t("farmer.profile.form.cropTypesLabel")}</label>
              <input
                type="text"
                name="cropTypes"
                value={formData.cropTypes}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder={t("farmer.profile.placeholders.cropTypes")}
              />
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <>
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
                    {t("common.actions.editProfile")}
                  </Button>
                  <Button
                    type="button"
                    className="btn secondary square"
                    onClick={handleDeleteAccount}
                    loading={deletingAccount}
                    style={{ background: "#fee", color: "#b42318", border: "1px solid #fdd" }}
                  >
                    Delete Account
                  </Button>
                </>
              ) : (
                <>
                  <Button type="submit" className="btn primary square">
                    {t("common.actions.saveChanges")}
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
                        farmSize: user.farmSize || "",
                        cropTypes: user.cropTypes || "",
                        profilePhoto: user.profilePhoto || "",
                      });
                      setPhotoPreview(user.profilePhoto || null);
                    }}
                  >
                    {t("common.actions.cancel")}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>

        <div className="profile-stats">
          <div className="profile-stats-header">
            <h3>{t("farmer.profile.accountStatsTitle")}</h3>
            <Button
              type="button"
              className="btn ghost"
              onClick={loadAccountStats}
              loading={statsLoading}
            >
              {t("farmer.home.refresh")}
            </Button>
          </div>
          {statsError && <p className="inline-error">{statsError}</p>}
          <div className="stat-card">
            <div className="stat-icon">🛒</div>
            <div>
              <h4>{t("farmer.profile.stats.totalOrders")}</h4>
              <p className="stat-value">{statsLoading ? "--" : accountStats.totalOrders}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🚜</div>
            <div>
              <h4>{t("farmer.profile.stats.equipmentBookings")}</h4>
              <p className="stat-value">{statsLoading ? "--" : accountStats.equipmentBookings}</p>
              <p className="stat-helper">
                {t("farmer.profile.stats.activeNow")}: {statsLoading ? "--" : accountStats.activeBookings}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🌱</div>
            <div>
              <h4>{t("farmer.profile.stats.diseaseScans")}</h4>
              <p className="stat-value">{statsLoading ? "--" : accountStats.diseaseScans}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
