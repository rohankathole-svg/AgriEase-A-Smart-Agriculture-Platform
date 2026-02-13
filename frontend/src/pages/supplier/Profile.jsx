import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/ui/Button";
import api from "../../api/axios";
import { toast } from "react-toastify";

export default function Profile() {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    businessName: "",
    description: "",
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
        businessName: user.businessName || "",
        description: user.description || "",
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

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await api.put("/supplier/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password changed successfully!");
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    }
  };

  return (
    <div>
      <h2 className="dash-title">My Profile</h2>
      <p className="dash-subtitle">Manage your supplier account information</p>

      <div className="profile-container">
        {/* Profile Information Card */}
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar supplier">
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <h3>{user?.name || "Supplier"}</h3>
              <span className="profile-role supplier-role">Supplier</span>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="profile-form">
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
              <label>Business Name</label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                placeholder="Enter business name"
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
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
                placeholder="Enter business address"
              />
            </div>

            <div className="form-group">
              <label>Business Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={!isEditing}
                className="input"
                rows="4"
                placeholder="Describe your business and products"
              />
            </div>

            <div className="profile-actions">
              {!isEditing ? (
                <Button
                  type="button"
                  className="btn primary square"
                  onClick={() => setIsEditing(true)}
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
                    onClick={() => {
                      setIsEditing(false);
                      // Reset form
                      setFormData({
                        ...formData,
                        name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                        address: user.address || "",
                        businessName: user.businessName || "",
                        description: user.description || "",
                      });
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="profile-card">
          <h3>Change Password</h3>
          <form onSubmit={handleChangePassword} className="profile-form">
            <div className="form-group">
              <label>Current Password</label>
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
              <label>New Password</label>
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
              <label>Confirm New Password</label>
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
              Update Password
            </Button>
          </form>
        </div>

        {/* Account Info Card */}
        <div className="profile-card">
          <h3>Account Information</h3>
          <div className="info-list">
            <div className="info-item">
              <span className="info-label">Account Type:</span>
              <span className="info-value">Supplier</span>
            </div>
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">#{user?.id || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
