import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from "recharts";
import { db } from "../firebase/config";
import {
  collection, addDoc, serverTimestamp, onSnapshot,
  query, where, doc, updateDoc, deleteDoc, getDocs,
} from "firebase/firestore";

// ─── JSON LOCAL ────────────────────────────────────────────────────────────────
const localCandidates = [];

// ─── HELPERS ───────────────────────────────────────────────────────────────────
/** Calcula años de experiencia total desde rangos de fechas */
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

const getEffectiveExp = c => {
  const computed = calcExperienceYears(c.experience || []);
  return computed > 0 ? computed : (c.total_experience || c.experience_years || 0);
};

const fmtExp = v => v === 1 ? "1 año" : `${v} años`;

// ─── CONSTANTES ────────────────────────────────────────────────────────────────
const EMPLOYMENT_LABELS = {
  available:     { label: "Disponible",              color: "#009330", icon: "🟢" },
  open:          { label: "Abierto a ofertas",        color: "#3fb1e2", icon: "🔵" },
  employed:      { label: "Empleado – No disponible", color: "#6b7280", icon: "⚫" },
  searching:     { label: "Disponible",              color: "#009330", icon: "🟢" },
  working:       { label: "Trabajando",              color: "#f39000", icon: "🟡" },
  not_searching: { label: "No disponible",           color: "#6b7280", icon: "⚫" },
};
const EDU_LEVELS = ["Técnico", "Bachiller", "Egresado", "Licenciado", "Magíster", "Doctor"];

const calculateMatch = (candidate, job) => {
  if (!job) return 0;
  let score = 0;
  const cSkills = candidate.skills_normalized || candidate.skills || [];
  const jSkills = (job.skills_required || []).map(s => s.toLowerCase());
  const matched = jSkills.filter(s => cSkills.map(c => c.toLowerCase()).includes(s)).length;
  score += jSkills.length ? (matched / jSkills.length) * 50 : 0;
  if (getEffectiveExp(candidate) >= (job.min_experience || 0)) score += 20;
  if ((candidate.location?.city || "") === (job.city || "")) score += 15;
  if ((candidate.preferences?.modality || "") === (job.modality || "")) score += 15;
  return Math.round(score);
};

const EMPTY_JOB_FORM = {
  title: "", description: "", requirements: "", skills_input: "",
  skills_required: [], min_experience: 0, modality: "Presencial",
  type: "Full-time", city: "Lima", level: "No aplica",
  vacancies: 1, hiring_deadline: "", salary_range: "", status: "Activo",
};

// ─── HELPER: NOTIFICACIÓN AL RECLUTADOR ────────────────────────────────────────
// Escribe en "notifications" con isRecruiterNotification: true para que
// Notificaciones.jsx las distinga de las notificaciones a candidatos.
// Comparte la misma estructura de campos que sendRecruiterNotification en Vacantes.jsx.
async function createRecruiterNotification(firestore, {
  recruiterId,
  type = "general",
  message,
  vacancyId   = "",
  vacancyTitle= "",
  candidateName="",
}) {
  if (!recruiterId || !message) return;
  try {
    await addDoc(collection(firestore, "notifications"), {
      userId:                 recruiterId,
      type,
      message,
      vacancyId,
      vacancyTitle,
      candidateName,
      read:                   false,
      isRecruiterNotification:true,
      createdAt:              serverTimestamp(),
    });
  } catch (e) {
    console.error("[Dashboard] Error creando notificación al reclutador:", e);
  }
}

// ─── ICONS ─────────────────────────────────────────────────────────────────────
const StarIcon  = ({ filled, onClick, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?"#f5b301":"none"} stroke={filled?"#f5b301":"currentColor"} strokeWidth="2" style={{cursor:"pointer"}} onClick={onClick}><path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z"/></svg>;
const UsersIcon = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const EyeIcon   = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const CheckIcon = ({ color="currentColor" }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const XIcon     = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SearchIcon= () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ChevronL  = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronR  = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;
const MailIcon  = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
const CalIcon   = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const PauseIcon = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>;
const PlusIcon  = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ─── BASE COMPONENTS ───────────────────────────────────────────────────────────
const InfoBox = ({ label, value }) => (
  <div style={{ background:"#f1f5f9", borderRadius:10, padding:"8px 12px" }}>
    <div style={{ fontSize:10, color:"#9ca3af", textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
    <div style={{ fontSize:13, fontWeight:600, color:"#1f2937" }}>{value || "—"}</div>
  </div>
);
const SectionTitle = ({ children }) => (
  <div style={{ fontSize:12, fontWeight:700, color:"#374151", marginBottom:8, marginTop:14 }}>{children}</div>
);
const StatCard = ({ label, value, color, subtitle }) => (
  <div style={{ background:"#f8fafc", borderRadius:14, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #fff", padding:"16px 14px", textAlign:"center" }}>
    <div style={{ fontSize:30, fontWeight:800, color }}>{value}</div>
    <div style={{ fontSize:12, color:"#6b7280", marginTop:2, fontWeight:600 }}>{label}</div>
    {subtitle && <div style={{ fontSize:10, color:"#9ca3af", marginTop:2 }}>{subtitle}</div>}
  </div>
);
const HBar = ({ label, count, total, color="#009330", subLabel }) => (
  <div style={{ marginBottom:10 }}>
    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
      <span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{label}{subLabel&&<span style={{ fontSize:10, color:"#9ca3af", marginLeft:5 }}>{subLabel}</span>}</span>
      <span style={{ fontSize:12, color:"#9ca3af" }}>{count} <span style={{ fontSize:10 }}>({total?Math.round((count/total)*100):0}%)</span></span>
    </div>
    <div style={{ background:"#f1f5f9", borderRadius:8, height:8, overflow:"hidden" }}>
      <div style={{ width:`${total?(count/total)*100:0}%`, background:color, height:"100%", borderRadius:8, transition:"width .4s" }}/>
    </div>
  </div>
);

// ─── OVERLAY WRAPPER ───────────────────────────────────────────────────────────
const Overlay = ({ onClose, children, maxW = 540, zIndex = 1000 }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={onClose}>
    <div style={{ background:"#fff", borderRadius:20, padding:28, maxWidth:maxW, width:"100%", maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,.25)" }} onClick={e=>e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// ─── MODAL: PERFIL ─────────────────────────────────────────────────────────────
function ProfileModal({ candidate, isRecruiter, onClose, onSchedule, onEmail, onNavigateProfile }) {
  const [showRecs, setShowRecs] = useState(false);
  const [recs, setRecs]         = useState([]);

  useEffect(() => {
    if (!candidate?.id || !showRecs) return;
    const unsub = onSnapshot(
      query(collection(db, "recommendations"), where("toUserId","==",candidate.id)),
      snap => setRecs(snap.docs.map(d => ({ id:d.id, ...d.data() })))
    );
    return unsub;
  }, [candidate?.id, showRecs]);

  if (!candidate) return null;
  const emp = EMPLOYMENT_LABELS[candidate.employment_status || candidate.status] || EMPLOYMENT_LABELS.available;
  const exp = getEffectiveExp(candidate);

  const inp2 = { background:"#f1f5f9", borderRadius:10, padding:"8px 12px", fontSize:13, border:"none" };

  return (
    <Overlay onClose={onClose} maxW={560}>
      {showRecs ? (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h5 style={{ margin:0, fontWeight:800 }}>⭐ Recomendaciones — {candidate.name}</h5>
            <button onClick={()=>setShowRecs(false)} style={{ background:"none", border:"none", cursor:"pointer" }}><XIcon/></button>
          </div>
          {recs.length === 0 ? (
            <p style={{ color:"#9ca3af", fontSize:13 }}>Aún no hay recomendaciones.</p>
          ) : recs.map(r => (
            <div key={r.id} style={{ background:"#f8fafc", borderRadius:12, padding:"12px 16px", marginBottom:10, boxShadow:"3px 3px 8px #d1d9e6,-3px -3px 8px #fff" }}>
              <div style={{ fontWeight:700 }}>{r.fromName}</div>
              <div style={{ fontSize:12, color:"#6b7280", marginBottom:6 }}>{r.fromHeadline || ""}</div>
              {r.message && <p style={{ fontSize:13, color:"#374151", margin:0 }}>"{r.message}"</p>}
              {r.fromEmail && (
                <a href={`mailto:${r.fromEmail}`} style={{ fontSize:12, color:"#009330", display:"inline-flex", alignItems:"center", gap:4, marginTop:6, textDecoration:"none" }}>
                  <MailIcon/> Contactar
                </a>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
            <div>
              <h4 style={{ margin:0, fontWeight:800 }}>{candidate.name}</h4>
              <div style={{ fontSize:13, color:"#6b7280", marginTop:2 }}>{candidate.headline || ""}</div>
              <span style={{ fontSize:12, color:emp.color, fontWeight:600 }}>{emp.icon} {emp.label}</span>
            </div>
            <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><XIcon/></button>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:4 }}>
            <InfoBox label="Ciudad" value={candidate.location?.city || candidate.city}/>
            <InfoBox label="Nivel" value={candidate.level || candidate.professionalLevel}/>
            <InfoBox label="Experiencia calculada" value={fmtExp(exp)}/>
            <InfoBox label="Modalidad" value={candidate.preferences?.modality}/>
            <InfoBox label="Nivel académico" value={candidate.academicLevel}/>
            <InfoBox label="Género" value={candidate.gender}/>
            {isRecruiter && candidate.phone && <InfoBox label="📱 Teléfono" value={candidate.phone}/>}
            {isRecruiter && candidate.email  && <InfoBox label="📧 Email"   value={candidate.email}/>}
          </div>

          <SectionTitle>🎓 Educación</SectionTitle>
          {(candidate.education || []).map((e, i) => (
            <div key={i} style={{ fontSize:13, marginBottom:4 }}>
              <strong>{e.degree}</strong> — {e.institution}
              <span style={{ color:"#9ca3af" }}> ({e.startDate ? e.startDate.slice(0,4) : ""}{e.endDate ? "–"+e.endDate.slice(0,4) : ""})</span>
            </div>
          ))}

          <SectionTitle>💼 Experiencia laboral</SectionTitle>
          {(candidate.experience || []).map((ex, i) => {
            const s = ex.startDate ? new Date(ex.startDate) : null;
            const eD = ex.endDate  ? new Date(ex.endDate)  : null;
            let dur = "";
            if (s && eD) {
              const y = Math.floor((eD-s)/(1000*60*60*24*365.25));
              const m = Math.round(((eD-s)/(1000*60*60*24*30.44)) % 12);
              dur = `${y > 0 ? y+"a " : ""}${m > 0 ? m+"m" : ""}`;
            } else if (s) { dur = "Actual"; }
            return (
              <div key={i} style={{ fontSize:13, marginBottom:4 }}>
                <strong>{ex.role || ex.title}</strong>{ex.company ? ` en ${ex.company}` : ""}
                {dur && <span style={{ color:"#9ca3af" }}> · {dur}</span>}
              </div>
            );
          })}

          <SectionTitle>🛠️ Habilidades</SectionTitle>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
            {(candidate.skills || []).map(s => (
              <span key={s} style={{ background:"#f0fdf4", color:"#009330", border:"1px solid #bbf7d0", borderRadius:8, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{s}</span>
            ))}
          </div>

          {(candidate.certifications || []).length > 0 && (
            <>
              <SectionTitle>📜 Certificaciones</SectionTitle>
              {candidate.certifications.map((c,i) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" style={{ fontSize:13, color:"#009330", display:"block", marginBottom:4 }}>📄 {c.name}</a>
              ))}
            </>
          )}

          {candidate.motivation && (
            <>
              <SectionTitle>📝 Motivación</SectionTitle>
              <div style={{ fontSize:13, color:"#374151", marginBottom:10, whiteSpace:"pre-wrap" }}>{candidate.motivation}</div>
            </>
          )}

          {/* Botones de acción */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:16, paddingTop:16, borderTop:"1px solid #f1f5f9" }}>
            {onNavigateProfile && (
              <button onClick={()=>onNavigateProfile(candidate)} style={actionBtn("#f0fdf4","#009330")}>
                <UserIcon/> Ver perfil completo
              </button>
            )}
            {isRecruiter && (
              <>
                <button onClick={()=>setShowRecs(true)} style={actionBtn("#fef3c7","#92400e")}>
                  ⭐ Ver recomendaciones
                </button>
                {onSchedule && <button onClick={()=>{ onClose(); onSchedule(candidate); }} style={actionBtn("#eff6ff","#3fb1e2")}><CalIcon/> Programar entrevista</button>}
                {onEmail && <button onClick={()=>{ onClose(); onEmail(candidate); }} style={actionBtn("#f0fdf4","#009330")}><MailIcon/> Enviar correo</button>}
              </>
            )}
          </div>
        </>
      )}
    </Overlay>
  );
}
const actionBtn = (bg, color) => ({ padding:"7px 14px", borderRadius:10, border:"none", background:bg, color, fontWeight:600, cursor:"pointer", fontSize:12, display:"inline-flex", alignItems:"center", gap:5 });

// ─── MODAL: PROGRAMAR ENTREVISTA ───────────────────────────────────────────────
function ScheduleModal({ candidate, jobTitle, recruiterName, onClose, onConfirm }) {
  const [date, setDate]         = useState("");
  const [time, setTime]         = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote]         = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const valid = date && time;
  const inp = { width:"100%", borderRadius:12, border:"1.5px solid #e5e7eb", padding:"10px 14px", fontSize:13, boxSizing:"border-box", marginBottom:12, outline:"none" };

  return (
    <Overlay onClose={onClose} maxW={480}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h5 style={{ margin:0, fontWeight:800 }}>📅 Programar entrevista — {candidate?.name}</h5>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><XIcon/></button>
      </div>
      <p style={{ fontSize:13, color:"#6b7280", marginBottom:16 }}>Vacante: <strong>{jobTitle}</strong></p>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>Fecha</label>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={inp}/>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>Hora</label>
          <input type="time" value={time} onChange={e=>setTime(e.target.value)} style={inp}/>
        </div>
      </div>
      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>Lugar / Enlace (opcional)</label>
      <input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Sala A / https://meet.google.com/..." style={inp}/>
      <label style={{ fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 }}>Notas para el candidato (opcional)</label>
      <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Trae tu CV impreso, prepárate para una prueba técnica..." style={{ ...inp, minHeight:80, resize:"vertical" }}/>
      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, cursor:"pointer", marginBottom:20 }}>
        <input type="checkbox" checked={sendEmail} onChange={e=>setSendEmail(e.target.checked)}/>
        Notificar al candidato por correo
      </label>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
        <button disabled={!valid} onClick={()=>{ if(valid) onConfirm({ date, time, location, note, sendEmail }); }}
          style={{ flex:2, padding:"10px 0", borderRadius:12, border:"none", background:valid?"#009330":"#e5e7eb", color:valid?"#fff":"#9ca3af", fontWeight:700, cursor:valid?"pointer":"not-allowed" }}>
          ✓ Confirmar entrevista
        </button>
      </div>
    </Overlay>
  );
}

// ─── MODAL: POSTERGAR ENTREVISTA ───────────────────────────────────────────────
function PostponeModal({ candidate, onClose, onConfirm }) {
  const [reason, setReason]   = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const valid = reason.trim() && newDate;
  const inp = { width:"100%", borderRadius:12, border:"1.5px solid #e5e7eb", padding:"10px 14px", fontSize:13, boxSizing:"border-box", marginBottom:12, outline:"none" };

  return (
    <Overlay onClose={onClose} maxW={460}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h5 style={{ margin:0, fontWeight:800 }}>⏸️ Postergar entrevista — {candidate?.name}</h5>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><XIcon/></button>
      </div>
      <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>Motivo del postergamiento</label>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Ej: El reclutador tiene un conflicto de agenda..." style={{ ...inp, minHeight:80, resize:"vertical" }}/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        <div>
          <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>Nueva fecha</label>
          <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={inp}/>
        </div>
        <div>
          <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>Nueva hora</label>
          <input type="time" value={newTime} onChange={e=>setNewTime(e.target.value)} style={inp}/>
        </div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
        <button disabled={!valid} onClick={()=>{ if(valid) onConfirm({ reason, newDate, newTime }); }}
          style={{ flex:2, padding:"10px 0", borderRadius:12, border:"none", background:valid?"#f39000":"#e5e7eb", color:valid?"#fff":"#9ca3af", fontWeight:700, cursor:valid?"pointer":"not-allowed" }}>
          ⏸️ Postergar
        </button>
      </div>
    </Overlay>
  );
}

// ─── MODAL: ENVIAR CORREO ──────────────────────────────────────────────────────
function EmailModal({ candidate, defaultSubject = "", defaultBody = "", onClose, onSent }) {
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody]       = useState(defaultBody);
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const inp = { width:"100%", borderRadius:12, border:"1.5px solid #e5e7eb", padding:"10px 14px", fontSize:13, boxSizing:"border-box", marginBottom:12, outline:"none" };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) return;
    setSending(true);
    try {
      // Guarda registro del correo en Firestore
      await addDoc(collection(db, "emails"), {
        toUserId: candidate.id,
        toName: candidate.name,
        toEmail: candidate.email || "",
        subject, body,
        sentAt: serverTimestamp(),
      });
      // Notificación interna
      await addDoc(collection(db, "notifications"), {
        userId: candidate.id, message: `Nuevo correo: ${subject}`, read: false, createdAt: serverTimestamp(),
      });
      setSent(true);
      setTimeout(() => { onSent && onSent(); onClose(); }, 1500);
    } catch (e) { console.error(e); }
    setSending(false);
  };

  const mailtoLink = `mailto:${candidate.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <Overlay onClose={onClose} maxW={520}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h5 style={{ margin:0, fontWeight:800 }}>📧 Correo a {candidate?.name}</h5>
        <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer" }}><XIcon/></button>
      </div>
      {candidate.email && <p style={{ fontSize:12, color:"#6b7280", marginBottom:12 }}>Para: <strong>{candidate.email}</strong></p>}
      <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>Asunto</label>
      <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Asunto del correo" style={inp}/>
      <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:4 }}>Mensaje</label>
      <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Escribe tu mensaje aquí..." style={{ ...inp, minHeight:160, resize:"vertical" }}/>
      {sent ? (
        <div style={{ background:"#f0fdf4", color:"#009330", borderRadius:12, padding:"12px 16px", fontWeight:700, textAlign:"center" }}>✅ Correo enviado y registrado</div>
      ) : (
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
          {candidate.email && (
            <a href={mailtoLink} target="_blank" rel="noreferrer"
              style={{ flex:1, padding:"10px 0", borderRadius:12, border:"none", background:"#f1f5f9", color:"#374151", fontWeight:600, cursor:"pointer", fontSize:13, textDecoration:"none", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <MailIcon/> Abrir cliente
            </a>
          )}
          <button onClick={handleSend} disabled={!subject.trim() || !body.trim() || sending}
            style={{ flex:2, padding:"10px 0", borderRadius:12, border:"none", background:"#009330", color:"#fff", fontWeight:700, cursor:"pointer", opacity: (!subject.trim()||!body.trim()||sending)?0.6:1 }}>
            {sending ? "Enviando..." : "📨 Enviar y registrar"}
          </button>
        </div>
      )}
    </Overlay>
  );
}

// ─── MODAL: FINALIZAR ──────────────────────────────────────────────────────────
function FinalizeModal({ candidate, onClose, onFinalize }) {
  const [decision, setDecision]   = useState("accepted");
  const [reason, setReason]       = useState("");
  const [startDate, setStartDate] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const valid = reason.trim() && startDate && confirmed;
  const inp = { width:"100%", borderRadius:12, border:"1.5px solid #e5e7eb", padding:"10px 14px", fontSize:13, marginBottom:14, boxSizing:"border-box" };
  return (
    <Overlay onClose={onClose} zIndex={1100}>
      <h5 style={{ fontWeight:800, marginBottom:18 }}>Finalizar proceso — {candidate?.name}</h5>
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        {["accepted","rejected"].map(d => (
          <button key={d} onClick={()=>setDecision(d)} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"2px solid", borderColor:decision===d?(d==="accepted"?"#009330":"#f4323f"):"#e5e7eb", background:decision===d?(d==="accepted"?"#f0fdf4":"#fff5f5"):"#fff", color:decision===d?(d==="accepted"?"#009330":"#f4323f"):"#6b7280", fontWeight:700, cursor:"pointer" }}>
            {d==="accepted"?"✅ Aceptado":"❌ Rechazado"}
          </button>
        ))}
      </div>
      <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:5 }}>Motivo</label>
      <textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder={decision==="accepted"?"¿Por qué fue seleccionado?":"¿Por qué no fue seleccionado?"} style={{ ...inp, resize:"vertical", minHeight:80 }}/>
      <label style={{ fontSize:12, fontWeight:700, display:"block", marginBottom:5 }}>{decision==="accepted"?"Fecha de inicio":"Fecha de cierre"}</label>
      <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={inp}/>
      <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, cursor:"pointer", marginBottom:16 }}>
        <input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>
        Confirmo que esta decisión es definitiva
      </label>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={onClose} style={{ flex:1, padding:"10px 0", borderRadius:12, border:"1.5px solid #e5e7eb", background:"#fff", cursor:"pointer", fontWeight:600 }}>Cancelar</button>
        <button onClick={()=>{ if(valid){onFinalize({candidateId:candidate.id,decision,reason,startDate});onClose();}}} disabled={!valid}
          style={{ flex:2, padding:"10px 0", borderRadius:12, border:"none", background:valid?"#009330":"#e5e7eb", color:valid?"#fff":"#9ca3af", fontWeight:700, cursor:valid?"pointer":"not-allowed" }}>
          Finalizar proceso
        </button>
      </div>
    </Overlay>
  );
}

// ─── TAB: CREAR VACANTE ────────────────────────────────────────────────────────
// EXPANDIDO: recibe recruiterId (UID) además de recruiterName para guardarlo
// en el campo "createdBy" de la vacante. Sin este campo, sendRecruiterNotification
// en Vacantes.jsx no puede identificar al reclutador destinatario.
function CreateJobTab({ recruiterName, recruiterId, onCreated }) {
  const [form, setForm]       = useState({ ...EMPTY_JOB_FORM });
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [skillInput, setSkillInput] = useState("");

  const up = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addSkill = () => {
    const t = skillInput.trim();
    if (t && !form.skills_required.includes(t)) up("skills_required", [...form.skills_required, t]);
    setSkillInput("");
  };
  const removeSkill = s => up("skills_required", form.skills_required.filter(x => x !== s));

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "jobs"), {
        ...form,
        created_by: recruiterName || "Reclutador",
        // NUEVO: guardamos el UID del reclutador en "createdBy" para que
        // Vacantes.jsx pueda identificar al destinatario de las notificaciones.
        createdBy:  recruiterId || "",
        created_at: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });
      setSaved(true);
      setForm({ ...EMPTY_JOB_FORM });
      setTimeout(() => { setSaved(false); onCreated && onCreated(); }, 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const inp = { width:"100%", borderRadius:12, border:"1.5px solid #e5e7eb", padding:"10px 14px", fontSize:13, boxSizing:"border-box", outline:"none", marginBottom:12 };
  const sel = { ...inp, cursor:"pointer" };
  const card = { background:"#f8fafc", borderRadius:16, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #fff", padding:20, marginBottom:18 };
  const lbl  = { fontSize:12, fontWeight:700, color:"#374151", display:"block", marginBottom:4 };

  return (
    <div>
      <h4 style={{ fontWeight:800, marginBottom:4 }}>➕ Crear nueva vacante</h4>
      <p style={{ fontSize:13, color:"#6b7280", marginBottom:20 }}>La vacante aparecerá en la página pública de Vacantes y los postulantes podrán aplicar.</p>

      {saved && (
        <div style={{ background:"#f0fdf4", color:"#009330", borderRadius:14, padding:"14px 20px", fontWeight:700, marginBottom:18, textAlign:"center", fontSize:15 }}>
          ✅ ¡Vacante publicada exitosamente!
        </div>
      )}

      <div style={card}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#009330" }}>📋 Información principal</div>
        <label style={lbl}>Título del puesto *</label>
        <input value={form.title} onChange={e=>up("title",e.target.value)} placeholder="Ej: Analista de Riesgo Senior" style={inp}/>
        <label style={lbl}>Descripción completa *</label>
        <textarea value={form.description} onChange={e=>up("description",e.target.value)}
          placeholder="Describe las responsabilidades, el equipo, la cultura y todo lo relevante del puesto..."
          style={{ ...inp, minHeight:130, resize:"vertical" }}/>
        <label style={lbl}>Requisitos</label>
        <textarea value={form.requirements} onChange={e=>up("requirements",e.target.value)}
          placeholder="• 3 años de experiencia en análisis de riesgo&#10;• Conocimiento de normativa SBS&#10;• Excel avanzado"
          style={{ ...inp, minHeight:100, resize:"vertical" }}/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#3fb1e2" }}>⚙️ Condiciones</div>
          <label style={lbl}>Modalidad</label>
          <select value={form.modality} onChange={e=>up("modality",e.target.value)} style={sel}>
            <option>Presencial</option><option>Remoto</option><option>Híbrido</option>
          </select>
          <label style={lbl}>Tipo de jornada</label>
          <select value={form.type} onChange={e=>up("type",e.target.value)} style={sel}>
            <option>Full-time</option><option>Part-time</option><option>Practicante</option><option>Contrato</option>
          </select>
          <label style={lbl}>Nivel requerido</label>
          <select value={form.level} onChange={e=>up("level",e.target.value)} style={sel}>
            <option>No aplica</option><option>Junior</option><option>Mid</option><option>Senior</option><option>Practicante</option>
          </select>
          <label style={lbl}>Exp. mínima (años)</label>
          <input type="number" min={0} value={form.min_experience} onChange={e=>up("min_experience",Number(e.target.value))} style={inp}/>
        </div>

        <div style={card}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#f39000" }}>📍 Detalles</div>
          <label style={lbl}>Ciudad</label>
          <input value={form.city} onChange={e=>up("city",e.target.value)} placeholder="Lima" style={inp}/>
          <label style={lbl}>N° de plazas</label>
          <input type="number" min={1} value={form.vacancies} onChange={e=>up("vacancies",Number(e.target.value))} style={inp}/>
          <label style={lbl}>Rango salarial (opcional)</label>
          <input value={form.salary_range} onChange={e=>up("salary_range",e.target.value)} placeholder="S/ 3,000 – 4,500" style={inp}/>
          <label style={lbl}>Fecha límite de postulación</label>
          <input type="date" value={form.hiring_deadline} onChange={e=>up("hiring_deadline",e.target.value)} style={inp}/>
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:14 }}>🛠️ Skills requeridos</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
          {form.skills_required.map(s => (
            <span key={s} style={{ background:"#f0fdf4", color:"#009330", border:"1px solid #bbf7d0", borderRadius:20, padding:"4px 12px", fontSize:12, fontWeight:600, display:"inline-flex", alignItems:"center", gap:6 }}>
              {s}<span onClick={()=>removeSkill(s)} style={{ cursor:"pointer", fontSize:14, color:"#6b7280" }}>×</span>
            </span>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addSkill()} placeholder="Ej: Python, Análisis de riesgo..." style={{ ...inp, flex:1, marginBottom:0 }}/>
          <button onClick={addSkill} style={{ padding:"10px 18px", borderRadius:12, background:"#009330", color:"#fff", border:"none", fontWeight:700, cursor:"pointer", whiteSpace:"nowrap" }}>+ Agregar</button>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving || !form.title.trim() || !form.description.trim()}
        style={{ width:"100%", padding:"14px 0", borderRadius:14, border:"none", background:"#009330", color:"#fff", fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:"0 4px 14px rgba(0,147,48,.35)", opacity:(!form.title.trim()||!form.description.trim()||saving)?0.6:1 }}>
        {saving ? "Publicando..." : "🚀 Publicar vacante"}
      </button>
    </div>
  );
}

// ─── STATS TAB ─────────────────────────────────────────────────────────────────
function StatsTab({ candidates, jobs, applications, interviews, finalized, finalizedIds, selectedJob }) {
  const all = candidates;
  const COLORS = ["#009330","#3fb1e2","#f39000","#f4323f","#ffce00","#6b7280","#5db836","#a855f7"];

  // Nivel académico
  const eduLevelCounts = useMemo(() => {
    const map = {}; EDU_LEVELS.forEach(l=>(map[l]=0));
    all.forEach(c => {
      const degs = (c.education||[]).map(e=>(e.degree||"").toLowerCase());
      if      (degs.some(d=>d.includes("doctor")))                                           map["Doctor"]++;
      else if (degs.some(d=>d.includes("magíster")||d.includes("maestría")||d.includes("master"))) map["Magíster"]++;
      else if (degs.some(d=>d.includes("licenci")))                                          map["Licenciado"]++;
      else if (degs.some(d=>d.includes("egresado")))                                         map["Egresado"]++;
      else if (degs.some(d=>d.includes("bachiller")))                                        map["Bachiller"]++;
      else if (degs.some(d=>d.includes("técnico")||d.includes("tecnico")))                   map["Técnico"]++;
    });
    return map;
  },[all]);

  const careerCounts = useMemo(() => {
    const map={};
    all.forEach(c=>(c.education||[]).forEach(e=>{ if(e.degree) map[e.degree]=(map[e.degree]||0)+1; }));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);
  },[all]);

  const institutionCounts = useMemo(()=>{
    const map={};
    all.forEach(c=>(c.education||[]).forEach(e=>{ if(e.institution) map[e.institution]=(map[e.institution]||0)+1; }));
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,8);
  },[all]);

  const ageBuckets = useMemo(()=>{
    const buckets=[{label:"18–24",min:18,max:24,count:0},{label:"25–30",min:25,max:30,count:0},{label:"31–35",min:31,max:35,count:0},{label:"36–45",min:36,max:45,count:0},{label:"46+",min:46,max:99,count:0}];
    all.forEach(c=>{
      const age = c.birthYear ? new Date().getFullYear()-c.birthYear : (c.age ? Number(c.age) : null);
      if (!age) return;
      const b=buckets.find(b=>age>=b.min&&age<=b.max); if(b) b.count++;
    });
    return buckets.filter(b=>b.count>0);
  },[all]);

  const vacanteCandidates = useMemo(()=>{
    if(!selectedJob) return [];
    return applications.filter(a=>a.jobId===selectedJob.id).map(a=>candidates.find(c=>c.id===a.candidateId)).filter(Boolean);
  },[selectedJob,applications,candidates]);

  // Distribución de niveles tech en vacantes
  const techJobLevels = useMemo(()=>{
    const levels={Junior:0,Mid:0,Senior:0,Practicante:0,"No aplica":0};
    jobs.forEach(j=>{
      const lv = j.level || "No aplica";
      if (lv in levels) levels[lv]++;
      else levels["No aplica"]++;
    });
    return Object.entries(levels).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  },[jobs]);

  const techCandidateLevels = useMemo(()=>{
    const levels={Junior:0,Mid:0,Senior:0,Practicante:0};
    all.forEach(c=>{ const lv=c.professionalLevel||c.level; if(lv in levels) levels[lv]++; });
    return Object.entries(levels).filter(([,v])=>v>0).map(([name,value])=>({name,value}));
  },[all]);

  // Experiencia calculada
  const expBuckets = useMemo(()=>[
    {rango:"0 años",  count:all.filter(c=>getEffectiveExp(c)===0).length},
    {rango:"1–2 años",count:all.filter(c=>getEffectiveExp(c)>=1&&getEffectiveExp(c)<=2).length},
    {rango:"3–5 años",count:all.filter(c=>getEffectiveExp(c)>=3&&getEffectiveExp(c)<=5).length},
    {rango:"6–10 años",count:all.filter(c=>getEffectiveExp(c)>=6&&getEffectiveExp(c)<=10).length},
    {rango:"10+ años",count:all.filter(c=>getEffectiveExp(c)>10).length},
  ],[all]);

  const card = { background:"#f8fafc", borderRadius:16, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #fff", padding:20, marginBottom:18 };

  return (
    <div>
      <h4 style={{ fontWeight:800, marginBottom:6 }}>📈 Estadísticas — Vacante activa: <span style={{ color:"#009330" }}>{selectedJob?.title||"—"}</span></h4>
      <p style={{ color:"#9ca3af", fontSize:13, marginBottom:20 }}>Métricas de los candidatos postulados a esta vacante.</p>

      {/* KPIs vacante activa */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Postulantes" value={vacanteCandidates.length} color="#009330"/>
        <StatCard label="Match >80%" value={vacanteCandidates.filter(c=>calculateMatch(c,selectedJob)>80).length} color="#009330" subtitle="Alta compatibilidad"/>
        <StatCard label="Match 50–79%" value={vacanteCandidates.filter(c=>{const m=calculateMatch(c,selectedJob);return m>=50&&m<=79;}).length} color="#f39000" subtitle="Media compatibilidad"/>
        <StatCard label="En entrevista" value={interviews.filter(i=>!finalizedIds.includes(i.candidateId)).length} color="#3fb1e2"/>
        <StatCard label="Finalizados" value={finalized.length} color="#6b7280"/>
        <StatCard label="Aceptados" value={finalized.filter(f=>f.decision==="accepted").length} color="#009330"/>
      </div>

      {/* Educación postulantes */}
      {vacanteCandidates.length>0 && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>🎓 Nivel académico (postulantes)</div>
            {EDU_LEVELS.map(level=>{
              const count=vacanteCandidates.filter(c=>{const degs=(c.education||[]).map(e=>(e.degree||"").toLowerCase());return degs.some(d=>d.includes(level.toLowerCase().replace("ó","o").replace("é","e")));}).length;
              if(!count) return null;
              return <HBar key={level} label={level} count={count} total={vacanteCandidates.length} color="#009330"/>;
            })}
          </div>
          <div style={card}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>🏫 Instituciones (postulantes)</div>
            {(()=>{
              const instMap={};
              vacanteCandidates.forEach(c=>(c.education||[]).forEach(e=>{if(e.institution) instMap[e.institution]=(instMap[e.institution]||0)+1;}));
              return Object.entries(instMap).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([inst,count])=>(
                <HBar key={inst} label={inst} count={count} total={vacanteCandidates.length} color="#3fb1e2"/>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Niveles tech en vacantes y candidatos */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div style={{ ...card, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, alignSelf:"flex-start" }}>🧑💻 Distribución de niveles tech (vacantes)</div>
          {techJobLevels.length > 0 ? (
            <>
              <PieChart width={200} height={180}>
                <Pie data={techJobLevels} dataKey="value" nameKey="name" cx={100} cy={90} outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {techJobLevels.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:6 }}>
                {techJobLevels.map((b,i)=>(
                  <span key={b.name} style={{ fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i%COLORS.length], display:"inline-block" }}/>
                    {b.name} ({b.value})
                  </span>
                ))}
              </div>
            </>
          ) : <span style={{ fontSize:12, color:"#9ca3af" }}>Sin vacantes publicadas.</span>}
        </div>

        <div style={{ ...card, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, alignSelf:"flex-start" }}>👥 Distribución de niveles (candidatos)</div>
          {techCandidateLevels.length > 0 ? (
            <>
              <PieChart width={200} height={180}>
                <Pie data={techCandidateLevels} dataKey="value" nameKey="name" cx={100} cy={90} outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {techCandidateLevels.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip/>
              </PieChart>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:6 }}>
                {techCandidateLevels.map((b,i)=>(
                  <span key={b.name} style={{ fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i%COLORS.length], display:"inline-block" }}/>
                    {b.name} ({b.value})
                  </span>
                ))}
              </div>
            </>
          ) : <span style={{ fontSize:12, color:"#9ca3af" }}>Sin datos de nivel.</span>}
        </div>
      </div>

      {/* ══ GLOBALES ═══════════════════════════════════════════════════════════ */}
      <div style={{ borderTop:"2px dashed #e5e7eb", paddingTop:24, marginBottom:8 }}>
        <h4 style={{ fontWeight:800, marginBottom:4 }}>🌐 Estadísticas Globales</h4>
        <p style={{ color:"#9ca3af", fontSize:13, marginBottom:20 }}>Todos los candidatos registrados en la plataforma.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))", gap:12, marginBottom:22 }}>
        <StatCard label="Total candidatos" value={all.length} color="#009330"/>
        <StatCard label="Vacantes activas" value={jobs.length} color="#3fb1e2"/>
        <StatCard label="Disponibles" value={all.filter(c=>["available","searching"].includes(c.status)).length} color="#009330"/>
        <StatCard label="Abiertos a ofertas" value={all.filter(c=>c.status==="open").length} color="#3fb1e2"/>
        <StatCard label="No disponibles" value={all.filter(c=>["employed","working","not_searching"].includes(c.status)).length} color="#6b7280"/>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>🎓 Nivel académico (global)</div>
          {EDU_LEVELS.map(level=>{ const count=eduLevelCounts[level]||0; if(!count) return null; return <HBar key={level} label={level} count={count} total={all.length} color="#009330"/>; })}
        </div>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>📚 Carreras más frecuentes</div>
          {careerCounts.map(([career,count])=>(<HBar key={career} label={career} count={count} total={all.length} color="#5db836"/>))}
          {careerCounts.length===0 && <span style={{ fontSize:12, color:"#9ca3af" }}>Sin datos.</span>}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>🏫 Instituciones educativas</div>
          {institutionCounts.map(([inst,count])=>(<HBar key={inst} label={inst} count={count} total={all.length} color="#3fb1e2"/>))}
          {institutionCounts.length===0 && <span style={{ fontSize:12, color:"#9ca3af" }}>Sin datos.</span>}
        </div>
        <div style={{ ...card, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10, alignSelf:"flex-start" }}>🎂 Distribución de edades</div>
          {ageBuckets.length > 0 ? (
            <>
              <PieChart width={200} height={180}>
                <Pie data={ageBuckets} dataKey="count" nameKey="label" cx={100} cy={90} outerRadius={75} label={({label,percent})=>`${label} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {ageBuckets.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip formatter={(v,n)=>[v,n]}/>
              </PieChart>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginTop:6 }}>
                {ageBuckets.map((b,i)=>(
                  <span key={b.label} style={{ fontSize:11, display:"flex", alignItems:"center", gap:4 }}>
                    <span style={{ width:8, height:8, borderRadius:"50%", background:COLORS[i%COLORS.length], display:"inline-block" }}/>
                    {b.label} ({b.count})
                  </span>
                ))}
              </div>
            </>
          ) : <span style={{ fontSize:12, color:"#9ca3af", marginTop:20 }}>Sin datos de edad.</span>}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>📍 Candidatos por ciudad</div>
        {(()=>{ const cityMap={}; all.forEach(c=>{const city=c.location?.city||c.city||"Sin ciudad"; cityMap[city]=(cityMap[city]||0)+1;}); return Object.entries(cityMap).sort((a,b)=>b[1]-a[1]).map(([city,count])=>(<HBar key={city} label={city} count={count} total={all.length} color="#009330"/>)); })()}
      </div>

      <div style={card}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>💼 Experiencia acumulada — calculada desde fechas (global)</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={expBuckets} margin={{top:0,right:10,left:-20,bottom:0}}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
            <XAxis dataKey="rango" tick={{fontSize:11}}/>
            <YAxis tick={{fontSize:11}}/>
            <Tooltip/>
            <Bar dataKey="count" name="Candidatos" fill="#009330" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ ...card, textAlign:"center" }}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>⚧ Género (global)</div>
          <PieChart width={180} height={160}>
            <Pie data={[
              {name:"Mujeres",   value:all.filter(c=>c.gender==="mujer"||c.gender==="female").length},
              {name:"Hombres",   value:all.filter(c=>c.gender==="hombre"||c.gender==="male").length},
              {name:"No binario",value:all.filter(c=>c.gender==="no_binario").length},
            ].filter(d=>d.value>0)} dataKey="value" cx={90} cy={80} outerRadius={65}>
              <Cell fill="#009330"/><Cell fill="#3fb1e2"/><Cell fill="#a855f7"/>
            </Pie>
            <Tooltip/>
          </PieChart>
          <div style={{ fontSize:11, color:"#6b7280" }}>
            🟢 {all.filter(c=>c.gender==="mujer"||c.gender==="female").length} Mujeres &nbsp;
            🔵 {all.filter(c=>c.gender==="hombre"||c.gender==="male").length} Hombres &nbsp;
            🟣 {all.filter(c=>c.gender==="no_binario").length} NB
          </div>
        </div>
        <div style={card}>
          <div style={{ fontWeight:700, fontSize:13, marginBottom:14 }}>📊 Nivel profesional (global)</div>
          {["Practicante","Junior","Mid","Senior"].map(level=>{
            const count=all.filter(c=>(c.professionalLevel||c.level)===level).length;
            return <HBar key={level} label={level} count={count} total={all.length} color="#f39000"/>;
          })}
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile, logout, permissions } = useAuth();

  // ── Firebase state ──────────────────────────────────────────────────────────
  const [jobs,          setJobs]          = useState([]);
  const [fbCandidates,  setFbCandidates]  = useState([]);
  const [applications,  setApplications]  = useState([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [selectedJob,   setSelectedJob]   = useState(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [savedJobs,      setSavedJobs]      = useState([]);
  const [sortType,       setSortType]       = useState("recent");
  const [jobIndex,       setJobIndex]       = useState(0);
  const [jobSearch,      setJobSearch]      = useState("");
  const [filterExp,      setFilterExp]      = useState("all");
  const [filterCity,     setFilterCity]     = useState("all");
  const [filterLevel,    setFilterLevel]    = useState("all");
  const [currentPage,    setCurrentPage]    = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [activeTab,      setActiveTab]      = useState("panel");
  const [profileModal,   setProfileModal]   = useState(null);
  const [finalizeModal,  setFinalizeModal]  = useState(null);
  const [scheduleModal,  setScheduleModal]  = useState(null);
  const [emailModal,     setEmailModal]     = useState(null);
  const [postponeModal,  setPostponeModal]  = useState(null);
  const [interviews,     setInterviews]     = useState([]);
  const [finalized,      setFinalized]      = useState([]);
  const [trackRecruiter, setTrackRecruiter] = useState("all");
  const [trackStatus,    setTrackStatus]    = useState("all");

  // ── Merge Firebase + JSON local ─────────────────────────────────────────────
  const candidates = useMemo(()=>{
    const ids=new Set(fbCandidates.map(c=>c.id));
    const merged=[...fbCandidates];
    localCandidates.forEach(lc=>{ if(!ids.has(lc.id)) merged.push(lc); });
    return merged;
  },[fbCandidates]);

  const interviewIds    = useMemo(()=>interviews.map(i=>i.candidateId),[interviews]);
  const finalizedIds    = useMemo(()=>finalized.map(f=>f.candidateId),[finalized]);
  const recruiters      = useMemo(()=>[...new Set(interviews.map(i=>i.recruiter))],[interviews]);
  const activeInterviews= useMemo(()=>{
    let list=interviews.filter(i=>!finalizedIds.includes(i.candidateId));
    if(trackRecruiter!=="all") list=list.filter(i=>i.recruiter===trackRecruiter);
    if(trackStatus!=="all")    list=list.filter(i=>i.status===trackStatus);
    return list;
  },[interviews,finalizedIds,trackRecruiter,trackStatus]);

  // ── Firebase listeners (existentes) ─────────────────────────────────────────
  useEffect(()=>{
    const unsubJobs  = onSnapshot(collection(db,"jobs"), snap=>{
      const data=snap.docs.map(d=>({id:d.id,...d.data()}));
      setJobs(data);
      if(data.length>0&&!selectedJob) setSelectedJob(data[0]);
    });
    const qUsers     = query(collection(db,"users"),where("role","==","user"));
    const unsubUsers = onSnapshot(qUsers,snap=>setFbCandidates(snap.docs.map(d=>({id:d.id,...d.data()}))));
    const unsubApps  = onSnapshot(collection(db,"applications"),snap=>{
      setApplications(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoadingData(false);
    });
    return()=>{ unsubJobs(); unsubUsers(); unsubApps(); };
  },[]);// eslint-disable-line

  // ── NUEVO: Listener de entrevistas desde Firestore ──────────────────────────
  // Reemplaza el estado local (que se perdía al recargar).
  // Se filtra por recruiterId = UID del reclutador activo para no mezclar
  // entrevistas de distintos reclutadores.
  // Los campos persisten en Firestore y "checkInterviewReminders" en Vacantes.jsx
  // puede consultarlos correctamente desde la colección "interviews".
  useEffect(()=>{
    const recruiterId = profile?.uid || user?.uid;
    if (!recruiterId) return;
    const q = query(
      collection(db, "interviews"),
      where("recruiterId", "==", recruiterId)
    );
    const unsub = onSnapshot(q, snap => {
      setInterviews(snap.docs.map(d => ({ firestoreId: d.id, ...d.data() })));
    });
    return unsub;
  }, [profile?.uid, user?.uid]);// eslint-disable-line

  // Sync finalized from applications stored in Firestore so counts persist after reload
  useEffect(()=>{
    const f = applications
      .filter(a => a.status==="accepted" || a.status==="rejected")
      .map(a => ({
        candidateId: a.candidateId,
        decision: a.status,
        reason: a.reason || "",
        startDate: a.startDate || a.scheduledAt || "",
        finalizedAt: a.updatedAt || a.finalizedAt || new Date().toISOString(),
      }));
    setFinalized(f);
  },[applications]);


  // ── Jobs ordenados ──────────────────────────────────────────────────────────
  const sortedJobs = useMemo(()=>{
    let list=jobs.filter(j=>!jobSearch.trim()||j.title?.toLowerCase().includes(jobSearch.toLowerCase()));
    switch(sortType){
      case "recent": list.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); break;
      case "old":    list.sort((a,b)=>new Date(a.created_at)-new Date(b.created_at)); break;
      case "more":   list.sort((a,b)=>(b.vacancies||0)-(a.vacancies||0)); break;
      case "less":   list.sort((a,b)=>(a.vacancies||0)-(b.vacancies||0)); break;
      case "saved":  list=list.filter(j=>savedJobs.includes(j.id)); break;
      default: break;
    }
    return list;
  },[jobs,jobSearch,sortType,savedJobs]);

  useEffect(()=>{
    if(!sortedJobs.length) return;
    setSelectedJob(sortedJobs[Math.min(jobIndex,sortedJobs.length-1)]||sortedJobs[0]);
  },[sortedJobs,jobIndex]);

  const goPrevJob = ()=>setJobIndex(p=>p===0?sortedJobs.length-1:p-1);
  const goNextJob = ()=>setJobIndex(p=>p===sortedJobs.length-1?0:p+1);

  const remainingTime = useMemo(()=>{
    if(!selectedJob?.hiring_deadline) return "Sin fecha límite";
    const diff=new Date(selectedJob.hiring_deadline)-new Date();
    if(diff<=0) return "⚠️ Vencido";
    return `⏳ ${Math.ceil(diff/86400000)} días restantes`;
  },[selectedJob]);

  // ── Matches para vacante activa ─────────────────────────────────────────────
  const matches = useMemo(()=>{
    if(!selectedJob) return [];
    const appsToJob=applications.filter(a=>a.jobId===selectedJob.id);
    let result=appsToJob.map(app=>{
      const c=candidates.find(x=>x.id===app.candidateId);
      if(!c) return null;
      const exp=getEffectiveExp(c);
      return { ...c, applicationId:app.id, applicationStatus:app.status, motivation: app.motivation || "",
        match:calculateMatch(c,selectedJob), experience_years:exp,
        city:c.location?.city||"N/A", employment_status:c.status||"available" };
    }).filter(Boolean);
    if(filterExp!=="all") result=filterExp==="0"?result.filter(c=>c.experience_years===0):result.filter(c=>c.experience_years>=Number(filterExp));
    if(filterCity!=="all") result=result.filter(c=>c.city===filterCity);
    if(filterLevel!=="all") result=result.filter(c=>(c.professionalLevel||c.level)===filterLevel);
    return result.sort((a,b)=>b.match-a.match);
  },[selectedJob,candidates,applications,filterExp,filterCity,filterLevel]);

  const baseData        = matches.length?matches:candidates;
  const women           = baseData.filter(c=>c.gender==="mujer"||c.gender==="female").length;
  const men             = baseData.length-women;
  const pieData         = [{name:"Mujeres",value:women},{name:"Hombres",value:men}];
  const totalCandidates = baseData.length;

  const expRanges = useMemo(()=>{
    if(!baseData.length) return [];
    const vals=baseData.map(c=>getEffectiveExp(c));
    const minE=Math.min(...vals), maxE=Math.max(...vals);
    const size=Math.ceil((maxE-minE+1)/5)||1;
    return Array.from({length:5},(_,i)=>{
      const start=minE+i*size, end=start+size-1;
      return {start,end,count:baseData.filter(c=>getEffectiveExp(c)>=start&&getEffectiveExp(c)<=end).length};
    });
  },[baseData]);

  const totalApplicants  = useMemo(()=>applications.filter(a=>a.jobId===selectedJob?.id).length,[applications,selectedJob]);
  const availableCities  = useMemo(()=>[...new Set(candidates.map(c=>c.location?.city||c.city).filter(Boolean))].sort(),[candidates]);
  const availableLevels  = useMemo(()=>[...new Set(candidates.map(c=>c.professionalLevel||c.level).filter(Boolean))].sort(),[candidates]);
  const cityCounts       = useMemo(()=>{ const m={}; candidates.forEach(c=>{const city=c.location?.city||c.city; if(city) m[city]=(m[city]||0)+1;}); return m; },[candidates]);
  const levelCounts      = useMemo(()=>{ const m={}; candidates.forEach(c=>{const l=c.professionalLevel||c.level; if(l) m[l]=(m[l]||0)+1;}); return m; },[candidates]);
  const totalPages       = Math.ceil(matches.length/ITEMS_PER_PAGE);
  const paginatedMatches = matches.slice((currentPage-1)*ITEMS_PER_PAGE,currentPage*ITEMS_PER_PAGE);

  // ── Acciones (existentes) ───────────────────────────────────────────────────
  const toggleSavedJob = id=>setSavedJobs(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  // EXPANDIDO: además de actualizar el estado local (que ahora viene del listener
  // de Firestore), escribe/elimina el documento en la colección "interviews".
  // Esto permite que checkInterviewReminders en Vacantes.jsx encuentre las
  // entrevistas y genere recordatorios automáticos al reclutador.
  const toggleInterview = async (candidate) => {
    const recruiterId = profile?.uid || user?.uid;
    const existing = interviews.find(i => i.candidateId === candidate.id
      && i.jobId === selectedJob?.id);

    if (existing) {
      // Quitar del seguimiento: eliminar el doc de Firestore
      if (existing.firestoreId) {
        try { await deleteDoc(doc(db, "interviews", existing.firestoreId)); }
        catch(e){ console.error(e); }
      } else {
        setInterviews(prev => prev.filter(i => i.candidateId !== candidate.id));
      }
    } else {
      // Agregar al seguimiento: crear el doc en Firestore
      const newInterview = {
        candidateId:    candidate.id,
        candidateName:  candidate.name,
        candidateEmail: candidate.email || "",
        jobId:          selectedJob?.id  || "",
        jobTitle:       selectedJob?.title || "",
        // vacancyId y vacancyTitle son aliases usados por checkInterviewReminders
        vacancyId:      selectedJob?.id  || "",
        vacancyTitle:   selectedJob?.title || "",
        recruiter:      profile?.name || "Reclutador",
        recruiterId:    recruiterId || "",
        status:         "pending",
        assignedAt:     new Date().toISOString(),
        scheduledAt:    null,
        scheduledLocation: "",
      };
      try {
        await addDoc(collection(db, "interviews"), newInterview);
        // Notificación al reclutador: candidato añadido a seguimiento
        await createRecruiterNotification(db, {
          recruiterId,
          type:          "vacancy_activity",
          message:       `👤 ${candidate.name} fue añadido al seguimiento de entrevistas para "${selectedJob?.title || "una vacante"}".`,
          vacancyId:     selectedJob?.id   || "",
          vacancyTitle:  selectedJob?.title|| "",
          candidateName: candidate.name,
        });
      } catch(e){ console.error(e); }
    }
  };

  const updateInterviewStatus = async (candidateId, status) => {
    const recruiterId = profile?.uid || user?.uid;
    try {
      // Actualizar estado local (ya viene del listener, pero lo mantenemos por velocidad UI)
      setInterviews(prev => prev.map(i => i.candidateId === candidateId ? { ...i, status } : i));

      // NUEVO: actualizar el doc de Firestore en la colección "interviews"
      const interviewDoc = interviews.find(i => i.candidateId === candidateId);
      if (interviewDoc?.firestoreId) {
        await updateDoc(doc(db, "interviews", interviewDoc.firestoreId), { status });
      }

      const app = applications.find(a => a.candidateId === candidateId && a.jobId === selectedJob?.id);
      if (app) await updateDoc(doc(db, "applications", app.id), { status });

      // Notificación al candidato (existente, no se toca)
      const msg = status === "scheduled" ? "¡Entrevista coordinada!" : "Actualización en tu proceso.";
      await addDoc(collection(db, "notifications"), { userId: candidateId, message: msg, read: false, createdAt: serverTimestamp() });

      // NUEVO: Notificación al reclutador cuando la entrevista se marca como realizada
      if (status === "done" && recruiterId) {
        const iv = interviews.find(i => i.candidateId === candidateId);
        await createRecruiterNotification(db, {
          recruiterId,
          type:          "vacancy_activity",
          message:       `✅ Entrevista con ${iv?.candidateName || "el candidato"} para "${selectedJob?.title || "una vacante"}" marcada como realizada.`,
          vacancyId:     selectedJob?.id    || "",
          vacancyTitle:  selectedJob?.title || "",
          candidateName: iv?.candidateName  || "",
        });
      }
    } catch(e){ console.error(e); }
  };

  // ── Nuevas acciones ─────────────────────────────────────────────────────────
  const handleSchedule = async (candidate, scheduleData) => {
    const { date, time, location, note, sendEmail: doEmail } = scheduleData;
    const isoAt = `${date}T${time}`;
    const recruiterId = profile?.uid || user?.uid;

    setInterviews(prev => prev.map(i => i.candidateId === candidate.id
      ? { ...i, status:"scheduled", scheduledAt:isoAt, scheduledLocation:location, scheduledNote:note }
      : i
    ));

    try {
      // Actualizar aplicación (existente)
      const app = applications.find(a => a.candidateId === candidate.id && a.jobId === selectedJob?.id);
      if (app) await updateDoc(doc(db, "applications", app.id), { status:"scheduled", scheduledAt:isoAt });

      // NUEVO: Actualizar el doc de Firestore en la colección "interviews"
      // (los campos scheduledAt y status son los que checkInterviewReminders usa)
      const interviewDoc = interviews.find(i => i.candidateId === candidate.id);
      if (interviewDoc?.firestoreId) {
        await updateDoc(doc(db, "interviews", interviewDoc.firestoreId), {
          status:            "scheduled",
          scheduledAt:       isoAt,
          scheduledLocation: location || "",
          scheduledNote:     note    || "",
        });
      }

      // Notificación al candidato (existente, no se toca)
      await addDoc(collection(db, "notifications"), {
        userId: candidate.id,
        message: `📅 Entrevista programada para el ${date} a las ${time}`,
        read: false, createdAt: serverTimestamp(),
      });

      // NUEVO: Notificación al reclutador: entrevista agendada
      await createRecruiterNotification(db, {
        recruiterId,
        type:          "interview_reminder",
        message:       `📅 Entrevista agendada con ${candidate.name} para "${selectedJob?.title || "una vacante"}" el ${date} a las ${time}.${location ? " 📍 "+location : ""}`,
        vacancyId:     selectedJob?.id    || "",
        vacancyTitle:  selectedJob?.title || "",
        candidateName: candidate.name,
      });

      if (doEmail) {
        await addDoc(collection(db, "emails"), {
          toUserId: candidate.id, toName: candidate.name, toEmail: candidate.email || "",
          subject: "Entrevista programada — " + selectedJob?.title,
          body: `Hola ${candidate.name},\n\nTu entrevista ha sido programada para el ${date} a las ${time}.\n${location ? "Lugar/Enlace: "+location+"\n" : ""}${note ? "Notas: "+note+"\n" : ""}\nSaludos,\n${profile?.name || "Equipo RRHH"}`,
          sentAt: serverTimestamp(),
        });
      }
    } catch(e){ console.error(e); }
    setScheduleModal(null);
  };

  const handlePostpone = async (candidate, postponeData) => {
    const { reason, newDate, newTime } = postponeData;
    const isoAt = newDate ? `${newDate}T${newTime || "09:00"}` : "";
    const recruiterId = profile?.uid || user?.uid;

    setInterviews(prev => prev.map(i => i.candidateId === candidate.id
      ? { ...i, status:"pending", postponeReason:reason, postponedAt:new Date().toISOString(), ...(isoAt ? { scheduledAt:isoAt } : {}) }
      : i
    ));

    try {
      // NUEVO: actualizar el doc de Firestore en la colección "interviews"
      const interviewDoc = interviews.find(i => i.candidateId === candidate.id);
      if (interviewDoc?.firestoreId) {
        await updateDoc(doc(db, "interviews", interviewDoc.firestoreId), {
          status:        "pending",
          postponeReason: reason,
          postponedAt:   new Date().toISOString(),
          ...(isoAt ? { scheduledAt: isoAt } : {}),
        });
      }

      // Notificación al candidato (existente, no se toca)
      await addDoc(collection(db, "notifications"), {
        userId: candidate.id,
        message: `⏸️ Tu entrevista fue postergada. Motivo: ${reason}. Nueva fecha: ${newDate || "por confirmar"}`,
        read: false, createdAt: serverTimestamp(),
      });

      // NUEVO: Notificación al reclutador: entrevista postergada
      await createRecruiterNotification(db, {
        recruiterId,
        type:          "interview_reminder",
        message:       `⏸️ Entrevista con ${candidate.name} postergada. Motivo: "${reason}". ${newDate ? "Nueva fecha: "+newDate+(newTime ? " "+newTime : "") : "Fecha por confirmar."} Vacante: "${selectedJob?.title || "—"}".`,
        vacancyId:     selectedJob?.id    || "",
        vacancyTitle:  selectedJob?.title || "",
        candidateName: candidate.name,
      });

      if (candidate.candidateEmail || candidate.email) {
        await addDoc(collection(db, "emails"), {
          toUserId: candidate.id, toName: candidate.name,
          toEmail: candidate.candidateEmail || candidate.email || "",
          subject: "Reprogramación de entrevista — " + selectedJob?.title,
          body: `Hola ${candidate.name},\n\nLamentamos informarte que tu entrevista ha sido postergada.\n\nMotivo: ${reason}\n${newDate ? "Nueva fecha: "+newDate+" a las "+(newTime||"09:00")+"\n" : ""}\nTe contactaremos para confirmar los detalles.\n\nSaludos,\n${profile?.name || "Equipo RRHH"}`,
          sentAt: serverTimestamp(),
        });
      }
    } catch(e){ console.error(e); }
    setPostponeModal(null);
  };

  const handleFinalize = async ({ candidateId, decision, reason, startDate }) => {
    const recruiterId = profile?.uid || user?.uid;
    try {
      setFinalized(prev => [...prev, { candidateId, decision, reason, startDate, finalizedAt:new Date().toISOString() }]);
      const app = applications.find(a => a.candidateId === candidateId && a.jobId === selectedJob?.id);
      if (app) await updateDoc(doc(db, "applications", app.id), { status:decision, reason });

      // Notificación al candidato (existente, no se toca)
      const finalMsg = decision === "accepted" ? "¡Felicidades! Has sido aceptado." : "Gracias por participar, tu proceso ha finalizado.";
      await addDoc(collection(db, "notifications"), { userId:candidateId, message:finalMsg, type:decision, read:false, createdAt:serverTimestamp() });

      // NUEVO: Notificación al reclutador: proceso finalizado
      const iv = interviews.find(i => i.candidateId === candidateId);
      await createRecruiterNotification(db, {
        recruiterId,
        type:          "vacancy_activity",
        message:       `${decision === "accepted" ? "✅ Candidato aceptado" : "❌ Candidato rechazado"}: ${iv?.candidateName || "Candidato"} para "${selectedJob?.title || "una vacante"}". Motivo: ${reason}`,
        vacancyId:     selectedJob?.id    || "",
        vacancyTitle:  selectedJob?.title || "",
        candidateName: iv?.candidateName  || "",
      });
    } catch(e){ console.error(e); }
  };

  const navigateToProfile = useCallback(candidate=>{
    // Adaptar según el sistema de rutas del proyecto
    window.open(`/perfil/${candidate.id}`,"_blank");
  },[]);

  // ── Estilos ─────────────────────────────────────────────────────────────────
  const card  = { background:"#f8fafc", borderRadius:16, boxShadow:"6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff", padding:20, marginBottom:18 };
  const inp   = { borderRadius:12, border:"none", background:"#f1f5f9", boxShadow:"inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff", padding:"8px 12px", fontSize:13, outline:"none" };
  const btn   = (bg,color="#fff",extra={})=>({ padding:"7px 14px", borderRadius:10, border:"none", background:bg, color, fontWeight:600, cursor:"pointer", fontSize:13, transition:"all .2s", display:"inline-flex", alignItems:"center", gap:5, ...extra });
  const th    = { background:"#f1f5f9", padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:1, whiteSpace:"nowrap" };
  const td    = { padding:"10px 12px", fontSize:13, borderBottom:"1px solid #f1f5f9", verticalAlign:"middle" };
  const tabSt = active=>({ padding:"10px 14px", borderRadius:12, cursor:"pointer", fontSize:13, fontWeight:600, background:active?"#009330":"transparent", color:active?"#fff":"#9ca3af", transition:"all .2s", marginBottom:2, display:"flex", alignItems:"center", gap:6 });
  const matchBadge = match=>({ display:"inline-block", padding:"4px 10px", borderRadius:8, fontSize:12, fontWeight:700, background:match>80?"#009330":match>50?"#ffce00":"#cbd5e1", color:match>80?"#fff":"#000" });
  const CustomTooltip = ({active,payload})=>{ if(!active||!payload?.length) return null; return <div style={{ background:"#fff", borderRadius:10, padding:"8px 12px", boxShadow:"0 4px 20px rgba(0,0,0,.1)", fontSize:13 }}><strong>{payload[0].name}</strong><div>{payload[0].value} candidatos</div></div>; };

  const TABS = [
    { id:"panel",      label:"📊 Panel General" },
    { id:"stats",      label:"📈 Estadísticas" },
    { id:"tracking",   label:"⭐ Seguimiento" },
    { id:"create_job", label:"➕ Crear vacante" },
  ];

  const stConf = {
    pending:   { label:"⏳ Esperando",  color:"#f39000", bg:"#fff7ed" },
    scheduled: { label:"📅 Coordinada", color:"#3fb1e2", bg:"#eff6ff" },
    done:      { label:"✅ Realizada",  color:"#009330", bg:"#f0fdf4" },
  };

  return (
    <>
      {profileModal  && <ProfileModal  candidate={profileModal}  isRecruiter={permissions?.isRecruiter} onClose={()=>setProfileModal(null)} onSchedule={c=>setScheduleModal(c)} onEmail={c=>setEmailModal(c)} onNavigateProfile={navigateToProfile}/>}
      {finalizeModal && <FinalizeModal candidate={finalizeModal} onClose={()=>setFinalizeModal(null)} onFinalize={handleFinalize}/>}
      {scheduleModal && <ScheduleModal candidate={scheduleModal} jobTitle={selectedJob?.title} recruiterName={profile?.name} onClose={()=>setScheduleModal(null)} onConfirm={data=>handleSchedule(scheduleModal,data)}/>}
      {emailModal    && <EmailModal    candidate={emailModal}    onClose={()=>setEmailModal(null)} onSent={()=>setEmailModal(null)}/>}
      {postponeModal && <PostponeModal candidate={postponeModal} onClose={()=>setPostponeModal(null)} onConfirm={data=>handlePostpone(postponeModal,data)}/>}

      <div style={{ display:"flex", minHeight:"100vh", background:"linear-gradient(145deg,#eef2f7,#fff)", fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* SIDEBAR */}
        <aside style={{ width:230, minHeight:"100vh", background:"#111827", color:"#fff", padding:"24px 16px", display:"flex", flexDirection:"column", flexShrink:0 }}>
          <div style={{ fontSize:17, fontWeight:800, marginBottom:28, letterSpacing:.4 }}>
            <span style={{ color:"#009330" }}>Mi</span>Banco Talent
          </div>
          {TABS.map(t=>(
            <div key={t.id} style={tabSt(activeTab===t.id)} onClick={()=>setActiveTab(t.id)}>{t.label}</div>
          ))}
          <div style={{ marginTop:"auto", paddingTop:20, borderTop:"1px solid #1f2937" }}>
            {profile && <div style={{ fontSize:12, color:"#9ca3af", marginBottom:8 }}>👤 {profile.name||"Reclutador"}</div>}
            <button onClick={logout} style={{ background:"none", border:"none", color:"#f4323f", cursor:"pointer", fontSize:13, fontWeight:600, padding:0 }}>Cerrar sesión →</button>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex:1, padding:"28px 30px", overflowY:"auto" }}>
          <h2 style={{ margin:"0 0 4px 0", fontWeight:800, fontSize:22 }}>Dashboard RRHH 📊</h2>
          <p style={{ color:"#6b7280", marginBottom:22, fontSize:14 }}>Vacante activa: <strong>{selectedJob?.title||"—"}</strong></p>

          {!permissions?.isRecruiter ? (
            <div style={{ background:"#eff6ff", borderRadius:14, padding:20, color:"#3b82f6", fontWeight:600 }}>⚠️ No tienes acceso de reclutador.</div>
          ) : (
            <>
              {/* ══ PANEL GENERAL ══════════════════════════════════════════════ */}
              {activeTab==="panel" && (
                <>
                  <div style={{ ...card, position:"relative" }}>
                    <div style={{ position:"absolute", top:16, right:16 }}>
                      <StarIcon filled={savedJobs.includes(selectedJob?.id)} onClick={()=>toggleSavedJob(selectedJob?.id)} size={22}/>
                    </div>
                    <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6, background:"#f1f5f9", borderRadius:12, padding:"7px 12px", boxShadow:"inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff", flex:1, minWidth:180 }}>
                        <SearchIcon/>
                        <input value={jobSearch} onChange={e=>{setJobSearch(e.target.value);setJobIndex(0);}} placeholder="Buscar vacante..." style={{ border:"none", background:"transparent", outline:"none", fontSize:13, width:"100%" }}/>
                        {jobSearch && <span style={{ cursor:"pointer", color:"#9ca3af" }} onClick={()=>setJobSearch("")}><XIcon/></span>}
                      </div>
                      <select value={sortType} onChange={e=>setSortType(e.target.value)} style={{ ...inp, minWidth:160 }}>
                        <option value="recent">📅 Más recientes</option>
                        <option value="old">🕰️ Más antiguos</option>
                        <option value="more">📈 Más vacantes</option>
                        <option value="less">📉 Menos vacantes</option>
                        <option value="saved">⭐ Guardados</option>
                      </select>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
                      <button style={btn("#f1f5f9","#374151",{padding:"6px 10px"})} onClick={goPrevJob}><ChevronL/></button>
                      <div style={{ flex:1, textAlign:"center", fontWeight:700, fontSize:14 }}>
                        {selectedJob?.title}
                        <span style={{ color:"#9ca3af", fontWeight:400 }}> · {selectedJob?.city}</span>
                        <span style={{ fontSize:11, marginLeft:8, background:"#f0fdf4", color:"#009330", borderRadius:6, padding:"2px 8px", fontWeight:700 }}>{selectedJob?.status}</span>
                        {selectedJob?.level && selectedJob.level !== "No aplica" && (
                          <span style={{ fontSize:11, marginLeft:6, background:"#eff6ff", color:"#3fb1e2", borderRadius:6, padding:"2px 8px", fontWeight:700 }}>{selectedJob.level}</span>
                        )}
                      </div>
                      <button style={btn("#f1f5f9","#374151",{padding:"6px 10px"})} onClick={goNextJob}><ChevronR/></button>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:8, marginBottom:14 }}>
                      <InfoBox label="Skills requeridos" value={(selectedJob?.skills_required||[]).join(", ")}/>
                      <InfoBox label="Exp. mínima" value={`${selectedJob?.min_experience||0} años`}/>
                      <InfoBox label="Modalidad" value={selectedJob?.modality}/>
                      <InfoBox label="Tipo" value={selectedJob?.type}/>
                      {selectedJob?.salary_range && <InfoBox label="Salario" value={selectedJob.salary_range}/>}
                    </div>
                    {selectedJob?.description && (
                      <div style={{ background:"#f1f5f9", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#374151", marginBottom:10, lineHeight:1.6 }}>
                        {selectedJob.description.length > 300 ? selectedJob.description.slice(0,300)+"..." : selectedJob.description}
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:12, borderTop:"1px solid #f1f5f9", color:"#6b7280", fontSize:13, flexWrap:"wrap", gap:8 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:5 }}><UsersIcon/><span>Postulantes: <strong style={{ color:"#1f2937" }}>{totalApplicants}</strong></span></div>
                      <InfoBox label="Deadline" value={remainingTime}/>
                      <div style={{ fontSize:12 }}>Creado por: <strong>{selectedJob?.created_by}</strong></div>
                    </div>
                  </div>

                  {/* Gráficos rápidos */}
                  <div style={{ display:"grid", gridTemplateColumns:"200px 1fr", gap:16, marginBottom:18 }}>
                    <div style={{ ...card, textAlign:"center", padding:16 }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Género</div>
                      <PieChart width={168} height={168}>
                        <Pie data={pieData} dataKey="value" cx={84} cy={84} outerRadius={65}>
                          <Cell fill="#009330"/><Cell fill="#e0e0e0"/>
                        </Pie>
                        <Tooltip content={<CustomTooltip/>}/>
                      </PieChart>
                      <div style={{ fontSize:11, color:"#6b7280" }}>🟢 {women} M &nbsp; ⚫ {men} H</div>
                    </div>
                    <div style={{ ...card, padding:16 }}>
                      <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>Distribución de Experiencia (calculada)</div>
                      <div style={{ display:"flex", height:50, alignItems:"flex-end", gap:4 }}>
                        {expRanges.map((r,i)=>{
                          const pct=totalCandidates?(r.count/totalCandidates)*100:0;
                          return (
                            <div key={i} title={`${r.start.toFixed(0)}–${r.end.toFixed(0)} años · ${r.count} candidatos`}
                              style={{ flex:Math.max(pct,4), background:`rgba(0,147,48,${.2+(i/5)*.8})`, borderRadius:"6px 6px 0 0", display:"flex", alignItems:"flex-end", justifyContent:"center", minWidth:22, cursor:"default", transition:"all .2s" }}>
                              <span style={{ fontSize:10, color:"#fff", fontWeight:700, paddingBottom:3 }}>{r.count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display:"flex", gap:4, marginTop:4 }}>
                        {expRanges.map((r,i)=><div key={i} style={{ flex:1, fontSize:10, color:"#9ca3af", textAlign:"center" }}>{r.start.toFixed(0)}–{r.end.toFixed(0)}a</div>)}
                      </div>
                    </div>
                  </div>

                  {/* Filtros */}
                  <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
                    <select value={filterExp} onChange={e=>setFilterExp(e.target.value)} style={inp}>
                      <option value="all">— Experiencia —</option>
                      <option value="0">Sin experiencia</option>
                      <option value="1">1+ años</option>
                      <option value="2">2+ años</option>
                      <option value="5">5+ años</option>
                    </select>
                    <select value={filterCity} onChange={e=>setFilterCity(e.target.value)} style={inp}>
                      <option value="all">— Ciudad —</option>
                      {availableCities.map(c=><option key={c} value={c}>{c} ({cityCounts[c]||0})</option>)}
                    </select>
                    <select value={filterLevel} onChange={e=>setFilterLevel(e.target.value)} style={inp}>
                      <option value="all">— Nivel —</option>
                      {availableLevels.map(l=><option key={l} value={l}>{l} ({levelCounts[l]||0})</option>)}
                    </select>
                    <button style={btn("#ffce00","#000")} onClick={()=>{ setFilterExp("all"); setFilterCity("all"); setFilterLevel("all"); }}>↺ Restablecer</button>
                  </div>

                  {/* Tabla candidatos */}
                  <div style={{ ...card, padding:0, overflow:"hidden" }}>
                    <table style={{ width:"100%", borderCollapse:"collapse" }}>
                      <thead>
                        <tr>{["Candidato","Título / Carrera","Motivación","Skills match","Ciudad","Nivel","Estado","Exp.","Match","Acciones"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                      </thead>
                      <tbody>
                        {paginatedMatches.map(c=>{
                          const emp=EMPLOYMENT_LABELS[c.employment_status]||EMPLOYMENT_LABELS.available;
                          const hasInterview=interviewIds.includes(c.id);
                          const edu=c.education?.[0];
                          const matchedSkills=(selectedJob?.skills_required||[]).filter(s=>(c.skills||[]).map(sk=>sk.toLowerCase()).includes(s.toLowerCase()));
                          const expCalc=getEffectiveExp(c);
                          return (
                            <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="#fff"} style={{ background:"#fff", transition:"background .15s" }}>
                              <td style={td}>
                                <div style={{ fontWeight:700 }}>{c.name}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{c.academicLevel || ""}</div>
                              </td>
                              <td style={td}>
                                <div style={{ fontWeight:600 }}>{edu?.degree||"—"}</div>
                                <div style={{ fontSize:11, color:"#9ca3af" }}>{edu?.institution||""}</div>
                              </td>
                              <td style={td}>
                                <div style={{ fontSize:13, color:"#374151", maxWidth:320, whiteSpace:"pre-wrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                                  {c.motivation ? (c.motivation.length>200 ? c.motivation.slice(0,200)+"…" : c.motivation) : "—"}
                                </div>
                              </td>
                              <td style={td}>
                                <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                                  {matchedSkills.length
                                    ? matchedSkills.map(s=><span key={s} style={{ fontSize:10, background:"#f0fdf4", color:"#009330", border:"1px solid #bbf7d0", borderRadius:6, padding:"2px 6px", fontWeight:600 }}>{s}</span>)
                                    : <span style={{ fontSize:11, color:"#9ca3af" }}>—</span>}
                                </div>
                              </td>
                              <td style={td}>{c.city}</td>
                              <td style={td}><span style={{ fontSize:11, background:"#f1f5f9", borderRadius:8, padding:"3px 8px" }}>{c.professionalLevel||c.level||"—"}</span></td>
                              <td style={td}><span style={{ fontSize:11, fontWeight:600, color:emp.color }}>{emp.icon} {emp.label}</span></td>
                              <td style={td}><span style={{ fontSize:12, fontWeight:600, color:"#374151" }}>{fmtExp(expCalc)}</span></td>
                              <td style={td}><span style={matchBadge(c.match)}>{c.match}%</span></td>
                              <td style={{ ...td, minWidth:130 }}>
                                <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                                  <button title="Ver perfil" style={btn("#f1f5f9","#374151",{padding:"5px 8px"})} onClick={()=>setProfileModal(c)}><EyeIcon/></button>
                                  <button title={hasInterview?"Quitar entrevista":"Coordinar entrevista"}
                                    style={btn(hasInterview?"#f0fdf4":"#f1f5f9",hasInterview?"#009330":"#9ca3af",{padding:"5px 8px",border:hasInterview?"1.5px solid #bbf7d0":"1.5px solid transparent"})}
                                    onClick={()=>toggleInterview(c)}>
                                    <CheckIcon color={hasInterview?"#009330":"#9ca3af"}/>
                                  </button>
                                  {hasInterview && <button title="Programar entrevista" style={btn("#eff6ff","#3fb1e2",{padding:"5px 8px"})} onClick={()=>setScheduleModal(c)}><CalIcon/></button>}
                                  {hasInterview && <button title="Enviar correo" style={btn("#f0fdf4","#009330",{padding:"5px 8px"})} onClick={()=>setEmailModal(c)}><MailIcon/></button>}
                                  {hasInterview && <button title="Finalizar" style={btn("#fff5f5","#f4323f",{padding:"5px 8px",border:"1.5px solid #fecdd3"})} onClick={()=>setFinalizeModal(c)}><XIcon/></button>}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!paginatedMatches.length && (
                          <tr><td colSpan={9} style={{ ...td, textAlign:"center", color:"#9ca3af", padding:32 }}>Sin resultados con los filtros actuales.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:12, marginTop:14 }}>
                    <button style={btn("#f1f5f9","#374151",{padding:"6px 10px"})} disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}><ChevronL/></button>
                    <span style={{ fontSize:13, fontWeight:600 }}>{currentPage} / {totalPages||1}</span>
                    <button style={btn("#f1f5f9","#374151",{padding:"6px 10px"})} disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(p=>p+1)}><ChevronR/></button>
                  </div>
                </>
              )}

              {/* ══ ESTADÍSTICAS ═══════════════════════════════════════════════ */}
              {activeTab==="stats" && (
                <StatsTab candidates={candidates} jobs={jobs} applications={applications} interviews={interviews} finalized={finalized} finalizedIds={finalizedIds} selectedJob={selectedJob}/>
              )}

              {/* ══ SEGUIMIENTO ════════════════════════════════════════════════ */}
              {activeTab==="tracking" && (
                <div>
                  <h4 style={{ fontWeight:800, marginBottom:18 }}>⭐ Seguimiento de entrevistas</h4>
                  <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                    <select value={trackRecruiter} onChange={e=>setTrackRecruiter(e.target.value)} style={inp}>
                      <option value="all">— Reclutador —</option>
                      {recruiters.map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={trackStatus} onChange={e=>setTrackStatus(e.target.value)} style={inp}>
                      <option value="all">— Estado —</option>
                      <option value="pending">⏳ Esperando</option>
                      <option value="scheduled">📅 Coordinada</option>
                      <option value="done">✅ Realizada</option>
                    </select>
                    <button style={btn("#f1f5f9","#374151")} onClick={()=>{ setTrackRecruiter("all"); setTrackStatus("all"); }}>↺ Limpiar</button>
                  </div>

                  {activeInterviews.length===0 ? (
                    <div style={{ ...card, textAlign:"center", color:"#9ca3af", padding:40 }}>
                      No hay candidatos en seguimiento aún.<br/>
                      <span style={{ fontSize:12 }}>Usa el ✓ en la tabla para coordinar entrevistas.</span>
                    </div>
                  ) : (
                    <div style={{ ...card, padding:0, overflow:"hidden" }}>
                      <table style={{ width:"100%", borderCollapse:"collapse" }}>
                        <thead>
                          <tr>{["Candidato","Vacante","Reclutador","Fecha entrevista","Estado","Acciones"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {activeInterviews.map(iv=>{
                            const candidate=candidates.find(c=>c.id===iv.candidateId);
                            const st=stConf[iv.status]||stConf.pending;
                            const schedDate=iv.scheduledAt?new Date(iv.scheduledAt):null;
                            const schedFmt=schedDate?`${schedDate.toLocaleDateString("es-PE")} ${schedDate.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}`:null;
                            return (
                              <tr key={iv.candidateId} onMouseEnter={e=>e.currentTarget.style.background="#f9fafb"} onMouseLeave={e=>e.currentTarget.style.background="#fff"} style={{ background:"#fff" }}>
                                <td style={td}>
                                  <div style={{ fontWeight:700 }}>{iv.candidateName}</div>
                                  <div style={{ fontSize:11, color:"#9ca3af" }}>{candidate?.professionalLevel||candidate?.level} · {candidate?.location?.city||candidate?.city}</div>
                                  {iv.postponeReason && <div style={{ fontSize:10, color:"#f39000", marginTop:2 }}>⏸️ {iv.postponeReason}</div>}
                                </td>
                                <td style={{ ...td, fontSize:12 }}>{iv.jobTitle}</td>
                                <td style={{ ...td, fontSize:12 }}>{iv.recruiter}</td>
                                <td style={td}>
                                  {schedFmt
                                    ? <span style={{ fontSize:11, fontWeight:700, color:"#3fb1e2" }}>📅 {schedFmt}</span>
                                    : <span style={{ fontSize:11, color:"#9ca3af" }}>{new Date(iv.assignedAt).toLocaleDateString("es-PE")}</span>}
                                  {iv.scheduledLocation && <div style={{ fontSize:10, color:"#6b7280" }}>📍 {iv.scheduledLocation}</div>}
                                </td>
                                <td style={td}><span style={{ fontSize:11, fontWeight:700, color:st.color, background:st.bg, borderRadius:8, padding:"4px 10px" }}>{st.label}</span></td>
                                <td style={td}>
                                  <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                                    <button title="Ver perfil" style={btn("#f1f5f9","#374151",{padding:"5px 8px"})} onClick={()=>setProfileModal(candidate)}><EyeIcon/></button>
                                    <button title="Ver perfil completo" style={btn("#f0fdf4","#009330",{padding:"5px 8px",fontSize:11})} onClick={()=>navigateToProfile(candidate||{id:iv.candidateId})}>👤</button>
                                    <button title="Programar / reprogramar entrevista" style={btn("#eff6ff","#3fb1e2",{padding:"5px 8px"})} onClick={()=>setScheduleModal(candidate||{id:iv.candidateId,name:iv.candidateName})}><CalIcon/></button>
                                    <button title="Postergar entrevista" style={btn("#fff7ed","#f39000",{padding:"5px 8px"})} onClick={()=>setPostponeModal(candidate||{id:iv.candidateId,name:iv.candidateName,email:iv.candidateEmail})}><PauseIcon/></button>
                                    <button title="Enviar correo" style={btn("#f0fdf4","#009330",{padding:"5px 8px"})} onClick={()=>setEmailModal(candidate||{id:iv.candidateId,name:iv.candidateName,email:iv.candidateEmail})}><MailIcon/></button>
                                    {iv.status!=="done" && <button style={btn("#f0fdf4","#009330",{fontSize:11,padding:"5px 8px"})} onClick={()=>updateInterviewStatus(iv.candidateId,"done")}>✅</button>}
                                    {iv.status==="done" && <button style={btn("#fff5f5","#f4323f",{fontSize:11,padding:"5px 8px"})} onClick={()=>setFinalizeModal(candidate)}>Finalizar</button>}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {finalized.length > 0 && (
                    <>
                      <h5 style={{ fontWeight:800, marginTop:28, marginBottom:14 }}>📁 Procesos finalizados</h5>
                      <div style={{ ...card, padding:0, overflow:"hidden" }}>
                        <table style={{ width:"100%", borderCollapse:"collapse" }}>
                          <thead>
                            <tr>{["Candidato","Decisión","Motivo","Fecha","Inicio/Cierre"].map(h=><th key={h} style={th}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {finalized.map(f=>{
                              const c=candidates.find(x=>x.id===f.candidateId);
                              return (
                                <tr key={f.candidateId} style={{ background:"#fff" }}>
                                  <td style={td}><strong>{c?.name}</strong></td>
                                  <td style={td}><span style={{ fontSize:11, fontWeight:700, color:f.decision==="accepted"?"#009330":"#f4323f", background:f.decision==="accepted"?"#f0fdf4":"#fff5f5", borderRadius:8, padding:"4px 10px" }}>{f.decision==="accepted"?"✅ Aceptado":"❌ Rechazado"}</span></td>
                                  <td style={{ ...td, fontSize:12, color:"#6b7280", maxWidth:200 }}>{f.reason}</td>
                                  <td style={{ ...td, fontSize:11, color:"#9ca3af" }}>{new Date(f.finalizedAt).toLocaleDateString("es-PE")}</td>
                                  <td style={{ ...td, fontSize:11, color:"#9ca3af" }}>{f.startDate}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ══ CREAR VACANTE ══════════════════════════════════════════════ */}
              {activeTab==="create_job" && (
                <CreateJobTab
                  recruiterName={profile?.name}
                  recruiterId={profile?.uid || user?.uid}
                  onCreated={()=>setActiveTab("panel")}
                />
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}