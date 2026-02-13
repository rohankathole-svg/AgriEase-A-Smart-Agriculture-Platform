import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../components/ui/Button";
import { toast } from "react-toastify";
import api from "../api/axios";
import "../styles/auth.css";

function Register() {
  const location = useLocation();
  const preselectedRole = location.state?.role || "";
  const [role, setRole] = useState(preselectedRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    
    if (!fullName || !email || !password || !role) {
      toast.error("Please fill all required fields and select a role.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: fullName,
        email,
        mobile,
        password,
        role,
      });

      toast.success("Registration successful. Please login.");
      navigate("/login");
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "An error occurred during registration. Try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card reveal">
        <img src="/logo-full.svg" alt="AgriEase - Growing Smarter" style={{width: '280px', marginBottom: '20px'}} />
        <h2 className="auth-title">Join AgriEase</h2>
        <p className="auth-subtitle">Connect with farmers and suppliers.</p>

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <label>Full Name</label>
            <input
              placeholder="Full name"
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Email</label>
            <input
              placeholder="Email address"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Mobile Number</label>
            <input
              placeholder="Mobile number"
              className="input"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="role-toggle">
            <button
              type="button"
              className={`role-option ${role === "FARMER" ? "active" : ""}`}
              onClick={() => setRole("FARMER")}
            >
              Farmer
            </button>
            <button
              type="button"
              className={`role-option ${role === "SUPPLIER" ? "active" : ""}`}
              onClick={() => setRole("SUPPLIER")}
            >
              Supplier
            </button>
          </div>

          <div className="auth-actions">
            <Button
              type="submit"
              loading={loading}
              className="btn primary"
            >
              Create Account
            </Button>
            <Button type="button" onClick={() => navigate("/login")} className="btn ghost">
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
