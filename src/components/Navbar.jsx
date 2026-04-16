import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "../styles/Navbar.css";
import logoBanco from "../assets/banco.png";

export default function Navbar() {
  const { user, profile, permissions, loading, logout } = useAuth();

  

  const [openMenu, setOpenMenu] = useState(false);
const menuRef = useRef();
  const isRecruiter = permissions?.isRecruiter;
  const isAdmin = permissions?.isAdmin;
  
useEffect(() => {
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setOpenMenu(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);


if (loading) return null; // 🔒 evita flicker
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">

        {/* BRAND */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
  <img src={logoBanco} height="40" alt="Mibanco Logo" className="hover-scale" />
  <span className="ms-2 fw-bold text-muted small">
    | Match Talento
  </span>
</Link>

        <div className="collapse navbar-collapse justify-content-end">
          <ul className="navbar-nav align-items-center gap-2">

            <li className="nav-item">
              <Link className="nav-link" to="/">
                Inicio
              </Link>
            </li>

            <li className="nav-item">
              <a className="nav-link" href="/#vacantes">
                Vacantes
              </a>
            </li>

            {/* 🔥 SOLO RECRUITER O ADMIN */}
            {isRecruiter && (
              <li className="nav-item">
                <Link
                  className="nav-link text-mibanco-green fw-bold"
                  to="/dashboard"
                >
                  Portal RRHH
                </Link>
              </li>
            )}

            {/* 🧠 SOLO ADMIN */}
            {isAdmin && (
              <li className="nav-item">
                <Link
                  className="nav-link text-warning fw-bold"
                  to="/admin"
                >
                  Admin Panel
                </Link>
              </li>
            )}

            {/* 👤 USER INFO */}
            {user && (
  <li className="nav-item ms-3 position-relative" ref={menuRef}>
    
    {/* 👤 ICONO PERFIL */}
    <div
      onClick={() => setOpenMenu(!openMenu)}
      style={{ cursor: "pointer" }}
    >
      <img
        src={profile?.photoURL || "https://via.placeholder.com/35"}
        alt="perfil"
        style={{
          width: "35px",
          height: "35px",
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e0e0e0"
        }}
      />
    </div>

    {/* 🔥 TOOLTIP / DROPDOWN */}
    {openMenu && (
      <div
        className="shadow-sm"
        style={{
          position: "absolute",
          top: "120%",
          right: 0,
          background: "white",
          border: "1px solid #e0e0e0",
          borderRadius: "10px",
          padding: "8px",
          minWidth: "160px",
          zIndex: 100
        }}
      >
        <Link
          to="/perfil"
          className="dropdown-item"
          onClick={() => setOpenMenu(false)}
        >
          👤 Ver perfil
        </Link>

        <div
          className="dropdown-item text-danger"
          style={{ cursor: "pointer" }}
          onClick={logout}
        >
          🚪 Cerrar sesión
        </div>
      </div>
    )}

  </li>
)}

          </ul>
        </div>

      </div>
    </nav>
  );
}