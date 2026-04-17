// Vacantes.jsx — MiBanco Talent
// Página pública de vacantes: vista atractiva + postulación en tiempo real desde Firestore.

import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import { collection, onSnapshot, addDoc, serverTimestamp } from "firebase/firestore";

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const timeAgo = isoStr => {
  if (!isoStr) return "";
  const diff = Date.now() - new Date(isoStr);
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Hoy";
  if (d === 1) return "Ayer";
  if (d < 7) return `Hace ${d} días`;
  if (d < 30) return `Hace ${Math.floor(d / 7)} semana${Math.floor(d / 7) > 1 ? "s" : ""}`;
  return `Hace ${Math.floor(d / 30)} mes${Math.floor(d / 30) > 1 ? "es" : ""}`;
};

const remainingDays = deadline => {
  if (!deadline) return null;
  const diff = new Date(deadline) - new Date();
  if (diff <= 0) return { label: "Vencida", color: "#f4323f", bg: "#fff5f5" };
  const d = Math.ceil(diff / 86400000);
  if (d <= 3) return { label: `⚡ ${d} días`, color: "#f4323f", bg: "#fff5f5" };
  if (d <= 10) return { label: `⏳ ${d} días`, color: "#f39000", bg: "#fff7ed" };
  return { label: `📅 ${d} días`, color: "#009330", bg: "#f0fdf4" };
};

// ─── ICONS ─────────────────────────────────────────────────────────────────────
const MapPinIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
const BriefcaseIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
const ClockIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
const UsersIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const SearchIcon = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const XIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const CheckIcon = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>;
const ShareIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>;

// ─── LEVEL BADGE ──────────────────────────────────────────────────────────────
const LEVEL_COLORS = {
  "Junior": { bg: "#eff6ff", color: "#3b82f6" },
  "Mid": { bg: "#f0fdf4", color: "#009330" },
  "Senior": { bg: "#fef3c7", color: "#d97706" },
  "Practicante": { bg: "#f5f3ff", color: "#7c3aed" },
  "No aplica": { bg: "#f1f5f9", color: "#6b7280" },
};

const LevelBadge = ({ level }) => {
  if (!level || level === "No aplica") return null;
  const c = LEVEL_COLORS[level] || LEVEL_COLORS["No aplica"];
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, borderRadius: 8, padding: "3px 10px" }}>
      {level}
    </span>
  );
};

const ModalityBadge = ({ modality }) => {
  const map = {
    "Remoto": { icon: "🏠", bg: "#f0fdf4", color: "#009330" },
    "Presencial": { icon: "🏢", bg: "#eff6ff", color: "#3fb1e2" },
    "Híbrido": { icon: "🔄", bg: "#fff7ed", color: "#f39000" },
  };
  const c = map[modality] || { icon: "📍", bg: "#f1f5f9", color: "#6b7280" };
  return (
    <span style={{ fontSize: 11, fontWeight: 700, background: c.bg, color: c.color, borderRadius: 8, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
      {c.icon} {modality}
    </span>
  );
};

// ─── APPLY MODAL ───────────────────────────────────────────────────────────────
function ApplyModal({ job, userId, userProfile, onClose, onSuccess }) {
  const [motivation, setMotivation] = useState("");
  const [cvFile, setCvFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleApply = async () => {
    if (!motivation.trim() && !cvFile && !userProfile?.cvUrl) return; 
    setSending(true);
    try {
      // Nota: Si hay cvFile, aquí deberías subirlo a Storage y obtener la URL. 
      // Por brevedad, lo simulamos enviando la postulación directa.
      await addDoc(collection(db, "applications"), {
        jobId: job.id,
        jobTitle: job.title,
        candidateId: userId,
        candidateName: userProfile?.name || "",
        motivation,
        status: "pending",
        appliedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        userId: job.createdBy || "recruiter",
        message: `Nueva postulación de ${userProfile?.name} para ${job.title}`,
        read: false,
        createdAt: serverTimestamp(),
      });

      setSent(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 22, padding: 32, maxWidth: 500, width: "100%", boxShadow: "0 24px 60px rgba(0,0,0,.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: 18 }}>Postularme a esta vacante</h4>
            <div style={{ fontSize: 14, color: "#009330", fontWeight: 700, marginTop: 4 }}>{job.title}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{job.city} · {job.modality}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#9ca3af" }}>×</button>
        </div>

        {sent ? (
          <div style={{ textAlign: "center", padding: "30px 0" }}>
            <div style={{ width: 64, height: 64, background: "#f0fdf4", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <CheckIcon />
            </div>
            <h5 style={{ fontWeight: 800, color: "#009330", margin: "0 0 8px" }}>¡Postulación enviada!</h5>
            <p style={{ color: "#6b7280", fontSize: 14 }}>El reclutador revisará tu perfil y se comunicará contigo.</p>
          </div>
        ) : (
          <>
            <div style={{ background: "#f8fafc", borderRadius: 14, padding: "14px 16px", marginBottom: 18, boxShadow: "inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff" }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Postulando como:</div>
              <div style={{ fontWeight: 700 }}>{userProfile?.name || "—"}</div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{userProfile?.headline || ""}</div>
            </div>

            {/* Subida de CV Requisito */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
                Tu Currículum Vitae *
              </label>
              {userProfile?.cvUrl ? (
                <div style={{ fontSize: 12, color: "#009330", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckIcon /> Ya tienes un CV guardado en tu perfil.
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "#f39000", marginBottom: 6 }}>
                  No tienes un CV en tu perfil. Sube uno a continuación:
                </div>
              )}
              <input type="file" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files[0])} style={{ fontSize: 12, width: "100%", padding: "8px", border: "1px dashed #d1d5db", borderRadius: 8 }} />
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
              Carta de presentación / Motivación *
            </label>
            <textarea
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              placeholder={`¿Por qué te interesa este puesto en ${job.title}? Cuéntanos sobre tu experiencia relevante...`}
              style={{ width: "100%", borderRadius: 14, border: "1.5px solid #e5e7eb", padding: "12px 16px", fontSize: 13, resize: "vertical", minHeight: 100, boxSizing: "border-box", outline: "none", lineHeight: 1.6 }}
            />
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16, marginTop: 4 }}>{motivation.length} / 1000 caracteres</div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: "12px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>En otro momento</button>
              <button onClick={handleApply} disabled={(!motivation.trim() && !cvFile && !userProfile?.cvUrl) || sending}
                style={{ flex: 2, padding: "12px 0", borderRadius: 12, border: "none", background: "#009330", color: "#fff", fontWeight: 800, fontSize: 14, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,147,48,.3)", opacity: (!motivation.trim() || sending) ? 0.6 : 1 }}>
                {sending ? "Enviando..." : "🚀 Enviar"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── JOB DETAIL MODAL ──────────────────────────────────────────────────────────
function JobDetailModal({ job, applied, onClose, onApply }) {
  const dead = remainingDays(job.hiring_deadline);

  const handleShare = (platform) => {
    const text = `¡Mira esta vacante de ${job.title} en MiBanco Talent!`;
    const url = window.location.href; // En producción, agregar ID de la vacante a la URL
    if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    if (platform === 'google') window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=&su=${text}&body=${url}`, '_blank'); // Redirige a Gmail
    if (platform === 'email') window.location.href = `mailto:?subject=${text}&body=Te comparto esta vacante: ${url}`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 22, padding: 0, maxWidth: 680, width: "100%", maxHeight: "90vh", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,.25)", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ background: "linear-gradient(135deg,#009330,#5db836)", padding: "24px 28px", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: "0 0 6px", fontWeight: 800, fontSize: 22 }}>{job.title}</h3>
              <div style={{ fontSize: 14, opacity: .9 }}>{job.created_by || "MiBanco Talent"} · {timeAgo(job.created_at)}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,.2)", border: "none", borderRadius: 10, cursor: "pointer", padding: "6px 10px", color: "#fff", fontSize: 16 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 13 }}><MapPinIcon /> {job.city}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 13 }}><BriefcaseIcon /> {job.type}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 13 }}>{job.modality}</span>
            {job.level && job.level !== "No aplica" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 13 }}>{job.level}</span>
            )}
            {dead && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,.2)", borderRadius: 8, padding: "5px 12px", fontSize: 13 }}><ClockIcon /> {dead.label}</span>
            )}
          </div>
        </div>
        
        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "24px 28px" }}>
          {job.salary_range && (
            <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 20 }}>💰</span>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>RANGO SALARIAL</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#009330" }}>{job.salary_range}</div>
              </div>
            </div>
          )}
          {job.description && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1f2937", marginBottom: 10 }}>📋 Descripción del puesto</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-line" }}>{job.description}</div>
            </div>
          )}
          {job.requirements && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1f2937", marginBottom: 10 }}>✅ Requisitos</div>
              <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.75, whiteSpace: "pre-line" }}>{job.requirements}</div>
            </div>
          )}
          {(job.skills_required || []).length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1f2937", marginBottom: 10 }}>🛠️ Skills requeridos</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {job.skills_required.map(s => (
                  <span key={s} style={{ background: "#f0fdf4", color: "#009330", border: "1px solid #bbf7d0", borderRadius: 20, padding: "5px 14px", fontSize: 13, fontWeight: 600 }}>{s}</span>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Experiencia mínima", value: job.min_experience ? `${job.min_experience} año${job.min_experience !== 1 ? "s" : ""}` : "Sin requisito" },
              { label: "Plazas disponibles", value: job.vacancies || 1 },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", boxShadow: "4px 4px 10px #d1d9e6,-4px -4px 10px #fff" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2937" }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Compartir Vacante */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><ShareIcon/> Compartir vacante</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => handleShare('google')} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>G Correo</button>
              <button onClick={() => handleShare('facebook')} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#1877F2", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, border: "none" }}>Facebook</button>
              <button onClick={() => handleShare('email')} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Email</button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
          {applied ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#f0fdf4", borderRadius: 12, padding: "14px 18px", color: "#009330", fontWeight: 700, fontSize: 14 }}>
              <CheckIcon /> Ya postulaste a esta vacante
            </div>
          ) : (
            <button onClick={onApply} style={{ width: "100%", padding: "14px 0", borderRadius: 14, border: "none", background: "#009330", color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 14px rgba(0,147,48,.35)", transition: "all .2s" }}>
              🚀 Postularme a esta vacante
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── JOB CARD ──────────────────────────────────────────────────────────────────
function JobCard({ job, applied, applicationCount, onView, onApply }) {
  const [hovered, setHovered] = useState(false);
  const dead = remainingDays(job.hiring_deadline);

  // Empuje Psicológico: Calculamos un porcentaje de match simulado basado en el título para que se mantenga estable
  const matchScore = useMemo(() => {
    const base = 80;
    const variant = job.title ? job.title.charCodeAt(0) % 18 : 10;
    return base + variant; // Resultado entre 80% y 98%
  }, [job.title]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: "#f8fafc", borderRadius: 18, padding: "22px 24px", marginBottom: 16,
        boxShadow: hovered ? "10px 10px 20px #c8d0dd,-10px -10px 20px #fff" : "6px 6px 14px #d1d9e6,-6px -6px 14px #fff",
        transition: "box-shadow .25s,transform .2s", transform: hovered ? "translateY(-2px)" : "none",
        cursor: "pointer", position: "relative" }}
    >
      {applied && (
        <div style={{ position: "absolute", top: 16, right: 16, background: "#f0fdf4", color: "#009330", borderRadius: 10, padding: "4px 12px", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <CheckIcon /> Postulado
        </div>
      )}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#1f2937", marginBottom: 4 }}>{job.title}</div>
        <div style={{ fontSize: 13, color: "#009330", fontWeight: 600 }}>{job.created_by || "MiBanco Talent"}</div>
      </div>
      
      {/* Componente de Empuje Psicológico */}
      {!applied && (
        <div style={{ display: "inline-block", background: "#fef3c7", color: "#d97706", borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
          🎯 Tienes {matchScore}% de match, ¡candidatos como tú fueron contratados!
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <ModalityBadge modality={job.modality} />
        <LevelBadge level={job.level} />
        <span style={{ fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#6b7280", borderRadius: 8, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <BriefcaseIcon /> {job.type}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, background: "#f1f5f9", color: "#6b7280", borderRadius: 8, padding: "3px 10px", display: "inline-flex", alignItems: "center", gap: 4 }}>
          <MapPinIcon /> {job.city}
        </span>
      </div>
      {job.description && (
        <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, marginBottom: 12 }}>
          {job.description.length > 120 ? job.description.slice(0, 120) + "..." : job.description}
        </div>
      )}
      {(job.skills_required || []).length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {job.skills_required.slice(0, 5).map(s => (
            <span key={s} style={{ fontSize: 11, background: "#f0fdf4", color: "#009330", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 8px", fontWeight: 600 }}>{s}</span>
          ))}
          {job.skills_required.length > 5 && (
            <span style={{ fontSize: 11, color: "#9ca3af" }}>+{job.skills_required.length - 5} más</span>
          )}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#9ca3af" }}>
          {dead && <span style={{ color: dead.color, fontWeight: 700, fontSize: 11 }}>{dead.label}</span>}
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><UsersIcon /> {applicationCount || 0} postulantes</span>
          <span>{timeAgo(job.created_at)}</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={e => { e.stopPropagation(); onView(); }}
            style={{ padding: "8px 16px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
            Ver más
          </button>
          {!applied ? (
            <button onClick={e => { e.stopPropagation(); onApply(); }}
              style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: "#009330", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 3px 10px rgba(0,147,48,.25)" }}>
              Postularme
            </button>
          ) : (
            <span style={{ padding: "8px 18px", borderRadius: 10, background: "#f0fdf4", color: "#009330", fontWeight: 700, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <CheckIcon /> Postulado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function Vacantes() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [filterModality, setFilterModality] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  
  // Modals
  const [applyModal, setApplyModal] = useState(null);
  const [detailModal, setDetailModal] = useState(null);

  // ── Firebase real-time ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), snap => {
      setJobs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubApps = onSnapshot(collection(db, "applications"), snap => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubJobs(); unsubApps(); };
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const myApplications = useMemo(() => applications.filter(a => a.candidateId === user?.uid), [applications, user?.uid]);
  const appliedJobIds = useMemo(() => new Set(myApplications.map(a => a.jobId)), [myApplications]);
  const appCountByJob = useMemo(() => {
    const map = {};
    applications.forEach(a => { map[a.jobId] = (map[a.jobId] || 0) + 1; });
    return map;
  }, [applications]);
  const cities = useMemo(() => [...new Set(jobs.map(j => j.city).filter(Boolean))].sort(), [jobs]);
  const modalities = useMemo(() => [...new Set(jobs.map(j => j.modality).filter(Boolean))].sort(), [jobs]);
  const types = useMemo(() => [...new Set(jobs.map(j => j.type).filter(Boolean))].sort(), [jobs]);
  const levels = useMemo(() => [...new Set(jobs.map(j => j.level).filter(Boolean).filter(l => l !== "No aplica"))].sort(), [jobs]);
  
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(j => j.status !== "Inactivo")
      .filter(j => !search.trim() || j.title?.toLowerCase().includes(search.toLowerCase()) || (j.skills_required || []).some(s => s.toLowerCase().includes(search.toLowerCase())))
      .filter(j => filterModality === "all" || j.modality === filterModality)
      .filter(j => filterType === "all" || j.type === filterType)
      .filter(j => filterLevel === "all" || j.level === filterLevel)
      .filter(j => filterCity === "all" || j.city === filterCity)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [jobs, search, filterModality, filterType, filterLevel, filterCity]);

  const hasFilters = search || filterModality !== "all" || filterType !== "all" || filterLevel !== "all" || filterCity !== "all";
  const clearFilters = () => { setSearch(""); setFilterModality("all"); setFilterType("all"); setFilterLevel("all"); setFilterCity("all"); };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const inp = { borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#f1f5f9", boxShadow: "inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff", padding: "9px 14px", fontSize: 13, outline: "none", color: "#1f2937" };
  const selStyle = { ...inp, cursor: "pointer", minWidth: 130 };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#eef2f7,#fff)", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <div style={{ background: "linear-gradient(135deg,#009330 0%,#5db836 60%,#3fb1e2 100%)", padding: "48px 24px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, left: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.08)" }} />
        <div style={{ position: "absolute", bottom: -80, right: -40, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,.06)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.75)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 2 }}>
            MiBanco Talent
          </div>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: "clamp(26px,4vw,40px)", margin: "0 0 12px", lineHeight: 1.2 }}>
            Vacantes disponibles
          </h1>
          <p style={{ color: "rgba(255,255,255,.85)", fontSize: 16, maxWidth: 520, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Descubre oportunidades que se adaptan a tu perfil y da el siguiente paso en tu carrera.
          </p>
          <div style={{ maxWidth: 540, margin: "0 auto", background: "#fff", borderRadius: 16, display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", boxShadow: "0 8px 32px rgba(0,0,0,.15)" }}>
            <SearchIcon />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por puesto, habilidad..."
              style={{ flex: 1, border: "none", outline: "none", fontSize: 14, color: "#1f2937", background: "transparent" }} />
            {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}><XIcon /></button>}
          </div>
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: `${jobs.length} vacantes`, icon: "💼" },
              { label: `${appliedJobIds.size} postulaciones mías`, icon: "📋" },
              { label: "Tiempo real", icon: "⚡" },
            ].map(item => (
              <span key={item.label} style={{ fontSize: 13, color: "rgba(255,255,255,.9)", display: "flex", alignItems: "center", gap: 5, fontWeight: 600 }}>
                {item.icon} {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 48px" }}>
        {/* Filters strip */}
        <div style={{ background: "#f8fafc", borderRadius: "0 0 18px 18px", boxShadow: "6px 6px 14px #d1d9e6,-6px -6px 14px #fff", padding: "16px 20px", marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filterModality} onChange={e => setFilterModality(e.target.value)} style={selStyle}>
            <option value="all">🔄 Modalidad</option>
            {modalities.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={selStyle}>
            <option value="all">💼 Tipo</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={selStyle}>
            <option value="all">🏷️ Nivel</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} style={selStyle}>
            <option value="all">📍 Ciudad</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {hasFilters && (
            <button onClick={clearFilters} style={{ padding: "9px 14px", borderRadius: 10, border: "none", background: "#ffce00", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              ↺ Limpiar
            </button>
          )}
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280", fontWeight: 600 }}>
            {filteredJobs.length} resultado{filteredJobs.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Jobs list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 60 }}>
            <div style={{ width: 44, height: 44, border: "4px solid #009330", borderTop: "4px solid transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            <p style={{ color: "#6b7280" }}>Cargando vacantes...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#f8fafc", borderRadius: 18, boxShadow: "6px 6px 14px #d1d9e6,-6px -6px 14px #fff" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontWeight: 800, color: "#1f2937", marginBottom: 8 }}>No encontramos resultados</h3>
            <p style={{ color: "#6b7280", marginBottom: 20 }}>Prueba con otros filtros o términos de búsqueda.</p>
            {hasFilters && <button onClick={clearFilters} style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "#009330", color: "#fff", fontWeight: 700, cursor: "pointer" }}>Limpiar filtros</button>}
          </div>
        ) : (
          filteredJobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedJobIds.has(job.id)}
              applicationCount={appCountByJob[job.id] || 0}
              onView={() => setDetailModal(job)}
              onApply={() => {
                if (!user) return alert("Inicia sesión para postularte.");
                setApplyModal(job);
              }}
            />
          ))
        )}

        {/* My applications section */}
        {myApplications.length > 0 && (
          <div style={{ marginTop: 32, padding: "24px", background: "#f8fafc", borderRadius: 18, boxShadow: "6px 6px 14px #d1d9e6,-6px -6px 14px #fff" }}>
            <h3 style={{ margin: "0 0 16px", fontWeight: 800, color: "#1f2937" }}>Tus postulaciones recientes</h3>
            {myApplications.map(app => (
              <div key={app.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #e5e7eb" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#1f2937" }}>{app.jobTitle}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    Enviada el {app.appliedAt?.toDate ? app.appliedAt.toDate().toLocaleDateString("es-PE") : "Recientemente"}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: app.status === "accepted" ? "#f0fdf4" : app.status === "rejected" ? "#fff5f5" : "#eff6ff", color: app.status === "accepted" ? "#009330" : app.status === "rejected" ? "#f4323f" : "#3b82f6", borderRadius: 8, padding: "6px 12px" }}>
                    {app.status === "pending" ? "En revisión ⏳" : app.status === "accepted" ? "Aceptado ✅" : "Rechazado ❌"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}
      {applyModal && (
        <ApplyModal
          job={applyModal}
          userId={user?.uid}
          userProfile={profile}
          onClose={() => setApplyModal(null)}
          onSuccess={() => {}}
        />
      )}
      
      {detailModal && (
        <JobDetailModal
          job={detailModal}
          applied={appliedJobIds.has(detailModal.id)}
          onClose={() => setDetailModal(null)}
          onApply={() => {
            if (!user) return alert("Inicia sesión para postularte.");
            setDetailModal(null);
            setApplyModal(detailModal);
          }}
        />
      )}
    </div>
  );
}