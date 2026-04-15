import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal.jsx";

export default function Home() {
  const { user, permissions } = useAuth();

  // 🧠 seguridad: evita undefined crashes
  const role = permissions?.role || "user";

  const canAccessDashboard =
    role === "recruiter" || role === "admin";

  return (
    <div>

      {/* HERO */}
      <section className="hero-section d-flex align-items-center text-white position-relative">
        <div className="hero-overlay" />

        <div className="container position-relative z-1 py-5">
          <div className="row">
            <div className="col-lg-7">

              <span className="badge bg-warning text-dark mb-3 px-3 py-2 rounded-pill fw-bold">
                Match Inteligente 🚀
              </span>

              <h1 className="display-3 fw-bold mb-3">
                Tu próximo gran salto profesional está aquí
              </h1>

              <p className="lead mb-4">
                Conectamos talento femenino con oportunidades reales en MiBanco.
                Sin fricción. En tiempo real.
              </p>

              {/* 🔥 BOTÓN INTELIGENTE ÚNICO */}
              {!user ? (
                <button
                  className="btn btn-warning btn-lg px-5 rounded-pill fw-bold"
                  data-bs-toggle="modal"
                  data-bs-target="#loginModal"
                >
                  Postular Ahora
                </button>
              ) : canAccessDashboard ? (
                <a
                  href="/dashboard"
                  className="btn btn-success btn-lg px-5 rounded-pill fw-bold"
                >
                  Ir al Dashboard
                </a>
              ) : (
                <button
                  className="btn btn-warning btn-lg px-5 rounded-pill fw-bold"
                  data-bs-toggle="modal"
                  data-bs-target="#loginModal"
                >
                  Postular Ahora
                </button>
              )}

              <a
                href="#vacantes"
                className="btn btn-outline-light btn-lg px-5 rounded-pill ms-3"
              >
                Ver Oportunidades
              </a>

            </div>
          </div>
        </div>
      </section>

      {/* MODAL */}
      <LoginModal />

      {/* BENEFICIOS */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center fw-bold mb-5">
            ¿Por qué usar Match Talento?
          </h2>

          <div className="row g-4 text-center">

            <div className="col-md-4">
              <div className="p-4 shadow-sm rounded-4 bg-white">
                <h4>Match Automático</h4>
                <p>IA conecta tu perfil con vacantes ideales.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 shadow-sm rounded-4 bg-white">
                <h4>Visibilidad Directa</h4>
                <p>Tu perfil llega directo a reclutadores.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="p-4 shadow-sm rounded-4 bg-white">
                <h4>Oportunidades Reales</h4>
                <p>Vacantes activas y verificadas.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}