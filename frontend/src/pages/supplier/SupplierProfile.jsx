import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import { toast } from "react-toastify";
import api from "../../api/axios";
import { useLanguage } from "../../context/LanguageContext";

export default function SupplierProfile() {
  const { t } = useLanguage();
  const { user, updateUser, logout } = useAuth();
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
  const [deletingAccount, setDeletingAccount] = useState(false);

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
      setStatsError(t("supplier.profile.statsError"));
    }
  }, [t]);

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
      
      toast.success(t("messages.profileUpdated"));
      setIsEditing(false);
      loadBusinessStats();
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || t("messages.profileUpdateError"));
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
      toast.success(t("supplier.profile.accountDeleted"));
      logout();
    } catch (error) {
      console.error("Delete account error:", error);
      toast.error(error?.response?.data?.message || t("supplier.profile.deleteAccountFailed"));
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <motion.div className="secondary-page" initial="hidden" animate="show" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
      <BackButton />
      <motion.div 
        className="page-hero page-hero--profile" 
        style={{ backgroundImage: "url('/images/profile.jpg')", backgroundBlendMode: "overlay" }}
        variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}
      >
        <h1>{t("supplier.profile.title")}</h1>
        <p>{t("supplier.profile.subtitle")}</p>
      </motion.div>

      <motion.div className="profile-container profile-container--premium" variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}>
        <motion.div className="profile-card profile-card--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <div className="profile-header profile-header--enhanced">
            <div className="profile-avatar-section">
              <div className="profile-avatar profile-avatar--supplier">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  user?.name?.charAt(0).toUpperCase() || "S"
                )}
              </div>
              {isEditing && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
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
                        opacity: uploadingPhoto ? 0.6 : 1,
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600'
                      }}
                    >
                      {uploadingPhoto ? t("messages.uploadingImage") : t("supplier.profile.changePhoto")}
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
                      {t("supplier.profile.removePhoto")}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="profile-header__info">
              <h3 className="profile-header__name">{formData.name || user?.name || t("common.supplier")}</h3>
              <span className="profile-role profile-role--supplier">{t("common.supplier")}</span>
              {formData.businessName && <p className="profile-header__contact">🏢 {formData.businessName}</p>}
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
                    placeholder={t("supplier.profile.addressPlaceholder")}
                  />
                </div>
              </div>
            </div>

            <div className="profile-form__divider"></div>

            <div className="profile-form__section">
              <h4 className="profile-form__section-title">{t("supplier.profile.businessDetails")}</h4>
              <div className="profile-form__grid">
                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.businessName")}</label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                    placeholder={t("supplier.profile.businessNamePlaceholder")}
                  />
                </div>

                <div className="form-group form-group--enhanced">
                  <label>{t("common.labels.businessType")}</label>
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="input input--enhanced"
                  >
                    <option value="">{t("supplier.profile.selectBusinessType")}</option>
                    <option value="Equipment Rental">{t("supplier.profile.businessTypes.equipmentRental")}</option>
                    <option value="Seeds & Fertilizers">{t("supplier.profile.businessTypes.seedsAndFertilizers")}</option>
                    <option value="Pesticides">{t("supplier.profile.businessTypes.pesticides")}</option>
                    <option value="General Supplies">{t("supplier.profile.businessTypes.generalSupplies")}</option>
                    <option value="Other">{t("supplier.profile.businessTypes.other")}</option>
                  </select>
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
                      {t("supplier.profile.deleteAccount")}
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
                        businessName: user.businessName || "",
                        businessType: user.businessType || "",
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

        <motion.div className="profile-stats profile-stats--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
          <div className="profile-stats__header">
            <h3 className="profile-stats__title">{t("supplier.profile.businessStatistics")}</h3>
          </div>
          
          {statsError && <p className="profile-stats__error">{statsError}</p>}
          
          <div className="profile-stats__grid">
            <motion.div className="stat-card stat-card--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
              <div className="stat-card__icon">📦</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("supplier.profile.stats.productsListed")}</h4>
                <p className="stat-card__value">{businessStats.products}</p>
              </div>
            </motion.div>

            <motion.div className="stat-card stat-card--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
              <div className="stat-card__icon">🚜</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("supplier.profile.stats.equipmentListed")}</h4>
                <p className="stat-card__value">{businessStats.equipment}</p>
              </div>
            </motion.div>

            <motion.div className="stat-card stat-card--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
              <div className="stat-card__icon">📊</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("supplier.profile.stats.totalSales")}</h4>
                <p className="stat-card__value">{currencyFormatter.format(businessStats.totalSales)}</p>
              </div>
            </motion.div>

            <motion.div className="stat-card stat-card--premium" variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }}>
              <div className="stat-card__icon">🧾</div>
              <div className="stat-card__content">
                <h4 className="stat-card__title">{t("supplier.profile.stats.totalOrders")}</h4>
                <p className="stat-card__value">{businessStats.totalOrders}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
