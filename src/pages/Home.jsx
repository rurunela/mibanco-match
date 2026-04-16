import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal.jsx";

export default function Home() {
  const { user, permissions } = useAuth();
  const role = permissions?.role || "user";
  const canAccessDashboard = role === "recruiter" || role === "admin";

  return (
    <div className="min-vh-100" style={{ background: "var(--bg)" }}>
      {/* 🚀 HERO SECTION: MODERNIDAD Y PROPÓSITO */}
      <section className="relative py-5 overflow-hidden" style={{ minHeight: "85vh", display: "flex", alignItems: "center" }}>
        {/* Decoración de fondo suave */}
        <div className="position-absolute top-0 start-50 translate-middle-x opacity-10" style={{ zIndex: 0 }}>
          <svg width="1200" height="600" viewBox="0 0 1000 500"><circle cx="500" cy="100" r="400" fill="var(--primary)" /></svg>
        </div>

        <div className="container position-relative z-1">
          <div className="row align-items-center">
            <div className="col-lg-7">
              <span className="badge bg-warning mb-3 px-3 py-2 fw-bold text-dark shadow-sm">
                N°1 en Microfinanzas de Latinoamérica
              </span>
              
              <h1 className="display-3 fw-bold mb-4" style={{ color: "var(--text)", lineHeight: "1.1" }}>
                Transformamos tu talento en <span style={{ color: "var(--accent-yellow)" }}>progreso.</span>
              </h1>

              <p className="lead mb-5" style={{ color: "var(--text-muted)", fontSize: "1.25rem" }}>
                
              </p>

              <div className="d-flex gap-3">
                {!user || !canAccessDashboard ? (
                  <button 
                    className="btn btn-warning btn-lg px-5 py-3 shadow hover-scale"
                    data-bs-toggle="modal" data-bs-target="#loginModal"
                  >
                    Postular Ahora
                  </button>
                ) : (
                  <a href="/dashboard" className="btn btn-success btn-lg px-5 py-3 shadow hover-scale">
                    Panel de Reclutamiento
                  </a>
                )}
                <a href="#vacantes" className="btn btn-outline-secondary btn-lg px-4 py-3 bg-white shadow-sm border-0">
                  Explorar Puestos
                </a>
              </div>
            </div>

            <div className="col-lg-5 d-none d-lg-block">
              <div className="card p-2 shadow-lg rotate-3">
                <img 
                  src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=600" 
                  alt="Talento Mibanco" 
                  className="rounded-4 img-fluid"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🧩 SECCIÓN DE VALORES: NEOMORFISMO APLICADO */}
      <section className="py-5">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ color: "var(--text)" }}>Nuestros Principios Culturales</h2>
            <p style={{ color: "var(--text-muted)" }}>Lo que nos define como equipo y familia.</p>
          </div>

          <div className="row g-4">
            {[
              { t: "Cuidamos", c: "var(--accent-blue)", d: "Nos interesamos de corazón por las personas para construir confianza." },
              { t: "Innomejoramos", c: "var(--primary)", d: "Innovamos para mejorar, siendo proactivos, adaptables y simples." },
              { t: "Cooperamos", c: "var(--accent-orange)", d: "Logramos resultados que perduran colaborando y asumiendo riesgos." },
              { t: "Jugamos Limpio", c: "var(--accent-red)", d: "Somos un ejemplo de integridad, actuando siempre con responsabilidad." }
            ].map((item, idx) => (
              <div className="col-md-3" key={idx}>
                <div className="card h-100 p-4 text-center">
                  <div className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center shadow-inset" 
                       style={{ width: "60px", height: "60px", background: "white" }}>
                    <div style={{ width: "15px", height: "15px", borderRadius: "50%", background: item.c }}></div>
                  </div>
                  <h5 className="fw-bold mb-3">{item.t}</h5>
                  <p className="small m-0 text-muted">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🏥 SECCIÓN DE BIENESTAR: BENEFICIOS INTEGRALES */}
      <section className="py-5" style={{ background: "linear-gradient(to bottom, transparent, #fff)" }}>
        <div className="container">
          <div className="card p-5 border-0 shadow-lg" style={{ background: "white" }}>
            <div className="row align-items-center">
              <div className="col-lg-6">
                <h2 className="fw-bold mb-4">Tu Bienestar Integral</h2>
                <p className="mb-4">Contribuimos con tu crecimiento en todos los aspectos de tu vida.</p>
                
                <div className="d-grid gap-3">
                  <div className="p-3 rounded-4 bg-light d-flex align-items-center shadow-sm">
                    <span className="me-3 fs-4">🥗</span>
                    <div><strong>Bienestar Físico:</strong> EPS y campañas de salud constantes.</div>
                  </div>
                  <div className="p-3 rounded-4 bg-light d-flex align-items-center shadow-sm">
                    <span className="me-3 fs-4">🧠</span>
                    <div><strong>Bienestar Emocional:</strong> Acompañamiento psicológico y días libres.</div>
                  </div>
                  <div className="p-3 rounded-4 bg-light d-flex align-items-center shadow-sm">
                    <span className="me-3 fs-4">💰</span>
                    <div><strong>Bienestar Financiero:</strong> Tasas preferenciales y créditos educativos.</div>
                  </div>
                </div>
              </div>
              <div className="col-lg-6 text-center pt-4 pt-lg-0">
  <div className="position-relative d-inline-block">
    
    {/* Contenedor de Partículas de Corazón */}
    <div className="position-absolute w-100 h-100 overflow-visible" style={{ zIndex: 0 }}>
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          className="heart-particle"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            animationDelay: `${Math.random() * 3}s`,
            fontSize: `${Math.random() * (1.5 - 0.8) + 0.8}rem`
          }}
        >
          ❤
        </span>
      ))}
    </div>

    {/* Círculo Principal */}
    <div 
      className="p-5 rounded-circle border border-5 d-inline-block shadow-lg position-relative bg-white" 
      style={{ 
        borderColor: "var(--primary) !important", 
        zIndex: 1,
        boxShadow: "10px 10px 20px var(--shadow-dark), -10px -10px 20px var(--shadow-light)" 
      }}
    >
      <h3 className="m-0 fw-bold" style={{ color: "var(--text)" }}>+10,000</h3>
      <p className="m-0 fw-bold text-uppercase" style={{ color: "var(--primary)", fontSize: "0.7rem", letterSpacing: "1px" }}>
        Corazones Verdes
      </p>
    </div>

  </div>
</div>
            </div>
          </div>
        </div>
      </section>

      {/* 📱 FOOTER / RRSS */}
      <footer className="py-5 text-center">
        <div className="container">
          <p className="text-muted mb-4">Síguenos en nuestras redes sociales y entérate de nuestras oportunidades</p>
          <div className="d-flex justify-content-center gap-4">
            <a href="#" className="btn p-3 shadow-sm bg-white hover-scale"><span style={{ color: "var(--accent-blue)" }}>LinkedIn</span></a>
            <a href="#" className="btn p-3 shadow-sm bg-white hover-scale"><span style={{ color: "#000" }}>TikTok</span></a>
            <a href="#" className="btn p-3 shadow-sm bg-white hover-scale"><span style={{ color: "var(--primary)" }}>Facebook</span></a>
          </div>
        </div>
      </footer>

      <LoginModal />
    </div>
  );
}