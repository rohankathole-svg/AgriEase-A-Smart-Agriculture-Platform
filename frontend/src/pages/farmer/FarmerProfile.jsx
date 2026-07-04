import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
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
  }, [t]);

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
      t("farmer.profile.deleteConfirm")
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
      toast.success(t("supplier.profile.accountDeleted"));
      logout();
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error?.response?.data?.message || t("supplier.profile.deleteAccountFailed"));
    } finally {
      setDeletingAccount(false);
    }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <motion.div className="secondary-page" initial="hidden" animate="show" variants={staggerContainer}>
      <BackButton />
      <motion.div 
        className="page-hero page-hero--profile" 
        style={{ backgroundImage: "url('/images/profile.jpg')" }}
        variants={fadeUp}
      >
        <h1>{t("farmer.profile.title")}</h1>
        <p>{t("farmer.profile.subtitle")}</p>
      </motion.div>

      <motion.div className="profile-container profile-container--premium" variants={staggerContainer}>
        <motion.div className="profile-card profile-card--premium" variants={fadeUp}>
          <div className="profile-header profile-header--enhanced">
            <div className="profile-avatar-section">
              <div className="profile-avatar profile-avatar--farmer">
                {photoPreview ? (
                  <img src={photoPreview} alt={t("farmer.profile.title")} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "F"
                )}
              </div>
              {isEditing && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                        borderRadius: '8px',
                        fontWeight: '600'
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
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      ✕ {t("farmer.profile.removePhoto")}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="profile-header__info">
              <h3 className="profile-header__name">{formData.name || user?.name || t("common.farmer")}</h3>
              <span className="profile-role profile-role--farmer">{t("farmer.profile.role")}</span>
              {formData.phone && <p className="profile-header__contact">📞 {formData.phone}</p>}
              {formData.email && <p className="profile-header__email">✉️ {formData.email}</p>}
            </div>
          </div>

          <div className="profile-divider"></div>

          <form onSubmit={handleSubmit} className="profile-form profile-form--enhanced">
            <div className="profile-form__section">
              <h4 className="profile-form__section-title">{t("supplier.profile.personalInfo")}</h4>
              <div className="profile-form__grid">
                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.fullName")}</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    required
                  />
                </div>

                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.email")}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    required
                  />
                </div>

                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.phoneNumber")}</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    placeholder={t("farmer.profile.placeholders.phone")}
                  />
                </div>

                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.address")}</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    rows="2"
                    placeholder={t("farmer.profile.placeholders.address")}
                  />
                </div>
              </div>
            </div>

            <div className="profile-form__divider"></div>

            <div className="profile-form__section">
              <h4 className="profile-form__section-title">{t("supplier.profile.businessDetails")}</h4>
              <div className="profile-form__grid">
                <div className="form-group form-group--enhanced">
                  <label>{t("farmer.profile.form.farmSizeLabel")}</label>
                  <input
                    type="text"
                    name="farmSize"
                    value={formData.farmSize}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    placeholder={t("farmer.profile.placeholders.farmSize")}
                  />
                </div>

                <div className="form-group form-group--enhanced">
                  <label>{t("farmer.profile.form.cropTypesLabel")}</label>
                  <input
                    type="text"
                    name="cropTypes"
                    value={formData.cropTypes}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    placeholder={t("farmer.profile.placeholders.cropTypes")}
                  />
                </div>
              </div>
            </div>

            <div className="profile-actions profile-actions--enhanced">
              {!isEditing ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      className="btn primary square"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                      }}
                    >
                      {t("common.actions.editProfile")}
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      type="button"
                      className="btn btn--danger-outline"
                      onClick={handleDeleteAccount}
                      loading={deletingAccount}
                    >
                      Delete Account
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button type="submit" className="btn primary square">
                      {t("common.actions.saveChanges")}
                    </Button>
                  </motion.div>
                  <Button
                    type="button"
                    className="btn secondary square"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsEditing(false);
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
        </motion.div>

        <motion.div className="profile-stats profile-stats--premium" variants={fadeUp}>
          <div className="profile-stats__header">
            <h3 className="profile-stats__title">{t("farmer.profile.accountStatsTitle")}</h3>
            <motion.button
              type="button"
              className="btn btn--icon"
              onClick={loadAccountStats}
              disabled={statsLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              🔄
            </motion.button>
          </div>
          
          {statsError && <p className="profile-stats__error">{statsError}</p>}
          
          <div className="profile-stats__grid">
            <motion.div className="stat-card stat-card--premium" variants={fadeUp}>
              <div className="stat-card__icon">🛒</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("farmer.profile.stats.totalOrders")}</h4>
                <p className="stat-card__value">{statsLoading ? "--" : accountStats.totalOrders}</p>
              </div>
            </motion.div>

            <motion.div className="stat-card stat-card--premium" variants={fadeUp}>
              <div className="stat-card__icon">🚜</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("farmer.profile.stats.equipmentBookings")}</h4>
                <p className="stat-card__value">{statsLoading ? "--" : accountStats.equipmentBookings}</p>
                <p className="stat-card__helper">
                  {t("farmer.profile.stats.activeNow")}: {statsLoading ? "--" : accountStats.activeBookings}
                </p>
              </div>
            </motion.div>

            <motion.div className="stat-card stat-card--premium" variants={fadeUp}>
              <div className="stat-card__icon">🌱</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("farmer.profile.stats.diseaseScans")}</h4>
                <p className="stat-card__value">{statsLoading ? "--" : accountStats.diseaseScans}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
