import { useAuth } from "../context/AuthContext";
import LoginModal from "../components/LoginModal.jsx";
import { useState, useEffect, useRef } from "react";

// ── Carrusel de Testimonios ──────────────────────────────────────────────────
const testimonials = [
  {
    name: "Valeria Quispe",
    role: "Analista de Créditos · Lima",
    quote:
      "Desde que ingresé a Mibanco, mi carrera ha crecido más rápido de lo que imaginé. El ambiente de colaboración y los beneficios son increíbles.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    years: "3 años en Mibanco",
  },
  {
    name: "Carlos Mendoza",
    role: "Ejecutivo de Negocios · Arequipa",
    quote:
      "Encontré no solo un trabajo, sino un propósito. Ayudar a emprendedores a crecer es lo que me apasiona, y Mibanco me da ese espacio todos los días.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    years: "5 años en Mibanco",
  },
  {
    name: "Milagros Torres",
    role: "Gestora de Recursos Humanos · Trujillo",
    quote:
      "El programa de desarrollo profesional me permitió especializarme sin costo. Aquí realmente invierten en su gente.",
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
    years: "2 años en Mibanco",
  },
  {
    name: "Diego Paredes",
    role: "Supervisor de Operaciones · Cusco",
    quote:
      "La cultura de Mibanco es única. Sentirse parte de algo que transforma vidas hace que cada día valga la pena.",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    years: "4 años en Mibanco",
  },
];

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent((idx + testimonials.length) % testimonials.length);
      setAnimating(false);
    }, 300);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => goTo(current + 1), 5500);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  const t = testimonials[current];

  return (
    <section style={{ background: "var(--bg)", padding: "80px 0" }}>
      <div className="container">
        <div className="text-center mb-5">
          <span
            style={{
              display: "inline-block",
              background: "var(--primary)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "6px 18px",
              borderRadius: "50px",
              marginBottom: "16px",
            }}
          >
            Voces de nuestro equipo
          </span>
          <h2
            style={{
              color: "var(--text)",
              fontWeight: 800,
              fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
              marginBottom: 0,
            }}
          >
            Historias que nos inspiran
          </h2>
        </div>

        {/* Card carrusel */}
        <div
          style={{
            maxWidth: 780,
            margin: "0 auto",
            position: "relative",
          }}
        >
          <div
            className="card"
            style={{
              padding: "48px 52px",
              opacity: animating ? 0 : 1,
              transform: animating ? "translateY(12px)" : "translateY(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              borderRadius: "24px",
            }}
          >
            {/* Comillas decorativas */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 24,
                left: 40,
                fontSize: "6rem",
                lineHeight: 1,
                color: "var(--primary)",
                opacity: 0.12,
                fontFamily: "Georgia, serif",
                userSelect: "none",
              }}
            >
              "
            </span>

            <p
              style={{
                fontSize: "1.15rem",
                lineHeight: 1.75,
                color: "var(--text)",
                fontStyle: "italic",
                marginBottom: "28px",
                position: "relative",
                zIndex: 1,
              }}
            >
              {t.quote}
            </p>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <img
                src={t.avatar}
                alt={t.name}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: "50%",
                  border: "3px solid var(--primary)",
                  objectFit: "cover",
                }}
              />
              <div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    color: "var(--text)",
                    fontSize: "1rem",
                  }}
                >
                  {t.name}
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.82rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {t.role}
                </p>
              </div>
              <span
                style={{
                  marginLeft: "auto",
                  background: "var(--accent-yellow)",
                  color: "#000",
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  padding: "4px 12px",
                  borderRadius: "50px",
                }}
              >
                {t.years}
              </span>
            </div>
          </div>

          {/* Controles */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 10,
              marginTop: 28,
            }}
          >
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Ir al testimonio ${i + 1}`}
                style={{
                  width: i === current ? 28 : 10,
                  height: 10,
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: i === current ? "var(--primary)" : "#cbd5e1",
                  transition: "all 0.3s ease",
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Stats bar ────────────────────────────────────────────────────────────────
const stats = [
  { value: "+10,000", label: "Colaboradores" },
  { value: "N°1", label: "Microfinanzas LATAM" },
  { value: "20+", label: "Años de experiencia" },
  { value: "98%", label: "Satisfacción interna" },
];

// ── Componente principal ─────────────────────────────────────────────────────
export default function Home() {
  const { user, permissions } = useAuth();
  const role = permissions?.role || "user";
  const canAccessDashboard = role === "recruiter" || role === "admin";

  return (
    <div className="min-vh-100" style={{ background: "var(--bg)" }}>

      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "90vh",
          display: "flex",
          alignItems: "center",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #f0fdf4 0%, #f4f7fb 50%, #fffbeb 100%)",
        }}
      >
        {/* Blob verde fondo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: "-120px",
            right: "-180px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,147,48,0.12) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />
        {/* Blob amarillo */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-100px",
            width: "420px",
            height: "420px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,206,0,0.15) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />

        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">

            {/* Texto */}
            <div className="col-lg-6">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(0,147,48,0.1)",
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  padding: "8px 18px",
                  borderRadius: "50px",
                  marginBottom: "20px",
                  border: "1px solid rgba(0,147,48,0.2)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    animation: "pulse 2s infinite",
                  }}
                />
                N°1 en Microfinanzas de Latinoamérica
              </span>

              <h1
                style={{
                  fontWeight: 900,
                  fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                  lineHeight: 1.08,
                  color: "var(--text)",
                  marginBottom: "24px",
                  letterSpacing: "-1px",
                }}
              >
                Transformamos tu talento en{" "}
                <span
                  style={{
                    color: "var(--primary)",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  progreso.
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      bottom: -4,
                      left: 0,
                      right: 0,
                      height: 4,
                      borderRadius: 4,
                      background: "var(--accent-yellow)",
                    }}
                  />
                </span>
              </h1>

              <p
                style={{
                  fontSize: "1.15rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.8,
                  marginBottom: "36px",
                  maxWidth: 500,
                }}
              >
                Únete a la institución financiera más grande de microcréditos en América Latina. 
                Aquí tu crecimiento profesional y personal es nuestra misión. 
                Miles de oportunidades te esperan — da el primer paso hoy.
              </p>

              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {!user || !canAccessDashboard ? (
                  <button
                    className="btn btn-warning btn-lg px-5 py-3 shadow hover-scale"
                    data-bs-toggle="modal"
                    data-bs-target="#loginModal"
                    style={{
                      fontWeight: 700,
                      letterSpacing: "0.3px",
                      fontSize: "1rem",
                    }}
                  >
                    🚀 Postular Ahora
                  </button>
                ) : (
                  <a
                    href="/dashboard"
                    className="btn btn-success btn-lg px-5 py-3 shadow hover-scale"
                    style={{ fontWeight: 700 }}
                  >
                    Panel de Reclutamiento
                  </a>
                )}
                <a
  href="/vacantes"
  className="btn btn-outline-secondary btn-lg px-4 py-3 bg-white shadow-sm"
  style={{
    fontWeight: 600,
    border: "2px solid #e2e8f0",
    color: "var(--text)",
  }}
>
  Ver vacantes
</a>
              </div>

              {/* Social proof mini */}
              <div
                style={{
                  marginTop: 36,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex" }}>
                  {[
                    "https://randomuser.me/api/portraits/men/11.jpg",
                    "https://randomuser.me/api/portraits/women/22.jpg",
                    "https://randomuser.me/api/portraits/men/33.jpg",
                  ].map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "2px solid white",
                        marginLeft: i > 0 ? -10 : 0,
                        objectFit: "cover",
                      }}
                    />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text)" }}>+500 postulantes</strong> se unieron este mes
                </p>
              </div>
            </div>

            {/* Imagen con badges flotantes */}
            <div className="col-lg-6 d-none d-lg-block">
              <div style={{ position: "relative", display: "inline-block", width: "100%" }}>
                <div
                  className="card"
                  style={{
                    padding: "10px",
                    transform: "rotate(-2deg)",
                    borderRadius: 24,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=700"
                    alt="Talento Mibanco"
                    style={{ borderRadius: 18, width: "100%", display: "block" }}
                  />
                </div>

                {/* Badge flotante 1 */}
                <div
                  style={{
                    position: "absolute",
                    top: -16,
                    right: -16,
                    background: "var(--accent-yellow)",
                    borderRadius: 16,
                    padding: "12px 18px",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    textAlign: "center",
                    transform: "rotate(4deg)",
                  }}
                >
                  <p style={{ margin: 0, fontWeight: 900, fontSize: "1.4rem", color: "#000" }}>
                    98%
                  </p>
                  <p style={{ margin: 0, fontSize: "0.68rem", fontWeight: 700, color: "#333" }}>
                    Satisfacción
                  </p>
                </div>

                {/* Badge flotante 2 */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: -20,
                    background: "white",
                    borderRadius: 16,
                    padding: "14px 20px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    transform: "rotate(-3deg)",
                  }}
                >
                  <span style={{ fontSize: "1.6rem" }}>🏆</span>
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.85rem", color: "var(--text)" }}>
                      Mejor lugar
                    </p>
                    <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                      para trabajar 2024
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: "var(--primary)",
          padding: "36px 0",
        }}
      >
        <div className="container">
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            {stats.map((s, i) => (
              <div key={i} style={{ textAlign: "center", minWidth: 120 }}>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 900,
                    fontSize: "2rem",
                    color: "var(--accent-yellow)",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </p>
                <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.85rem", marginTop: 4 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRINCIPIOS CULTURALES ─────────────────────────────────────────── */}
      <section style={{ padding: "90px 0", background: "var(--bg)" }}>
        <div className="container">
          <div className="text-center mb-5">
            <span
              style={{
                display: "inline-block",
                background: "rgba(0,147,48,0.1)",
                color: "var(--primary)",
                fontWeight: 700,
                fontSize: "0.75rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
                padding: "6px 18px",
                borderRadius: "50px",
                marginBottom: 14,
              }}
            >
              ADN Mibanco
            </span>
            <h2
              style={{
                fontWeight: 800,
                fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              Nuestros Principios Culturales
            </h2>
            <p style={{ color: "var(--text-muted)", maxWidth: 480, margin: "0 auto" }}>
              Lo que nos define como equipo y familia. Estos valores guían cada
              decisión que tomamos.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                t: "Cuidamos",
                c: "var(--accent-blue)",
                icon: "💙",
                d: "Nos interesamos de corazón por las personas para construir confianza duradera en cada relación.",
              },
              {
                t: "Innomejoramos",
                c: "var(--primary)",
                icon: "🌱",
                d: "Innovamos para mejorar, siendo proactivos, adaptables y simples en todo lo que hacemos.",
              },
              {
                t: "Cooperamos",
                c: "var(--accent-orange)",
                icon: "🤝",
                d: "Logramos resultados que perduran colaborando, asumiendo riesgos con responsabilidad.",
              },
              {
                t: "Jugamos Limpio",
                c: "var(--accent-red)",
                icon: "⚖️",
                d: "Somos un ejemplo de integridad, actuando siempre con transparencia y responsabilidad.",
              },
            ].map((item, idx) => (
              <div className="col-md-6 col-lg-3" key={idx}>
                <div
                  className="card h-100"
                  style={{
                    padding: "36px 28px",
                    textAlign: "center",
                    borderTop: `4px solid ${item.c}`,
                    borderRadius: "20px",
                    transition: "all 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "2.4rem",
                      marginBottom: 16,
                      lineHeight: 1,
                    }}
                  >
                    {item.icon}
                  </div>
                  <h5
                    style={{
                      fontWeight: 800,
                      color: "var(--text)",
                      marginBottom: 12,
                      fontSize: "1.1rem",
                    }}
                  >
                    {item.t}
                  </h5>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", lineHeight: 1.7, margin: 0 }}>
                    {item.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CARRUSEL DE TESTIMONIOS ───────────────────────────────────────── */}
      <TestimonialCarousel />

      {/* ─── BIENESTAR INTEGRAL ────────────────────────────────────────────── */}
      <section style={{ padding: "90px 0", background: "white" }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: "60px",
              borderRadius: 28,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Decoración */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -60,
                right: -60,
                width: 280,
                height: 280,
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0,147,48,0.07) 0%, transparent 70%)",
              }}
            />

            <div className="row align-items-center g-5">
              <div className="col-lg-6">
                <span
                  style={{
                    display: "inline-block",
                    background: "rgba(0,147,48,0.1)",
                    color: "var(--primary)",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    padding: "6px 18px",
                    borderRadius: "50px",
                    marginBottom: 16,
                  }}
                >
                  Beneficios para ti
                </span>
                <h2
                  style={{
                    fontWeight: 800,
                    fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                    color: "var(--text)",
                    marginBottom: 12,
                  }}
                >
                  Tu Bienestar Integral
                </h2>
                <p style={{ color: "var(--text-muted)", marginBottom: 28, lineHeight: 1.7 }}>
                  Contribuimos con tu crecimiento en todos los aspectos de tu vida. 
                  Porque cuando tú creces, Mibanco crece contigo.
                </p>

                <div style={{ display: "grid", gap: 14 }}>
                  {[
                    {
                      icon: "🥗",
                      title: "Bienestar Físico",
                      desc: "EPS y campañas de salud constantes para ti y tu familia.",
                      color: "var(--primary)",
                    },
                    {
                      icon: "🧠",
                      title: "Bienestar Emocional",
                      desc: "Acompañamiento psicológico gratuito y días libres adicionales.",
                      color: "var(--accent-blue)",
                    },
                    {
                      icon: "💰",
                      title: "Bienestar Financiero",
                      desc: "Tasas preferenciales, créditos educativos y préstamos especiales.",
                      color: "var(--accent-orange)",
                    },
                  ].map((b, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px 20px",
                        borderRadius: 16,
                        background: "var(--bg)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                        boxShadow: "4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light)",
                      }}
                    >
                      <span style={{ fontSize: "1.5rem", lineHeight: 1, flexShrink: 0 }}>{b.icon}</span>
                      <div>
                        <strong style={{ color: "var(--text)", fontSize: "0.95rem" }}>{b.title}</strong>
                        <p style={{ margin: "4px 0 0", fontSize: "0.83rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
                          {b.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-lg-6 text-center">
                <div
                  style={{
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  {/* Partículas de corazón */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "visible",
                      zIndex: 0,
                    }}
                  >
                    {[...Array(8)].map((_, i) => (
                      <span
                        key={i}
                        className="heart-particle"
                        style={{
                          left: `${(i * 13 + 5) % 80 + 10}%`,
                          animationDelay: `${i * 0.4}s`,
                          fontSize: `${0.8 + (i % 3) * 0.35}rem`,
                        }}
                      >
                        ❤
                      </span>
                    ))}
                  </div>

                  {/* Círculo decorativo externo */}
                  <div
                    style={{
                      width: 220,
                      height: 220,
                      borderRadius: "50%",
                      border: "2px dashed rgba(0,147,48,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto",
                      animation: "spin 30s linear infinite",
                      position: "relative",
                      zIndex: 0,
                    }}
                  >
                    {/* Círculo principal */}
                    <div
                      style={{
                        width: 180,
                        height: 180,
                        borderRadius: "50%",
                        background: "var(--bg)",
                        boxShadow:
                          "12px 12px 24px var(--shadow-dark), -12px -12px 24px var(--shadow-light)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1,
                        position: "relative",
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontWeight: 900,
                          fontSize: "2rem",
                          color: "var(--text)",
                        }}
                      >
                        +10,000
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--primary)",
                          fontSize: "0.65rem",
                          letterSpacing: "1.5px",
                          textAlign: "center",
                          padding: "0 16px",
                        }}
                      >
                        Corazones Verdes
                      </p>
                    </div>
                  </div>

                  {/* Stats satélites */}
                  {[
                    { label: "Beneficios", value: "20+", top: -10, right: -30 },
                    { label: "Países", value: "3", bottom: 0, left: -20 },
                  ].map((st, i) => (
                    <div
                      key={i}
                      style={{
                        position: "absolute",
                        ...(st.top !== undefined ? { top: st.top } : { bottom: st.bottom }),
                        ...(st.right !== undefined ? { right: st.right } : { left: st.left }),
                        background: "white",
                        borderRadius: 12,
                        padding: "10px 16px",
                        boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
                        textAlign: "center",
                        zIndex: 2,
                      }}
                    >
                      <p style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem", color: "var(--primary)" }}>
                        {st.value}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--text-muted)" }}>
                        {st.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "90px 0",
          background: "linear-gradient(135deg, var(--primary) 0%, #007a28 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,206,0,0.08)",
          }}
        />
        <div className="container text-center" style={{ position: "relative", zIndex: 1 }}>
          <h2
            style={{
              fontWeight: 900,
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              color: "white",
              marginBottom: 16,
              letterSpacing: "-0.5px",
            }}
          >
            Tu próxima oportunidad{" "}
            <span style={{ color: "var(--accent-yellow)" }}>te espera.</span>
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "1.1rem",
              maxWidth: 520,
              margin: "0 auto 36px",
              lineHeight: 1.7,
            }}
          >
            Forma parte del equipo que está transformando las microfinanzas en
            Latinoamérica. Postula hoy y sé parte del cambio.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {!user || !canAccessDashboard ? (
              <button
                className="btn btn-warning btn-lg px-5 py-3 shadow hover-scale"
                data-bs-toggle="modal"
                data-bs-target="#loginModal"
                style={{ fontWeight: 700, fontSize: "1rem" }}
              >
                🚀 Postular Ahora
              </button>
            ) : (
              <a
                href="/dashboard"
                className="btn btn-light btn-lg px-5 py-3 shadow hover-scale"
                style={{ fontWeight: 700, color: "var(--primary)" }}
              >
                Panel de Reclutamiento
              </a>
            )}
            <a
  href="/vacantes"
  className="btn btn-outline-light btn-lg px-4 py-3 hover-scale"
  style={{ fontWeight: 600 }}
>
  Ver vacantes disponibles
</a>
          </div>
        </div>
      </section>

      {/* ─── REDES SOCIALES ────────────────────────────────────────────────── */}
      <footer style={{ padding: "50px 0 30px", textAlign: "center", background: "var(--bg)" }}>
        <div className="container">
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: "0.95rem" }}>
            Síguenos en nuestras redes sociales y entérate de nuestras oportunidades
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "LinkedIn", color: "var(--accent-blue)", icon: "in" },
              { label: "TikTok", color: "#000", icon: "TK" },
              { label: "Facebook", color: "var(--primary)", icon: "f" },
            ].map((s, i) => (
              <a
                key={i}
                href="#"
                className="btn bg-white shadow-sm hover-scale"
                style={{
                  padding: "10px 24px",
                  borderRadius: 12,
                  fontWeight: 700,
                  color: s.color,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  textDecoration: "none",
                }}
              >
                <span
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: s.color,
                    color: "white",
                    fontSize: "0.6rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                  }}
                >
                  {s.icon}
                </span>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </footer>

      <LoginModal />

      {/* Keyframes extras */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
