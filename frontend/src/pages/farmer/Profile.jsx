import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { toast } from "react-toastify";
import { useLanguage } from "../../context/LanguageContext";

export default function Profile() {
  const { user, login } = useAuth();
  const { t, language } = useLanguage();
  const locale = language === "mr" ? "mr-IN" : "en-IN";
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  }, [user]);

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
      };

      const response = await api.put("/farmer/profile", updateData);
      
      // Update local storage and context
      const updatedUser = {
        ...user,
        ...response.data,
      };
      login(updatedUser);

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
      await api.put("/farmer/change-password", {
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
      toast.error(error.response?.data?.message || t("messages.profileUpdateError"));
    }
  };

  return (
    <div>
      <h2 className="dash-title">{t("farmer.account.title")}</h2>
      <p className="dash-subtitle">{t("farmer.account.subtitle")}</p>

      <div className="profile-container">
        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.name?.charAt(0).toUpperCase() || "F"}
            </div>
            <div>
              <h3>{user?.name || "Farmer"}</h3>
              <span className="profile-role">{t("farmer.profile.role")}</span>
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
                placeholder="Enter phone number"
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
                placeholder="Enter your address"
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
                      // Reset form
                      setFormData({
                        ...formData,
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        address: user.address || "",
                      });
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
                placeholder="Enter current password"
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
                placeholder="Enter new password"
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
                placeholder="Confirm new password"
                minLength="6"
                required
              />
            </div>

            <Button type="submit" className="btn primary square">
              {t("common.actions.saveChanges")}
            </Button>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="profile-card">
          <h3>{t("common.labels.accountInformation")}</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">{t("common.labels.accountType")}:</span>
              <span className="info-value">{t("farmer.profile.role")}</span>
            </div>
            <div className="info-item">
              <span className="info-label">{t("common.labels.memberSince")}:</span>
              <span className="info-value">
                {new Date(user?.createdAt || Date.now()).toLocaleDateString(locale)}
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
