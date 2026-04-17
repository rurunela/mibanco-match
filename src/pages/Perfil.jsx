import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, storage } from "../firebase/config";
import {
  doc, updateDoc, collection, addDoc, getDoc,
  query, where, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const calcExperienceYears = (experience = []) => {
  const now = new Date();
  let totalMs = 0;
  experience.forEach(exp => {
    const start = exp.startDate ? new Date(exp.startDate) : null;
    const end   = exp.endDate   ? new Date(exp.endDate)   : (exp.current ? now : null);
    if (start && end && end > start) totalMs += end - start;
  });
  return Math.round((totalMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10;
};

const TECH_KW = [
  "ingenier", "software", "sistem", "inform", "computaci", "dato", "data",
  "developer", "programad", "tecnolog", "ciber", "cloud", "devops", "ux", "ui",
  "web", "móvil", "mobile", "analytics", "machine", "inteligencia", "redes", "network",
];
const isTechTitle = (t = "") => TECH_KW.some(k => t.toLowerCase().includes(k));

const inferAcademicLevel = (education = []) => {
  const checks = [
    { test: d => d.includes("doctor") || d.includes("phd"),                       label: "Doctorado" },
    { test: d => d.includes("maestría") || d.includes("magíster") || d.includes("master") || d.includes("mba"), label: "Maestría" },
    { test: d => d.includes("licenci"),                                            label: "Licenciatura" },
    { test: d => d.includes("bachiller"),                                          label: "Bachiller" },
    { test: d => d.includes("egresado"),                                           label: "Egresado" },
    { test: d => d.includes("técnico") || d.includes("tecnico"),                   label: "Técnico" },
  ];
  for (const { test, label } of checks) {
    if (education.some(e => test((e.degree || "").toLowerCase()))) return label;
  }
  return education.length > 0 ? "En formación" : "";
};

// ─── CONSTANTES ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: "available", label: "Disponible",               icon: "🟢", color: "#009330", bg: "#f0fdf4", border: "#bbf7d0" },
  { value: "open",      label: "Abierto a ofertas",        icon: "🔵", color: "#3fb1e2", bg: "#eff6ff", border: "#bfdbfe" },
  { value: "employed",  label: "Empleado – No disponible", icon: "⚫", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
];

const GENDER_OPTIONS = [
  { value: "hombre",    label: "Hombre",     icon: "👨" },
  { value: "mujer",     label: "Mujer",      icon: "👩" },
  { value: "no_binario",label: "No binario", icon: "🧑" },
];

const TECH_LEVELS   = ["No aplica", "Junior", "Mid", "Senior"];
const NOTECH_LEVELS = ["No aplica", "Practicante"];

// ─── ICONS ─────────────────────────────────────────────────────────────────────
const SocialIcon = ({ type }) => {
  const icons = {
    linkedin:  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>,
    github:    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 00-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0020 4.77 5.07 5.07 0 0019.91 1S18.73.65 16 2.48a13.38 13.38 0 00-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 005 4.77a5.44 5.44 0 00-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 009 18.13V22"/></svg>,
    portfolio: <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  };
  return icons[type] || null;
};

// ─── SUB-COMPONENTES COMPARTIDOS ──────────────────────────────────────────────
const SkillTag = ({ skill, onRemove }) => (
  <span style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#f0fdf4", color:"#009330", border:"1px solid #bbf7d0", borderRadius:20, padding:"4px 10px", fontSize:12, fontWeight:600 }}>
    {skill}
    {onRemove && <span onClick={onRemove} style={{ cursor:"pointer", color:"#6b7280", fontSize:14, lineHeight:1 }}>×</span>}
  </span>
);

const Section = ({ title, icon, children, action }) => (
  <div style={{ background:"#f8fafc", borderRadius:16, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff", padding:"20px 22px", marginBottom:18 }}>
    <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:14, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
      <span style={{ display:"flex", alignItems:"center", gap:6 }}>{icon} {title}</span>
      {action}
    </div>
    {children}
  </div>
);

const inp = {
  width:"100%", borderRadius:12, border:"none", background:"#f1f5f9",
  boxShadow:"inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff",
  padding:"10px 14px", fontSize:13, outline:"none", color:"#1f2937", boxSizing:"border-box",
};

const lbl = {
  fontSize:11, fontWeight:700, color:"#9ca3af",
  display:"block", marginBottom:4, textTransform:"uppercase", letterSpacing:.5,
};

const badgeStyle = (bg, color, border) => ({
  background:bg, color, border:`1px solid ${border}`, borderRadius:20,
  padding:"4px 12px", fontSize:11, fontWeight:700,
  display:"inline-flex", alignItems:"center", gap:4,
});

// ─── PDF PREVIEW ───────────────────────────────────────────────────────────────
const PDFPreview = ({ url, name }) => {
  const [show, setShow] = useState(false);
  if (!url) return null;
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", fontWeight:600, textDecoration:"none" }}>📄 {name || "Ver archivo"}</a>
        <button onClick={()=>setShow(s=>!s)} style={{ fontSize:12, padding:"4px 10px", borderRadius:8, border:"1.5px solid #e5e7eb", background:"#f1f5f9", cursor:"pointer", color:"#374151", fontWeight:600 }}>
          {show ? "Ocultar vista previa" : "Vista previa"}
        </button>
      </div>
      {show && (
        <div style={{ marginTop:10, borderRadius:12, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,0,0,.12)", border:"1.5px solid #e5e7eb" }}>
          <iframe src={url} title={name} width="100%" height={500} style={{ display:"block", border:"none" }}/>
        </div>
      )}
    </div>
  );
};

// ─── RECOMENDACIONES MODAL ─────────────────────────────────────────────────────
function RecommendationsModal({ userId, userName, onClose }) {
  const [recs, setRecs] = useState([]);

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      query(collection(db, "recommendations"), where("toUserId", "==", userId)),
      snap => setRecs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [userId]);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:520, width:"100%", maxHeight:"85vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.25)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ margin:0, fontWeight:800 }}>⭐ Recomendaciones — {userName}</h5>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#6b7280" }}>×</button>
        </div>
        {recs.length === 0 ? (
          <div style={{ textAlign:"center", padding:40, color:"#9ca3af" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⭐</div>
            <p>Aún no hay recomendaciones.</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>{recs.length} persona{recs.length!==1?"s":""} ha{recs.length!==1?"n":""} recomendado a {userName}</div>
            {recs.map(r => (
              <div key={r.id} style={{ background:"#f8fafc", borderRadius:14, padding:"16px 18px", marginBottom:12, boxShadow:"4px 4px 10px #d1d9e6,-4px -4px 10px #fff" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{r.fromName}</div>
                    {r.fromHeadline && <div style={{ fontSize:12, color:"#6b7280" }}>{r.fromHeadline}</div>}
                  </div>
                  {r.createdAt && (
                    <div style={{ fontSize:11, color:"#9ca3af" }}>
                      {new Date(r.createdAt.seconds*1000).toLocaleDateString("es-PE")}
                    </div>
                  )}
                </div>
                {r.message && (
                  <div style={{ marginTop:10, padding:"10px 14px", background:"#fff", borderRadius:10, borderLeft:"3px solid #009330", fontSize:13, color:"#374151", fontStyle:"italic" }}>
                    "{r.message}"
                  </div>
                )}
                {r.fromEmail && (
                  <a href={`mailto:${r.fromEmail}`} style={{ display:"inline-flex", alignItems:"center", gap:5, marginTop:10, fontSize:12, color:"#009330", fontWeight:600, textDecoration:"none" }}>
                    📧 Contactar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MODAL PARA ESCRIBIR RECOMENDACIÓN ────────────────────────────────────────
function WriteRecommendationModal({ targetUserId, targetName, fromUser, fromProfile, onClose }) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "recommendations"), {
        toUserId: targetUserId,
        fromUserId: fromUser.uid,
        fromName: fromProfile?.name || fromUser.displayName || "Anónimo",
        fromHeadline: fromProfile?.headline || "",
        fromEmail: fromUser.email || "",
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setSent(true);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
      <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:480, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,.25)" }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h5 style={{ margin:0, fontWeight:800 }}>✍️ Recomendar a {targetName}</h5>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#6b7280" }}>×</button>
        </div>
        {sent ? (
          <div style={{ textAlign:"center", padding:30 }}>
            <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
            <p style={{ fontWeight:700, color:"#009330" }}>¡Recomendación enviada!</p>
          </div>
        ) : (
          <>
            <textarea
              style={{ ...inp, minHeight:120, resize:"vertical", marginBottom:16 }}
              placeholder={`Escribe por qué recomiendas a ${targetName}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
            />
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={onClose} style={{ flex:1, padding:"12px 0", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#f1f5f9", color:"#374151", fontWeight:700, cursor:"pointer" }}>
                Cancelar
              </button>
              <button onClick={handleSend} disabled={sending || !message.trim()} style={{ flex:2, padding:"12px 0", borderRadius:12, border:"none", background: message.trim() ? "#009330" : "#9ca3af", color:"#fff", fontWeight:800, cursor: message.trim() ? "pointer" : "not-allowed", boxShadow: message.trim() ? "0 4px 14px rgba(0,147,48,.35)" : "none" }}>
                {sending ? "Enviando..." : "Enviar recomendación"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── PERFIL READ-ONLY (VISTA DE TERCEROS) ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileReadOnly({ viewedProfile, isRecruiter, currentUser, currentProfile }) {
  const navigate = useNavigate();
  const [showRecsModal, setShowRecsModal]         = useState(false);
  const [showWriteRecModal, setShowWriteRecModal] = useState(false);
  const [recsCount, setRecsCount]                 = useState(0);

  useEffect(() => {
    if (!viewedProfile?.id) return;
    const unsub = onSnapshot(
      query(collection(db, "recommendations"), where("toUserId", "==", viewedProfile.id)),
      snap => setRecsCount(snap.size)
    );
    return unsub;
  }, [viewedProfile?.id]);

  if (!viewedProfile) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:12 }}>
        <div style={{ width:40, height:40, border:"4px solid #009330", borderTop:"4px solid transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
        <p style={{ color:"#6b7280", fontSize:14 }}>Cargando perfil...</p>
      </div>
    );
  }

  const status       = STATUS_OPTIONS.find(s => s.value === viewedProfile.status) || STATUS_OPTIONS[0];
  const expYears     = calcExperienceYears(viewedProfile.experience || []);
  const academicLv   = inferAcademicLevel(viewedProfile.education || []);
  const filledLinks  = Object.entries(viewedProfile.links || {}).filter(([, v]) => v?.trim());

  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 16px", fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── BACK BUTTON ─────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(-1)}
        style={{ display:"inline-flex", alignItems:"center", gap:7, marginBottom:20, padding:"9px 18px", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#f8fafc", color:"#374151", fontWeight:700, fontSize:13, cursor:"pointer", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
        ← Volver
      </button>

      {/* ── BANNER MODO RECLUTADOR ───────────────────────────────────────────── */}
      {isRecruiter && (
        <div style={{ background:"linear-gradient(135deg,#eff6ff,#f0fdf4)", border:"1.5px solid #bfdbfe", borderRadius:14, padding:"12px 18px", marginBottom:20, display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:20 }}>🎯</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#1d4ed8" }}>Vista de reclutador</div>
            <div style={{ fontSize:12, color:"#3b82f6" }}>Estás viendo el perfil completo de este candidato, incluidos los datos exclusivos para reclutadores.</div>
          </div>
        </div>
      )}

      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div style={{ background:"#f8fafc", borderRadius:20, boxShadow:"8px 8px 16px #d1d9e6,-8px -8px 16px #ffffff", padding:"28px 28px 24px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap" }}>
        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <img
            src={viewedProfile.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewedProfile.name||"U")}&background=009330&color=fff&size=96`}
            alt="avatar"
            style={{ width:88, height:88, borderRadius:"50%", objectFit:"cover", border:"3px solid #009330" }}
          />
          <div style={{ position:"absolute", bottom:2, right:2, width:14, height:14, background:viewedProfile.status==="available"?"#009330":viewedProfile.status==="open"?"#3fb1e2":"#9ca3af", borderRadius:"50%", border:"2px solid white" }}/>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <h3 style={{ margin:0, fontWeight:800, fontSize:22, color:"#1f2937" }}>{viewedProfile.name || "Sin nombre"}</h3>
            <span style={badgeStyle(status.bg, status.color, status.border)}>{status.icon} {status.label}</span>
            {recsCount > 0 && (
              <button onClick={() => setShowRecsModal(true)}
                style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fef3c7", color:"#92400e", border:"1px solid #fde68a", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                ⭐ {recsCount} recomendación{recsCount !== 1 ? "es" : ""}
              </button>
            )}
          </div>

          {viewedProfile.headline && (
            <p style={{ margin:"0 0 6px", fontSize:14, color:"#6b7280", fontWeight:500 }}>{viewedProfile.headline}</p>
          )}

          <div style={{ display:"flex", flexWrap:"wrap", gap:8, alignItems:"center" }}>
            {academicLv && (
              <span style={{ fontSize:11, background:"#eff6ff", color:"#3fb1e2", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>
                🎓 {academicLv}
              </span>
            )}
            {viewedProfile.location?.city && (
              <span style={{ fontSize:12, color:"#6b7280", display:"inline-flex", alignItems:"center", gap:3 }}>
                📍 {viewedProfile.location.city}{viewedProfile.location.country ? `, ${viewedProfile.location.country}` : ""}
              </span>
            )}
            {expYears > 0 && (
              <span style={{ fontSize:11, background:"#f0fdf4", color:"#009330", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>
                💼 {expYears} año{expYears !== 1 ? "s" : ""} de exp.
              </span>
            )}
            {viewedProfile.professionalLevel && viewedProfile.professionalLevel !== "No aplica" && (
              <span style={{ fontSize:11, background:"#fef3c7", color:"#92400e", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>
                🏷️ {viewedProfile.professionalLevel}
              </span>
            )}
          </div>

          {filledLinks.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginTop:8 }}>
              {filledLinks.map(([key, url]) => (
                <a key={key} href={url.startsWith("http") ? url : `https://${url}`} target="_blank" rel="noreferrer"
                  style={{ color:"#009330", display:"flex", alignItems:"center", gap:4, textDecoration:"none", fontSize:12, fontWeight:600 }}>
                  <SocialIcon type={key}/>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display:"flex", flexDirection:"column", gap:8, flexShrink:0 }}>
          <button onClick={() => setShowRecsModal(true)}
            style={{ padding:"9px 16px", borderRadius:12, border:"1px solid #fde68a", background:"#fef3c7", color:"#92400e", fontWeight:700, fontSize:12, cursor:"pointer" }}>
            ⭐ Ver recomendaciones
          </button>
          {currentUser && (
            <button onClick={() => setShowWriteRecModal(true)}
              style={{ padding:"9px 16px", borderRadius:12, border:"none", background:"#009330", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", boxShadow:"0 4px 12px rgba(0,147,48,.3)" }}>
              ✍️ Recomendar
            </button>
          )}
        </div>
      </div>

      {/* ── DATOS EXCLUSIVOS PARA RECLUTADORES ──────────────────────────────── */}
      {isRecruiter && (
        <div style={{ background:"linear-gradient(135deg,#eff6ff 0%,#f0fdf4 100%)", border:"2px solid #bfdbfe", borderRadius:16, padding:"20px 22px", marginBottom:18, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff" }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#1d4ed8", marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>
            🔒 Datos exclusivos para reclutadores
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:14 }}>
            {/* Teléfono */}
            {viewedProfile.phone && (
              <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
                <div style={lbl}>📱 Teléfono</div>
                <a href={`tel:${viewedProfile.phone}`} style={{ fontWeight:700, color:"#009330", fontSize:14, textDecoration:"none" }}>
                  {viewedProfile.phone}
                </a>
              </div>
            )}

            {/* Email (si disponible) */}
            {viewedProfile.email && (
              <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
                <div style={lbl}>📧 Correo</div>
                <a href={`mailto:${viewedProfile.email}`} style={{ fontWeight:700, color:"#009330", fontSize:14, textDecoration:"none", wordBreak:"break-all" }}>
                  {viewedProfile.email}
                </a>
              </div>
            )}

            {/* Género */}
            {viewedProfile.gender && (
              <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
                <div style={lbl}>Género</div>
                <div style={{ fontWeight:600, fontSize:14 }}>
                  {GENDER_OPTIONS.find(g => g.value === viewedProfile.gender)?.icon || ""} {GENDER_OPTIONS.find(g => g.value === viewedProfile.gender)?.label || viewedProfile.gender}
                </div>
              </div>
            )}

            {/* Edad */}
            {viewedProfile.age && (
              <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
                <div style={lbl}>Edad</div>
                <div style={{ fontWeight:600, fontSize:14 }}>{viewedProfile.age} años</div>
              </div>
            )}

            {/* Preferencias */}
            {(viewedProfile.preferences?.modality || viewedProfile.preferences?.type) && (
              <div style={{ background:"#fff", borderRadius:12, padding:"12px 16px", boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
                <div style={lbl}>Preferencias laborales</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginTop:4 }}>
                  {viewedProfile.preferences?.modality && (
                    <span style={{ background:"#f0fdf4", color:"#009330", borderRadius:8, padding:"3px 9px", fontSize:11, fontWeight:700 }}>
                      {viewedProfile.preferences.modality}
                    </span>
                  )}
                  {viewedProfile.preferences?.type && (
                    <span style={{ background:"#eff6ff", color:"#3b82f6", borderRadius:8, padding:"3px 9px", fontSize:11, fontWeight:700 }}>
                      {viewedProfile.preferences.type}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CV para reclutadores */}
          {viewedProfile.cvURL && (
            <div style={{ marginTop:16, padding:"14px 16px", background:"#fff", borderRadius:12, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={lbl}>📄 Curriculum Vitae</div>
              <PDFPreview url={viewedProfile.cvURL} name={viewedProfile.cvName || "CV.pdf"}/>
            </div>
          )}

          {/* Certificaciones para reclutadores */}
          {(viewedProfile.certifications || []).length > 0 && (
            <div style={{ marginTop:12, padding:"14px 16px", background:"#fff", borderRadius:12, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={lbl}>🏅 Certificaciones ({viewedProfile.certifications.length})</div>
              {viewedProfile.certifications.map((c, i) => (
                <div key={i} style={{ marginTop:8 }}>
                  {c.type === "application/pdf"
                    ? <PDFPreview url={c.url} name={c.name}/>
                    : <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", textDecoration:"none", fontWeight:600 }}>📄 {c.name}</a>
                  }
                </div>
              ))}
            </div>
          )}

          {/* Diplomas para reclutadores */}
          {(viewedProfile.diplomas || []).length > 0 && (
            <div style={{ marginTop:12, padding:"14px 16px", background:"#fff", borderRadius:12, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={lbl}>🎓 Diplomas y títulos ({viewedProfile.diplomas.length})</div>
              {viewedProfile.diplomas.map((d, i) => (
                <div key={i} style={{ marginTop:8 }}>
                  {d.type === "application/pdf"
                    ? <PDFPreview url={d.url} name={d.name}/>
                    : <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", textDecoration:"none", fontWeight:600 }}>🎓 {d.name}</a>
                  }
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BIO ─────────────────────────────────────────────────────────────── */}
      {viewedProfile.bio && (
        <Section title="Sobre mí" icon="💡">
          <p style={{ fontSize:14, color:"#374151", lineHeight:1.7, margin:0 }}>{viewedProfile.bio}</p>
        </Section>
      )}

      {/* ── HABILIDADES ─────────────────────────────────────────────────────── */}
      {(viewedProfile.skills || []).length > 0 && (
        <Section title="Habilidades" icon="🛠️">
          <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
            {viewedProfile.skills.map(s => <SkillTag key={s} skill={s}/>)}
          </div>
        </Section>
      )}

      {/* ── EXPERIENCIA ─────────────────────────────────────────────────────── */}
      {(viewedProfile.experience || []).length > 0 && (
        <Section title="Experiencia laboral" icon="💼"
          action={expYears > 0 && <span style={{ fontSize:11, color:"#9ca3af" }}>Total: <strong style={{ color:"#009330" }}>{expYears} años</strong></span>}>
          {viewedProfile.experience.map((exp, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", marginBottom:10, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#1f2937", marginBottom:4 }}>{exp.role || "Sin especificar"}</div>
              <div style={{ fontSize:12, color:"#6b7280" }}>
                {exp.startDate && <span>{exp.startDate}</span>}
                {(exp.startDate || exp.endDate) && " → "}
                {exp.current ? <span style={{ color:"#009330", fontWeight:600 }}>Actualidad</span> : exp.endDate}
              </div>
            </div>
          ))}
        </Section>
      )}

      {/* ── EDUCACIÓN ───────────────────────────────────────────────────────── */}
      {(viewedProfile.education || []).length > 0 && (
        <Section title="Educación" icon="🎓"
          action={academicLv && <span style={{ fontSize:11, background:"#eff6ff", color:"#3fb1e2", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>{academicLv}</span>}>
          {viewedProfile.education.map((edu, i) => (
            <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", marginBottom:10, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={{ fontWeight:700, fontSize:14, color:"#1f2937" }}>{edu.degree || "Sin especificar"}</div>
              <div style={{ fontSize:13, color:"#6b7280" }}>{edu.institution}</div>
              {(edu.startDate || edu.endDate) && (
                <div style={{ fontSize:11, color:"#9ca3af", marginTop:4 }}>
                  {edu.startDate} {edu.endDate && `→ ${edu.endDate}`}
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      {/* ── MODALES ─────────────────────────────────────────────────────────── */}
      {showRecsModal && (
        <RecommendationsModal userId={viewedProfile.id} userName={viewedProfile.name} onClose={() => setShowRecsModal(false)}/>
      )}
      {showWriteRecModal && (
        <WriteRecommendationModal
          targetUserId={viewedProfile.id}
          targetName={viewedProfile.name}
          fromUser={currentUser}
          fromProfile={currentProfile}
          onClose={() => setShowWriteRecModal(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Perfil() {
  const { user, profile, permissions } = useAuth();
  const { userId: paramUserId }        = useParams();         // ← de la URL: /perfil/:userId
  const navigate                       = useNavigate();

  // ── Modo: ¿viendo perfil propio o de otra persona? ───────────────────────
  const isViewingOther = paramUserId && paramUserId !== user?.uid;
  const isRecruiter    = permissions?.isRecruiter;
  const isAdmin        = permissions?.isAdmin;

  // ── Estado para perfil de tercero ────────────────────────────────────────
  const [viewedProfile, setViewedProfile] = useState(null);

  useEffect(() => {
    if (!isViewingOther || !paramUserId) return;
    const unsub = onSnapshot(doc(db, "users", paramUserId), snap => {
      if (snap.exists()) {
        setViewedProfile({ id: snap.id, ...snap.data() });
      } else {
        setViewedProfile({ id: paramUserId, name: "Usuario no encontrado" });
      }
    });
    return unsub;
  }, [isViewingOther, paramUserId]);

  // ── Si está viendo el perfil de otra persona ──────────────────────────────
  if (isViewingOther) {
    return (
      <ProfileReadOnly
        viewedProfile={viewedProfile}
        isRecruiter={isRecruiter || isAdmin}
        currentUser={user}
        currentProfile={profile}
      />
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ─── PERFIL PROPIO (EDITABLE) ─────────────────────────────────────────────
  // ═══════════════════════════════════════════════════════════════════════════

  const [form, setForm]         = useState(null);
  const [saving, setSaving]     = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [saveMsg, setSaveMsg]   = useState("");
  const [uploadingCV, setUploadingCV] = useState(false);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [uploadingDiploma, setUploadingDiploma] = useState(false);
  const [showRecsModal, setShowRecsModal] = useState(false);
  const [recsCount, setRecsCount] = useState(0);

  // Cargar conteo de recomendaciones
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, "recommendations"), where("toUserId", "==", user.uid)),
      snap => setRecsCount(snap.size)
    );
    return unsub;
  }, [user?.uid]);

  useEffect(() => {
    if (profile) {
      setForm({
        ...profile,
        skills:       profile.skills || [],
        experience:   profile.experience || [],
        education:    profile.education || [],
        links:        profile.links || {},
        preferences:  profile.preferences || {},
        location:     profile.location || { city:"", country:"Perú" },
        status:       profile.status || "available",
        phone:        profile.phone || "",
        bio:          profile.bio || "",
        headline:     profile.headline || "",
        gender:       profile.gender || "",
        age:          profile.age || "",
        professionalTitle: profile.professionalTitle || profile.headline || "",
        professionalLevel: profile.professionalLevel || "No aplica",
        certifications: profile.certifications || [],
        diplomas:     profile.diplomas || [],
        cvURL:        profile.cvURL || "",
        cvName:       profile.cvName || "CV.pdf",
        academicLevel: profile.academicLevel || "",
      });
    }
  }, [profile]);

  if (!form) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:12 }}>
      <div style={{ width:40, height:40, border:"4px solid #009330", borderTop:"4px solid transparent", borderRadius:"50%", animation:"spin 1s linear infinite" }}/>
      <p style={{ color:"#6b7280", fontSize:14 }}>Cargando perfil...</p>
    </div>
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const update       = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const updateNested = (parent, key, value) => setForm(prev => ({ ...prev, [parent]: { ...prev[parent], [key]: value } }));

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      update("skills", [...form.skills, trimmed]);
      update("skills_normalized", [...(form.skills_normalized || []), trimmed.toLowerCase()]);
    }
    setNewSkill("");
  };

  const removeSkill = skill => {
    update("skills", form.skills.filter(s => s !== skill));
    update("skills_normalized", (form.skills_normalized || []).filter(s => s !== skill.toLowerCase()));
  };

  const handleCVUpload = async file => {
    if (!file) return;
    setUploadingCV(true);
    try {
      const storageRef = ref(storage, `cv/${user.uid}/${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      const url        = await getDownloadURL(snapshot.ref);
      update("cvURL",  url);
      update("cvName", file.name);
    } catch (err) { console.error("Error subiendo CV:", err); }
    setUploadingCV(false);
  };

  const handleCertUpload = async file => {
    if (!file) return;
    setUploadingCert(true);
    try {
      const storageRef = ref(storage, `certs/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      const url        = await getDownloadURL(snapshot.ref);
      update("certifications", [...(form.certifications || []), { name: file.name, url, type: file.type }]);
    } catch (err) { console.error("Error subiendo certificado:", err); }
    setUploadingCert(false);
  };

  const removeCert = idx => update("certifications", form.certifications.filter((_, i) => i !== idx));

  const handleDiplomaUpload = async file => {
    if (!file) return;
    setUploadingDiploma(true);
    try {
      const storageRef = ref(storage, `diplomas/${user.uid}/${Date.now()}_${file.name}`);
      const snapshot   = await uploadBytes(storageRef, file);
      const url        = await getDownloadURL(snapshot.ref);
      update("diplomas", [...(form.diplomas || []), { name: file.name, url, type: file.type }]);
    } catch (err) { console.error("Error subiendo diploma:", err); }
    setUploadingDiploma(false);
  };

  const removeDiploma = idx => update("diplomas", form.diplomas.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      const computedExp   = calcExperienceYears(form.experience);
      const academicLevel = inferAcademicLevel(form.education);
      await updateDoc(doc(db, "users", user.uid), {
        ...form,
        total_experience: computedExp > 0 ? computedExp : form.experience.reduce((a,e)=>a+(e.years||0),0),
        academicLevel,
        updatedAt: new Date(),
      });
      setSaveMsg("¡Perfil guardado! 🚀");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setSaveMsg("Error al guardar.");
    }
    setSaving(false);
  };

  // ── Nivel profesional según título ──────────────────────────────────────
  const levelOptions = isTechTitle(form.professionalTitle || form.headline)
    ? TECH_LEVELS
    : NOTECH_LEVELS;

  const currentLevel = levelOptions.includes(form.professionalLevel)
    ? form.professionalLevel
    : "No aplica";

  const liveAcademicLevel = inferAcademicLevel(form.education);

  // ── Badges ──────────────────────────────────────────────────────────────
  const RoleBadge = () => {
    if (isAdmin) return <span style={badgeStyle("#fef3c7","#92400e","#fde68a")}>⭐ Admin</span>;
    if (isRecruiter) return <span style={badgeStyle("#eff6ff","#1d4ed8","#bfdbfe")}>🎯 Reclutador</span>;
    const st = STATUS_OPTIONS.find(s => s.value === form.status) || STATUS_OPTIONS[0];
    return <span style={badgeStyle(st.bg, st.color, st.border)}>{st.icon} {st.label}</span>;
  };

  const filledLinks = Object.entries(form.links || {}).filter(([, v]) => v?.trim());

  const btnSave = {
    flex:1, padding:"14px 0", borderRadius:14, border:"none",
    background: saving ? "#9ca3af" : "#009330", color:"#fff",
    fontWeight:800, fontSize:16, cursor: saving ? "not-allowed" : "pointer",
    boxShadow: saving ? "none" : "0 4px 14px rgba(0,147,48,.35)", transition:"all .2s",
  };

  return (
    <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 16px", fontFamily:"'Inter',system-ui,sans-serif" }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div style={{ background:"#f8fafc", borderRadius:20, boxShadow:"8px 8px 16px #d1d9e6,-8px -8px 16px #ffffff", padding:"28px 28px 24px", marginBottom:20, display:"flex", alignItems:"flex-start", gap:20, flexWrap:"wrap" }}>
        {/* Avatar */}
        <div style={{ position:"relative", flexShrink:0 }}>
          <img
            src={form.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name||"U")}&background=009330&color=fff&size=96`}
            alt="avatar"
            style={{ width:88, height:88, borderRadius:"50%", objectFit:"cover", border:"3px solid #009330" }}
          />
          <div style={{ position:"absolute", bottom:2, right:2, width:14, height:14, background:form.status==="available"?"#009330":form.status==="open"?"#3fb1e2":"#9ca3af", borderRadius:"50%", border:"2px solid white" }}/>
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:4 }}>
            <h3 style={{ margin:0, fontWeight:800, fontSize:20, color:"#1f2937" }}>{form.name||"Sin nombre"}</h3>
            <RoleBadge/>
            <button onClick={()=>setShowRecsModal(true)}
              style={{ display:"inline-flex", alignItems:"center", gap:5, background:"#fef3c7", color:"#92400e", border:"1px solid #fde68a", borderRadius:20, padding:"4px 12px", fontSize:11, fontWeight:700, cursor:"pointer" }}>
              ⭐ Recomendaciones {recsCount > 0 && <span style={{ background:"#009330", color:"#fff", borderRadius:10, padding:"1px 7px", fontSize:11 }}>{recsCount}</span>}
            </button>
          </div>

          {/* Título profesional editable */}
          <input
            style={{ ...inp, background:"transparent", boxShadow:"none", border:"none", borderBottom:"1.5px dashed #e5e7eb", borderRadius:0, padding:"6px 0", fontSize:14, color:"#6b7280", width:"100%", marginBottom:8 }}
            placeholder="Tu título profesional (ej: Analista de Riesgo · Lima)"
            value={form.headline}
            onChange={e => update("headline", e.target.value)}
          />

          {liveAcademicLevel && (
            <span style={{ fontSize:11, background:"#eff6ff", color:"#3fb1e2", borderRadius:8, padding:"3px 10px", fontWeight:700, marginRight:8 }}>
              🎓 {liveAcademicLevel}
            </span>
          )}
          {form.location?.city && (
            <span style={{ fontSize:12, color:"#6b7280", display:"inline-flex", alignItems:"center", gap:3 }}>
              📍 {form.location.city}
            </span>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap", marginTop:6 }}>
            {filledLinks.map(([key, url]) => (
              <a key={key} href={url.startsWith("http")?url:`https://${url}`} target="_blank" rel="noreferrer"
                style={{ color:"#009330", display:"flex", alignItems:"center", gap:4, textDecoration:"none", fontSize:12, fontWeight:600 }}>
                <SocialIcon type={key}/>
                {key.charAt(0).toUpperCase()+key.slice(1)}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATUS ─────────────────────────────────────────────────────────── */}
      {!isRecruiter && (
        <Section title="Estado de búsqueda" icon="🔍">
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {STATUS_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => update("status", opt.value)}
                style={{ padding:"8px 16px", borderRadius:12, cursor:"pointer", fontWeight:600, fontSize:13, transition:"all .2s",
                  background: form.status===opt.value ? opt.bg : "#f1f5f9",
                  color:      form.status===opt.value ? opt.color : "#9ca3af",
                  border:    `2px solid ${form.status===opt.value ? opt.border : "transparent"}` }}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── DOS COLUMNAS ───────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>

        {/* Sobre mí */}
        <div style={{ gridColumn:"1 / -1" }}>
          <Section title="Sobre mí" icon="💡">
            <textarea style={{ ...inp, minHeight:90, resize:"vertical" }}
              placeholder="Cuéntanos quién eres, qué te apasiona y qué buscas..."
              value={form.bio} onChange={e=>update("bio",e.target.value)}/>
          </Section>
        </div>

        {/* Datos personales */}
        <Section title="Datos personales" icon="🪪">
          <label style={lbl}>Edad</label>
          <input style={{ ...inp, marginBottom:12 }} type="number" placeholder="Edad" value={form.age||""} onChange={e=>update("age",e.target.value)}/>
          <label style={lbl}>Género</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {GENDER_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => update("gender", opt.value)}
                style={{ padding:"7px 14px", borderRadius:10, cursor:"pointer", fontWeight:600, fontSize:13,
                  background: form.gender===opt.value ? "#f0fdf4" : "#f1f5f9",
                  color:      form.gender===opt.value ? "#009330" : "#6b7280",
                  border:    `2px solid ${form.gender===opt.value ? "#bbf7d0" : "transparent"}` }}>
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Nivel profesional */}
        <Section title="Nivel profesional" icon="🏷️">
          <label style={lbl}>Título del puesto</label>
          <input style={{ ...inp, marginBottom:12 }}
            placeholder="Ej: Ingeniero de Software, Analista Financiero..."
            value={form.professionalTitle||""}
            onChange={e => {
              update("professionalTitle", e.target.value);
              if (!isTechTitle(e.target.value) && !NOTECH_LEVELS.includes(form.professionalLevel)) {
                update("professionalLevel", "No aplica");
              }
            }}
          />
          <label style={lbl}>Nivel</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {levelOptions.map(lv => (
              <button key={lv} onClick={() => update("professionalLevel", lv)}
                style={{ padding:"7px 14px", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:13,
                  background: currentLevel===lv ? "#009330" : "#f1f5f9",
                  color:      currentLevel===lv ? "#fff" : "#6b7280",
                  border:    `2px solid ${currentLevel===lv ? "#009330" : "transparent"}` }}>
                {lv}
              </button>
            ))}
          </div>
          {isTechTitle(form.professionalTitle||form.headline) && (
            <div style={{ fontSize:11, color:"#3fb1e2", marginTop:8 }}>🧑‍💻 Título tecnológico detectado — niveles Junior, Mid y Senior disponibles.</div>
          )}
        </Section>

        {/* Skills */}
        <div style={{ gridColumn:"1 / -1" }}>
          <Section title="Habilidades" icon="🛠️">
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
              {form.skills.length===0 && <span style={{ fontSize:13, color:"#9ca3af" }}>Sin habilidades agregadas aún.</span>}
              {form.skills.map(s => <SkillTag key={s} skill={s} onRemove={() => removeSkill(s)}/>)}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input style={{ ...inp, flex:1 }} placeholder="Ej: Excel, Análisis de riesgo, Python..."
                value={newSkill} onChange={e=>setNewSkill(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSkill()}/>
              <button onClick={addSkill} style={{ padding:"10px 18px", borderRadius:12, background:"#009330", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", fontSize:13, whiteSpace:"nowrap" }}>+ Agregar</button>
            </div>
          </Section>
        </div>

        {/* Ubicación */}
        <Section title="Ubicación" icon="📍">
          <input style={{ ...inp, marginBottom:10 }} placeholder="Ciudad"
            value={form.location.city} onChange={e=>updateNested("location","city",e.target.value)}/>
          <input style={inp} placeholder="País"
            value={form.location.country} onChange={e=>updateNested("location","country",e.target.value)}/>
        </Section>

        {/* Preferencias */}
        <Section title="Preferencias" icon="⚙️">
          <label style={lbl}>MODALIDAD</label>
          <select style={{ ...inp, marginBottom:10 }} value={form.preferences.modality||""} onChange={e=>updateNested("preferences","modality",e.target.value)}>
            <option value="">Sin preferencia</option>
            <option value="Remoto">Remoto</option>
            <option value="Presencial">Presencial</option>
            <option value="Híbrido">Híbrido</option>
          </select>
          <label style={lbl}>TIPO DE JORNADA</label>
          <select style={inp} value={form.preferences.type||""} onChange={e=>updateNested("preferences","type",e.target.value)}>
            <option value="">Sin preferencia</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Practicante">Practicante</option>
          </select>
        </Section>

        {/* Contacto */}
        <div style={{ gridColumn:"1 / -1" }}>
          <Section title="Contacto" icon="📱">
            <label style={{ fontSize:11, fontWeight:700, color:"#9ca3af", display:"block", marginBottom:4 }}>
              TELÉFONO <span style={{ fontSize:10, color:"#f39000" }}>(solo visible para reclutadores)</span>
            </label>
            <input style={inp} type="tel" placeholder="+51 999 999 999"
              value={form.phone} onChange={e=>update("phone",e.target.value)}/>
          </Section>
        </div>

        {/* Redes */}
        <div style={{ gridColumn:"1 / -1" }}>
          <Section title="Redes sociales" icon="🔗">
            {[
              { key:"linkedin",  placeholder:"linkedin.com/in/tuperfil",  icon:"💼" },
              { key:"github",    placeholder:"github.com/tuusuario",       icon:"💻" },
              { key:"portfolio", placeholder:"tuweb.com",                 icon:"🌐" },
            ].map(({ key, placeholder, icon }) => (
              <div key={key} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                <input style={inp} placeholder={placeholder}
                  value={form.links[key]||""} onChange={e=>updateNested("links",key,e.target.value)}/>
              </div>
            ))}
          </Section>
        </div>
      </div>

      {/* ── EXPERIENCIA LABORAL ──────────────────────────────────────────────── */}
      <Section title="Experiencia laboral" icon="💼"
        action={<span style={{ fontSize:11, color:"#9ca3af" }}>Exp. calculada: <strong style={{ color:"#009330" }}>{calcExperienceYears(form.experience)} años</strong></span>}>
        {form.experience.map((exp, i) => (
          <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", marginBottom:12, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, marginBottom:8 }}>
              <input style={inp} placeholder="Puesto / Empresa (ej: Analista en Banco X)"
                value={exp.role||""}
                onChange={e=>{const c=[...form.experience]; c[i]={...c[i],role:e.target.value}; update("experience",c);}}/>
              <button onClick={()=>update("experience",form.experience.filter((_,j)=>j!==i))}
                style={{ width:36, height:36, borderRadius:10, border:"none", background:"#fff5f5", color:"#f4323f", cursor:"pointer", fontSize:16, flexShrink:0 }}>×</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <div style={lbl}>Inicio</div>
                <input type="date" style={inp} value={exp.startDate||""}
                  onChange={e=>{const c=[...form.experience]; c[i]={...c[i],startDate:e.target.value}; update("experience",c);}}/>
              </div>
              <div>
                <div style={lbl}>Fin {exp.current && <span style={{ fontSize:10, color:"#009330" }}>(actual)</span>}</div>
                <input type="date" style={{ ...inp, opacity:exp.current?0.5:1 }} value={exp.endDate||""} disabled={exp.current}
                  onChange={e=>{const c=[...form.experience]; c[i]={...c[i],endDate:e.target.value}; update("experience",c);}}/>
              </div>
            </div>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, marginTop:8, cursor:"pointer" }}>
              <input type="checkbox" checked={exp.current||false}
                onChange={e=>{const c=[...form.experience]; c[i]={...c[i],current:e.target.checked,endDate:""}; update("experience",c);}}/>
              Trabajo actual
            </label>
          </div>
        ))}
        <button onClick={()=>update("experience",[...form.experience,{role:"",startDate:"",endDate:"",current:false}])}
          style={{ padding:"8px 16px", borderRadius:12, border:"1.5px dashed #d1d9e6", background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          + Agregar experiencia
        </button>
      </Section>

      {/* ── EDUCACIÓN ───────────────────────────────────────────────────────── */}
      <Section title="Educación" icon="🎓"
        action={liveAcademicLevel && <span style={{ fontSize:11, background:"#eff6ff", color:"#3fb1e2", borderRadius:8, padding:"3px 10px", fontWeight:700 }}>Grado inferido: {liveAcademicLevel}</span>}>
        {form.education.length===0 && <p style={{ fontSize:13, color:"#9ca3af", marginBottom:10 }}>Añade tus estudios.</p>}
        {form.education.map((edu, i) => (
          <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 16px", marginBottom:12, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr auto", gap:8, marginBottom:8, alignItems:"start" }}>
              <input style={inp} placeholder="Grado / Carrera"
                value={edu.degree||""}
                onChange={e=>{const c=[...form.education]; c[i]={...c[i],degree:e.target.value}; update("education",c);}}/>
              <input style={inp} placeholder="Universidad / Instituto"
                value={edu.institution||""}
                onChange={e=>{const c=[...form.education]; c[i]={...c[i],institution:e.target.value}; update("education",c);}}/>
              <button onClick={()=>update("education",form.education.filter((_,j)=>j!==i))}
                style={{ width:36, height:36, borderRadius:10, border:"none", background:"#fff5f5", color:"#f4323f", cursor:"pointer", fontSize:16 }}>×</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div>
                <div style={lbl}>Inicio</div>
                <input type="date" style={inp} value={edu.startDate||""}
                  onChange={e=>{const c=[...form.education]; c[i]={...c[i],startDate:e.target.value}; update("education",c);}}/>
              </div>
              <div>
                <div style={lbl}>Fin</div>
                <input type="date" style={inp} value={edu.endDate||""}
                  onChange={e=>{const c=[...form.education]; c[i]={...c[i],endDate:e.target.value}; update("education",c);}}/>
              </div>
            </div>
          </div>
        ))}
        <button onClick={()=>update("education",[...form.education,{degree:"",institution:"",startDate:"",endDate:""}])}
          style={{ padding:"8px 16px", borderRadius:12, border:"1.5px dashed #d1d9e6", background:"transparent", color:"#6b7280", cursor:"pointer", fontSize:13, fontWeight:600 }}>
          + Agregar educación
        </button>
      </Section>

      {/* ── DOCUMENTOS ─────────────────────────────────────────────────────── */}
      <Section title="Documentos" icon="📂">
        {/* CV */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:8 }}>📄 Curriculum Vitae (PDF)</div>
          <label style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:12, border:"1.5px dashed #009330", background:"#f0fdf4", color:"#009330", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {uploadingCV ? "Subiendo..." : "📤 Subir CV"}
            <input type="file" accept="application/pdf" style={{ display:"none" }} disabled={uploadingCV}
              onChange={e=>handleCVUpload(e.target.files[0])}/>
          </label>
          {form.cvURL && <PDFPreview url={form.cvURL} name={form.cvName||"CV.pdf"}/>}
        </div>

        <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:16, marginBottom:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:8 }}>🏅 Certificaciones</div>
          {(form.certifications||[]).map((c,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, background:"#f8fafc", borderRadius:10, padding:"8px 12px" }}>
              <span style={{ flex:1 }}>
                {c.type==="application/pdf"
                  ? <PDFPreview url={c.url} name={c.name}/>
                  : <a href={c.url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", textDecoration:"none" }}>📄 {c.name}</a>
                }
              </span>
              <button onClick={()=>removeCert(i)} style={{ width:28, height:28, borderRadius:8, border:"none", background:"#fff5f5", color:"#f4323f", cursor:"pointer", fontSize:14, flexShrink:0 }}>×</button>
            </div>
          ))}
          <label style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:12, border:"1.5px dashed #3fb1e2", background:"#eff6ff", color:"#3fb1e2", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {uploadingCert ? "Subiendo..." : "📤 Agregar certificación"}
            <input type="file" accept="application/pdf,image/*" style={{ display:"none" }} disabled={uploadingCert}
              onChange={e=>handleCertUpload(e.target.files[0])}/>
          </label>
        </div>

        <div style={{ borderTop:"1px solid #e5e7eb", paddingTop:16 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#374151", marginBottom:8 }}>🎓 Diplomas y títulos</div>
          {(form.diplomas||[]).map((d,i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, background:"#f8fafc", borderRadius:10, padding:"8px 12px" }}>
              <span style={{ flex:1 }}>
                {d.type==="application/pdf"
                  ? <PDFPreview url={d.url} name={d.name}/>
                  : <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", textDecoration:"none" }}>🎓 {d.name}</a>
                }
              </span>
              <button onClick={()=>removeDiploma(i)} style={{ width:28, height:28, borderRadius:8, border:"none", background:"#fff5f5", color:"#f4323f", cursor:"pointer", fontSize:14, flexShrink:0 }}>×</button>
            </div>
          ))}
          <label style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"9px 16px", borderRadius:12, border:"1.5px dashed #f39000", background:"#fff7ed", color:"#f39000", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            {uploadingDiploma ? "Subiendo..." : "📤 Agregar diploma"}
            <input type="file" accept="application/pdf,image/*" style={{ display:"none" }} disabled={uploadingDiploma}
              onChange={e=>handleDiplomaUpload(e.target.files[0])}/>
          </label>
        </div>
      </Section>

      {/* ── SAVE BUTTON ─────────────────────────────────────────────────────── */}
      <div style={{ display:"flex", alignItems:"center", gap:14, marginTop:4 }}>
        <button onClick={handleSave} disabled={saving} style={btnSave}>
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>
        {saveMsg && <span style={{ fontSize:13, color:"#009330", fontWeight:600 }}>{saveMsg}</span>}
      </div>

      <p style={{ fontSize:11, color:"#9ca3af", textAlign:"center", marginTop:16 }}>
        * Tu número de teléfono solo será visible para reclutadores autorizados.
      </p>

      {/* ── MODAL RECOMENDACIONES ───────────────────────────────────────────── */}
      {showRecsModal && (
        <RecommendationsModal userId={user?.uid} userName={form.name} onClose={()=>setShowRecsModal(false)}/>
      )}
    </div>
  );
}