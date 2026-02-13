import { useNavigate } from "react-router-dom";
import Button from "./ui/Button";

function Header() {
  const navigate = useNavigate();

  return (
    <header className="site-header container">
      <button className="brand" onClick={() => navigate("/")}>
        <img
          src="/logo-full.svg"
          alt="AgriEase - Growing Smarter"
          style={{ height: "64px", width: "auto" }}
        />
      </button>

      <div className="nav-actions">
        <Button className="btn outline" onClick={() => navigate("/login")}>
          Login
        </Button>
        <Button className="btn primary" onClick={() => navigate("/register")}>
          Register
        </Button>
      </div>
    </header>
  );
}

export default Header;
