import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function Navbar() {
  const { user, profile, permissions, loading } = useAuth();

  if (loading) return null; // 🔒 evita flicker

  const isRecruiter = permissions?.isRecruiter;
  const isAdmin = permissions?.isAdmin;

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
      <div className="container">

        {/* BRAND */}
        <Link className="navbar-brand" to="/">
          <img src="/assets/img/banco.png" height="40" />
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
              <li className="nav-item ms-3">
                <span className="badge bg-light text-dark border">
                  {profile?.name || "Usuario"}
                </span>
              </li>
            )}

          </ul>
        </div>

      </div>
    </nav>
  );
}