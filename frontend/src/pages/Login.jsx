import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/ui/Button";
import { toast } from "react-toastify";
import api from "../api/axios";
import "../styles/auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      
      console.log("Login response:", data);
      console.log("Token:", data.token);
      
      // Save to localStorage first
      localStorage.setItem("user", JSON.stringify(data));
      
      // Verify it was saved
      const saved = localStorage.getItem("user");
      console.log("Saved user data:", saved);
      
      // Then update context
      login(data);
      
      toast.success("Welcome back, " + data.name);

      if (data.role === "FARMER") navigate("/farmer");
      else navigate("/supplier");
    } catch (err) {
      console.error("Login error:", err);
      toast.error(err?.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card reveal">
        <img src="/logo-full.svg" alt="AgriEase - Growing Smarter" style={{width: '280px', marginBottom: '20px'}} />
        <h2 className="auth-title">Sign in</h2>
        <p className="auth-subtitle">Welcome back to AgriEase.</p>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <label>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="input"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="input"
              placeholder="Enter your password"
            />
          </div>

          <div className="auth-actions">
            <Button type="submit" loading={loading} className="btn primary">
              Login
            </Button>
            <Button type="button" onClick={() => navigate("/register")} className="btn ghost">
              Create an account
            </Button>
          </div>
        </form>

        <div className="auth-footer">
          New here? <span onClick={() => navigate("/register")}>Register</span>
        </div>
      </div>
    </div>
  );
}
