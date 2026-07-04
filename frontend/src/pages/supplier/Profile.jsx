import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import BackButton from "../../components/BackButton";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useLanguage } from "../../context/LanguageContext";

export default function Profile() {
  const { user, login } = useAuth();
  const { t, language } = useLanguage();
  const memberSinceDate = user?.createdAt ? new Date(user.createdAt) : null;
  const [isEditing, setIsEditing] = useState(false);
  const getInitialFormData = (profileUser = user) => ({
    name: profileUser?.name || "",
    email: profileUser?.email || "",
    phone: profileUser?.phone || "",
    address: profileUser?.address || "",
    businessName: profileUser?.businessName || "",
    description: profileUser?.description || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [formData, setFormData] = useState(() => getInitialFormData());

  const resetFormFromUser = (profileUser = user) =>
    setFormData((prev) => ({
      ...getInitialFormData(profileUser),
      currentPassword: prev.currentPassword,
      newPassword: prev.newPassword,
      confirmPassword: prev.confirmPassword,
    }));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    try {
      const updateData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        businessName: formData.businessName,
        description: formData.description,
      };

      const response = await api.put("/supplier/profile", updateData);
      
      // Update local storage and context
      const updatedUser = {
        ...user,
        ...response.data,
      };
      login(updatedUser);
      resetFormFromUser(updatedUser);

      toast.success(t("messages.profileUpdated"));
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || t("messages.profileUpdateError"));
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(t("messages.passwordMismatch"));
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error(t("messages.passwordLength"));
      return;
    }

    try {
      await api.put("/supplier/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success(t("messages.passwordChanged"));
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error.response?.data?.message || t("supplier.profile.changePasswordFailed"));
    }
  };

  return (
    <div className="secondary-page">
      <BackButton />
      <div className="page-hero page-hero--profile">
        <h1>{t("supplier.profile.title")}</h1>
        <p>{t("supplier.profile.subtitle")}</p>
      </div>

      <div className="page-header secondary-toolbar">
        <div>
          <h2 className="dash-title">{t("supplier.profile.businessDetails")}</h2>
          <p className="dash-subtitle">{t("supplier.profile.accountSubtitle")}</p>
        </div>
      </div>

      <div className="profile-container">
        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar supplier">
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h3>{user?.name || t("common.supplier")}</h3>
              <span className="profile-role supplier-role">{t("common.supplier")}</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
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
              <label>{t("common.labels.businessName")}</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder={t("supplier.profile.businessNamePlaceholder")}
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
                placeholder={t("supplier.profile.phonePlaceholder")}
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
                placeholder={t("supplier.profile.addressPlaceholder")}
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.businessDescription")}</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                rows="4"
                placeholder={t("supplier.profile.descriptionPlaceholder")}
              />
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <Button
                  type="button"
                  className="btn primary square"
                  onClick={() => setIsEditing(true)}
                >
                  {t("common.actions.editProfile")}
                </Button>
              ) : (
                <>
                  <Button type="submit" className="btn primary square">
                    {t("common.actions.saveChanges")}
                  </Button>
                  <Button
                    type="button"
                    className="btn secondary square"
                    onClick={() => {
                      setIsEditing(false);
                      resetFormFromUser();
                    }}
                  >
                    {t("common.actions.cancel")}
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <h3>{t("common.labels.changePassword")}</h3>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>{t("common.labels.currentPassword")}</label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className="input"
                placeholder={t("common.labels.currentPassword")}
                required
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.newPassword")}</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="input"
                placeholder={t("common.labels.newPassword")}
                minLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label>{t("common.labels.confirmPassword")}</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input"
                placeholder={t("common.labels.confirmPassword")}
                minLength="6"
                required
              />
            </div>

            <Button type="submit" className="btn primary square">
              {t("supplier.profile.updatePassword")}
            </Button>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="profile-card">
          <h3>{t("common.labels.accountInformation")}</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">{t("common.labels.accountType")}:</span>
              <span className="info-value">{t("common.supplier")}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t("common.labels.memberSince")}:</span>
              <span className="info-value">
                {memberSinceDate ? memberSinceDate.toLocaleDateString(language === "mr" ? "mr-IN" : "en-IN") : "N/A"}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">{t("common.labels.userId")}:</span>
              <span className="info-value">#{user?.id || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
