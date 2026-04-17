import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext"; // 👈 IMPORTANTE: Agregado
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "../styles/Navbar.css";
import logoBanco from "../assets/banco.png";

export default function Navbar() {
  const { user, profile, permissions, loading, logout } = useAuth();
  const { unreadCount } = useNotifications(); // 👈 IMPORTANTE: Extraído del context

  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef();
  
  const isRecruiter = permissions?.isRecruiter;
  const isAdmin = permissions?.isAdmin;

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

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
              <Link className="nav-link" to="/">Inicio</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/vacantes">Vacantes</Link>
            </li>

            {/* 🔥 SOLO RECRUITER O ADMIN */}
            {isRecruiter && (
              <li className="nav-item">
                <Link className="nav-link text-mibanco-green fw-bold" to="/dashboard">
                  Portal RRHH
                </Link>
              </li>
            )}

            {/* 🧠 SOLO ADMIN */}
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link text-warning fw-bold" to="/admin">
                  Admin Panel
                </Link>
              </li>
            )}

            {/* 👤 USER INFO & DROPDOWN */}
            {user && (
              <li className="nav-item ms-3 position-relative" ref={menuRef}>
                
                {/* ICONO PERFIL CON INDICADOR DE NOTIF */}
                <div
                  onClick={() => setOpenMenu(!openMenu)}
                  className="position-relative"
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
                  {/* Punto rojo pequeño sobre la foto si hay notificaciones */}
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                      <span className="visually-hidden">New alerts</span>
                    </span>
                  )}
                </div>

                {/* 🛠️ DROPDOWN MENU */}
                {openMenu && (
                  <div className="shadow-sm" style={{
                    position: "absolute", top: "120%", right: 0, background: "white",
                    border: "1px solid #e0e0e0", borderRadius: "10px", padding: "8px",
                    minWidth: "190px", zIndex: 100
                  }}>
                    <Link to="/perfil" className="dropdown-item" onClick={() => setOpenMenu(false)}>
                      👤 Ver perfil
                    </Link>

                    {/* 🔔 NOTIFICACIONES */}
                    <Link to="/notificaciones" className="dropdown-item d-flex justify-content-between align-items-center" onClick={() => setOpenMenu(false)}>
                      <span>🔔 Notificaciones</span>
                      {unreadCount > 0 && (
                        <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px' }}>
                          {unreadCount}
                        </span>
                      )}
                    </Link>


                    <hr className="my-2" />

                    <div className="dropdown-item text-danger" style={{ cursor: "pointer" }} onClick={logout}>
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