// Dashboard.jsx — MiBanco Talent
// Reemplaza tu Dashboard.jsx actual con este archivo.
// Requiere: react, recharts, ../context/AuthContext
// Los datos de ejemplo están embebidos como mock; conéctalos a tus JSON/Firebase reales.

import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";

// ─── MOCK DATA (reemplaza con tus imports reales) ────────────────────────────
const jobsData = [
  { id: 1, title: "Frontend Developer", skills_required: ["React", "CSS", "TypeScript"], min_experience: 2, city: "Lima", modality: "Remoto", type: "Full-time", status: "Abierto", vacancies: 3, created_at: "2026-03-01", hiring_deadline: "2026-03-25", created_by: "Andrea Ramos" },
  { id: 2, title: "Backend Engineer", skills_required: ["Node.js", "PostgreSQL", "Docker"], min_experience: 3, city: "Lima", modality: "Híbrido", type: "Full-time", status: "Abierto", vacancies: 2, created_at: "2026-03-10", hiring_deadline: "2026-12-01", created_by: "Carlos Vega" },
  { id: 3, title: "Data Analyst", skills_required: ["Python", "SQL", "Power BI"], min_experience: 1, city: "Arequipa", modality: "Presencial", type: "Part-time", status: "Abierto", vacancies: 1, created_at: "2026-03-15", hiring_deadline: "2026-04-10", created_by: "Andrea Ramos" },
  { id: 4, title: "UX Designer", skills_required: ["Figma", "User Research", "Prototyping"], min_experience: 2, city: "Lima", modality: "Remoto", type: "Full-time", status: "Abierto", vacancies: 1, created_at: "2026-02-20", hiring_deadline: "2026-03-20", created_by: "Luis Torres" },
  { id: 5, title: "DevOps Engineer", skills_required: ["AWS", "Kubernetes", "CI/CD"], min_experience: 4, city: "Lima", modality: "Híbrido", type: "Full-time", status: "Abierto", vacancies: 2, created_at: "2026-03-05", hiring_deadline: "2026-04-05", created_by: "Carlos Vega" },
];

const candidatesData = [
  {
    id: 1,
    name: "María González",
    gender: "female",
    city: "Lima",
    education: [{ degree: "Ing. de Sistemas", institution: "UNI", year_end: 2020 }],
    experience_years: 3,
    level: "Mid",
    skills: ["React", "CSS", "JavaScript", "TypeScript"],

    applications: [
      {
        jobId: 1,
        jobTitle: "Frontend Developer",
        status: "applied",
        appliedAt: "2026-03-02"
      },
      {
        jobId: 4,
        jobTitle: "UX Designer",
        status: "interview",
        appliedAt: "2026-03-10"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Remoto" },
    experience: [
      { title: "Frontend Dev", company: "Startup X", years: 2 }
    ],
    certifications: ["AWS Cloud Practitioner"],
    employment_status: "employed_open",
    status: "Disponible"
  },

  {
    id: 2,
    name: "Carlos Mendoza",
    gender: "male",
    city: "Lima",
    education: [{ degree: "Ing. Informática", institution: "PUCP", year_end: 2019 }],
    experience_years: 5,
    level: "Senior",
    skills: ["Node.js", "PostgreSQL", "Docker", "AWS"],

    applications: [
      {
        jobId: 2,
        jobTitle: "Backend Engineer",
        status: "applied",
        appliedAt: "2026-03-12"
      },
      {
        jobId: 5,
        jobTitle: "DevOps Engineer",
        status: "interview",
        appliedAt: "2026-03-18"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Híbrido" },
    experience: [
      { title: "Backend Lead", company: "FinTech Z", years: 3 }
    ],
    certifications: ["Docker Certified"],
    employment_status: "employed_closed",
    status: "Empleado"
  },

  {
    id: 3,
    name: "Vanessa Ortiz",
    gender: "female",
    city: "Arequipa",
    education: [{ degree: "Contabilidad", institution: "UNSA", year_end: 2021 }],
    experience_years: 4,
    level: "Mid",
    skills: ["Excel", "SQL", "Power BI"],

    applications: [
      {
        jobId: 3,
        jobTitle: "Data Analyst",
        status: "applied",
        appliedAt: "2026-03-05"
      }
    ],

    job_preferences: { type: "Part-time", modality: "Híbrido" },
    experience: [
      { title: "Analista Jr", company: "Banco Regional", years: 4 }
    ],
    certifications: [],
    employment_status: "unemployed",
    status: "Disponible"
  },

  {
    id: 4,
    name: "Diego Palomino",
    gender: "male",
    city: "Lima",
    education: [{ degree: "Ciencias de la Computación", institution: "UTEC", year_end: 2022 }],
    experience_years: 2,
    level: "Junior",
    skills: ["React", "CSS", "Figma", "JavaScript"],

    applications: [
      {
        jobId: 1,
        jobTitle: "Frontend Developer",
        status: "interview",
        appliedAt: "2026-03-08"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Remoto" },
    experience: [
      { title: "Practicante Front", company: "Agencia Digital", years: 2 }
    ],
    certifications: ["Google UX"],
    employment_status: "unemployed",
    status: "Disponible"
  },

  {
    id: 5,
    name: "Lucía Ríos",
    gender: "female",
    city: "Lima",
    education: [{ degree: "Diseño Gráfico", institution: "Toulouse", year_end: 2020 }],
    experience_years: 4,
    level: "Mid",
    skills: ["Figma", "User Research", "Prototyping", "Adobe XD"],

    applications: [
      {
        jobId: 4,
        jobTitle: "UX Designer",
        status: "applied",
        appliedAt: "2026-03-03"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Remoto" },
    experience: [
      { title: "UX Lead", company: "Startup Creative", years: 2 }
    ],
    certifications: ["Nielsen UX"],
    employment_status: "employed_open",
    status: "Disponible"
  },

  {
    id: 6,
    name: "Rodrigo Castro",
    gender: "male",
    city: "Lima",
    education: [{ degree: "Ing. de Sistemas", institution: "UPC", year_end: 2018 }],
    experience_years: 6,
    level: "Senior",
    skills: ["AWS", "Kubernetes", "CI/CD", "Docker", "Terraform"],

    applications: [
      {
        jobId: 5,
        jobTitle: "DevOps Engineer",
        status: "applied",
        appliedAt: "2026-03-06"
      },
      {
        jobId: 2,
        jobTitle: "Backend Engineer",
        status: "rejected",
        appliedAt: "2026-02-28"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Híbrido" },
    experience: [
      { title: "DevOps Lead", company: "Fintech Global", years: 4 }
    ],
    certifications: ["AWS Solutions Architect", "CKA"],
    employment_status: "unemployed",
    status: "Disponible"
  },

  {
    id: 7,
    name: "Sofía Herrera",
    gender: "female",
    city: "Lima",
    education: [{ degree: "Estadística", institution: "UNMSM", year_end: 2021 }],
    experience_years: 2,
    level: "Junior",
    skills: ["Python", "SQL", "Excel"],

    applications: [
      {
        jobId: 3,
        jobTitle: "Data Analyst",
        status: "interview",
        appliedAt: "2026-03-11"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Remoto" },
    experience: [
      { title: "Analista de Datos Jr", company: "Retail SA", years: 2 }
    ],
    certifications: ["Python Data Science"],
    employment_status: "employed_open",
    status: "Disponible"
  },

  {
    id: 8,
    name: "Andrés Flores",
    gender: "male",
    city: "Trujillo",
    education: [{ degree: "Ing. Industrial", institution: "UNT", year_end: 2019 }],
    experience_years: 5,
    level: "Mid",
    skills: ["SQL", "Power BI", "Excel", "Python"],

    applications: [
      {
        jobId: 3,
        jobTitle: "Data Analyst",
        status: "applied",
        appliedAt: "2026-03-09"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Presencial" },
    experience: [
      { title: "Analista BI", company: "Minera Norte", years: 3 }
    ],
    certifications: [],
    employment_status: "unemployed",
    status: "Disponible"
  },

  {
    id: 9,
    name: "Paola Navarro",
    gender: "female",
    city: "Lima",
    education: [{ degree: "Comunicaciones", institution: "UdP", year_end: 2022 }],
    experience_years: 1,
    level: "Junior",
    skills: ["Figma", "CSS", "Canva"],

    applications: [
      {
        jobId: 4,
        jobTitle: "UX Designer",
        status: "applied",
        appliedAt: "2026-03-07"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Remoto" },
    experience: [
      { title: "Practicante UX", company: "Agencia MM", years: 1 }
    ],
    certifications: [],
    employment_status: "unemployed",
    status: "Disponible"
  },

  {
    id: 10,
    name: "Javier Salas",
    gender: "male",
    city: "Lima",
    education: [{ degree: "Ing. de Software", institution: "PUCP", year_end: 2017 }],
    experience_years: 8,
    level: "Senior",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "Docker"],

    applications: [
      {
        jobId: 1,
        jobTitle: "Frontend Developer",
        status: "interview",
        appliedAt: "2026-03-04"
      },
      {
        jobId: 2,
        jobTitle: "Backend Engineer",
        status: "applied",
        appliedAt: "2026-03-01"
      }
    ],

    job_preferences: { type: "Full-time", modality: "Híbrido" },
    experience: [
      { title: "Tech Lead", company: "Bank Fintech", years: 4 }
    ],
    certifications: ["AWS Developer"],
    employment_status: "employed_open",
    status: "Disponible"
  }
];

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const EMPLOYMENT_LABELS = {
  unemployed:      { label: "Desempleado",               color: "#f4323f", icon: "🔴" },
  employed_open:   { label: "Empleado · Abierto ofertas", color: "#f39000", icon: "🟡" },
  employed_closed: { label: "Empleado · No disponible",  color: "#6b7280", icon: "⚫" },
};

const calculateMatch = (c, job) => {
  if (!job) return 0;
  let score = 0;
  const cSkills = c.skills || [];
  const jSkills = job.skills_required || [];
  const matched = jSkills.filter(s => cSkills.includes(s)).length;
  score += jSkills.length ? (matched / jSkills.length) * 50 : 0;
  if ((c.experience_years || 0) >= (job.min_experience || 0)) score += 20;
  if ((c.city || "") === (job.city || "")) score += 15;
  if ((c.job_preferences?.modality || "") === (job.modality || "")) score += 15;
  return Math.round(score);
};

// ─── ICONS ───────────────────────────────────────────────────────────────────
const StarIcon = ({ filled, onClick, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "#f5b301" : "none"} stroke={filled ? "#f5b301" : "currentColor"} strokeWidth="2" style={{ cursor: "pointer" }} onClick={onClick}>
    <path d="M12 17.3l-6.18 3.7 1.64-7.03L2 9.24l7.19-.61L12 2l2.81 6.63 7.19.61-5.46 4.73 1.64 7.03z" />
  </svg>
);
const UsersIcon  = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClockIcon  = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const CheckIcon  = ({ color = "currentColor" }) => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const EyeIcon    = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const XIcon      = () => <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const SearchIcon = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const ChevronL   = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevronR   = () => <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>;

// ─── SUB-COMPONENTES ──────────────────────────────────────────────────────────
const InfoBox = ({ label, value }) => (
  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "8px 12px" }}>
    <div style={{ fontSize: 10, color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937" }}>{value || "—"}</div>
  </div>
);

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 8, marginTop: 14 }}>{children}</div>
);

// ─── MODAL: VER PERFIL ────────────────────────────────────────────────────────
function ProfileModal({ candidate, onClose }) {
  if (!candidate) return null;
  const emp = EMPLOYMENT_LABELS[candidate.employment_status] || EMPLOYMENT_LABELS.unemployed;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 520, width: "92%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800 }}>{candidate.name}</h4>
            <span style={{ fontSize: 12, color: emp.color, fontWeight: 600 }}>{emp.icon} {emp.label}</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><XIcon /></button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          <InfoBox label="Ciudad" value={candidate.city} />
          <InfoBox label="Nivel" value={candidate.level} />
          <InfoBox label="Experiencia" value={`${candidate.experience_years} años`} />
          <InfoBox label="Modalidad" value={candidate.job_preferences?.modality} />
        </div>

        <SectionTitle>🎓 Educación</SectionTitle>
        {(candidate.education || []).map((e, i) => (
          <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
            <strong>{e.degree}</strong> — {e.institution} <span style={{ color: "#9ca3af" }}>({e.year_end})</span>
          </div>
        ))}

        <SectionTitle>💼 Experiencia laboral</SectionTitle>
        {(candidate.experience || []).map((ex, i) => (
          <div key={i} style={{ fontSize: 13, marginBottom: 4 }}>
            <strong>{ex.title}</strong> en {ex.company} · <span style={{ color: "#9ca3af" }}>{ex.years} año{ex.years !== 1 ? "s" : ""}</span>
          </div>
        ))}

        <SectionTitle>🛠️ Habilidades</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {(candidate.skills || []).map(s => (
            <span key={s} style={{ background: "#f0fdf4", color: "#009330", border: "1px solid #bbf7d0", borderRadius: 8, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{s}</span>
          ))}
        </div>

        {(candidate.certifications || []).length > 0 && (
          <>
            <SectionTitle>📜 Certificaciones</SectionTitle>
            {candidate.certifications.map(c => <div key={c} style={{ fontSize: 13 }}>• {c}</div>)}
          </>
        )}
      </div>
    </div>
  );
}

// ─── MODAL: FINALIZAR PROCESO ─────────────────────────────────────────────────
function FinalizeModal({ candidate, onClose, onFinalize }) {
  const [decision,   setDecision]   = useState("accepted");
  const [reason,     setReason]     = useState("");
  const [startDate,  setStartDate]  = useState("");
  const [confirmed,  setConfirmed]  = useState(false);

  const valid = reason.trim() && startDate && confirmed;

  const handleSubmit = () => {
    if (!valid) return;
    onFinalize({ candidateId: candidate.id, decision, reason, startDate });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 28, maxWidth: 460, width: "92%", boxShadow: "0 20px 60px rgba(0,0,0,.3)" }} onClick={e => e.stopPropagation()}>
        <h5 style={{ fontWeight: 800, marginBottom: 18 }}>Finalizar proceso — {candidate?.name}</h5>

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {["accepted", "rejected"].map(d => (
            <button key={d} onClick={() => setDecision(d)} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "2px solid", borderColor: decision === d ? (d === "accepted" ? "#009330" : "#f4323f") : "#e5e7eb", background: decision === d ? (d === "accepted" ? "#f0fdf4" : "#fff5f5") : "#fff", color: decision === d ? (d === "accepted" ? "#009330" : "#f4323f") : "#6b7280", fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
              {d === "accepted" ? "✅ Aceptado" : "❌ Rechazado"}
            </button>
          ))}
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>Motivo</label>
        <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={decision === "accepted" ? "¿Por qué fue seleccionado?" : "¿Por qué no fue seleccionado?"} style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e5e7eb", padding: "10px 14px", fontSize: 13, resize: "vertical", minHeight: 80, marginBottom: 12, boxSizing: "border-box" }} />

        <label style={{ fontSize: 12, fontWeight: 700, display: "block", marginBottom: 5 }}>{decision === "accepted" ? "Fecha de inicio" : "Fecha de cierre"}</label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: "100%", borderRadius: 12, border: "1.5px solid #e5e7eb", padding: "10px 14px", fontSize: 13, marginBottom: 14, boxSizing: "border-box" }} />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", marginBottom: 16 }}>
          <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />
          Confirmo que esta decisión es definitiva
        </label>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontWeight: 600 }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={!valid} style={{ flex: 2, padding: "10px 0", borderRadius: 12, border: "none", background: valid ? "#009330" : "#e5e7eb", color: valid ? "#fff" : "#9ca3af", fontWeight: 700, cursor: valid ? "pointer" : "not-allowed", transition: "all .2s" }}>
            Finalizar proceso
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PRINCIPAL ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile, logout, permissions } = useAuth();

  const [jobs]       = useState(jobsData);
  const [candidates] = useState(candidatesData);

  const [selectedJob, setSelectedJob] = useState(jobsData[0]);
  const [matches,     setMatches]     = useState([]);
  const [savedJobs,   setSavedJobs]   = useState([]);
  const [sortType,    setSortType]    = useState("recent");
  const [jobIndex,    setJobIndex]    = useState(0);
  const [jobSearch,   setJobSearch]   = useState("");

  const [filterExp,   setFilterExp]   = useState("all");
  const [filterCity,  setFilterCity]  = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [activeTab,     setActiveTab]     = useState("panel");
  const [profileModal,  setProfileModal]  = useState(null);
  const [finalizeModal, setFinalizeModal] = useState(null);

  // Entrevistas coordinadas: { candidateId, candidateName, jobId, jobTitle, recruiter, status, assignedAt }
  const [interviews, setInterviews] = useState([]);
  // Finalizados (salen del flujo activo)
  const [finalized, setFinalized]   = useState([]);

  const interviewIds    = useMemo(() => interviews.map(i => i.candidateId), [interviews]);
  const finalizedIds    = useMemo(() => finalized.map(f => f.candidateId), [finalized]);

  // ── Filtros seguimiento ────────────────────────────────────────────────────
  const [trackRecruiter, setTrackRecruiter] = useState("all");
  const [trackStatus,    setTrackStatus]    = useState("all");
  const recruiters = useMemo(() => [...new Set(interviews.map(i => i.recruiter))], [interviews]);

  const activeInterviews = useMemo(() => {
    let list = interviews.filter(i => !finalizedIds.includes(i.candidateId));
    if (trackRecruiter !== "all") list = list.filter(i => i.recruiter === trackRecruiter);
    if (trackStatus    !== "all") list = list.filter(i => i.status    === trackStatus);
    return list;
  }, [interviews, finalizedIds, trackRecruiter, trackStatus]);

  // ── Jobs con búsqueda y orden ──────────────────────────────────────────────
  const sortedJobs = useMemo(() => {
    let list = jobs.filter(j => !jobSearch.trim() || j.title.toLowerCase().includes(jobSearch.toLowerCase()));
    switch (sortType) {
      case "recent": list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); break;
      case "old":    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case "more":   list.sort((a, b) => (b.vacancies || 0) - (a.vacancies || 0)); break;
      case "less":   list.sort((a, b) => (a.vacancies || 0) - (b.vacancies || 0)); break;
      case "saved":  list = list.filter(j => savedJobs.includes(j.id)); break;
    }
    return list;
  }, [jobs, jobSearch, sortType, savedJobs]);

  const goPrevJob = () => setJobIndex(p => (p === 0 ? sortedJobs.length - 1 : p - 1));
  const goNextJob = () => setJobIndex(p => (p === sortedJobs.length - 1 ? 0 : p + 1));

  useEffect(() => {
    if (!sortedJobs.length) return;
    setSelectedJob(sortedJobs[Math.min(jobIndex, sortedJobs.length - 1)] || sortedJobs[0]);
  }, [sortedJobs, jobIndex]);


  const remainingTime = useMemo(() => {
  if (!selectedJob?.hiring_deadline) return "Sin fecha límite";

  const today = new Date();
  const deadline = new Date(selectedJob.hiring_deadline);

  // diferencia en milisegundos
  const diff = deadline - today;

  // si ya venció
  if (diff <= 0) return "⚠️ Vencido";

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return `⏳ ${days} días restantes`;
}, [selectedJob]);

useEffect(() => {
  if (!selectedJob) return;

  let result = candidates
    .filter(c =>
      c.applications?.some(app => app.jobId === selectedJob.id)
    )
    .map(c => {
      const match = calculateMatch(c, selectedJob);
      const application = c.applications?.find(
  a => a.jobId === selectedJob.id
);

      return {
        ...c,
        match,
        applicationStatus: application?.status
      };
    });

  if (filterExp !== "all") {
    result = filterExp === "0"
      ? result.filter(c => c.experience_years === 0)
      : result.filter(c => c.experience_years >= Number(filterExp));
  }

  if (filterCity !== "all") result = result.filter(c => c.city === filterCity);
  if (filterLevel !== "all") result = result.filter(c => c.level === filterLevel);

  setMatches(result.sort((a, b) => b.match - a.match));
  setCurrentPage(1);
}, [selectedJob, filterExp, filterCity, filterLevel, candidates]);

  // ── Computed ───────────────────────────────────────────────────────────────
  const baseData        = matches.length ? matches : candidates;
  const women           = baseData.filter(c => c.gender === "female").length;
  const men             = baseData.length - women;
  const pieData         = [{ name: "Mujeres", value: women }, { name: "Hombres", value: men }];
  const totalCandidates = baseData.length;

  const expRanges = useMemo(() => {
    if (!baseData.length) return [];
    const vals = baseData.map(c => c.experience_years);
    const minE = Math.min(...vals), maxE = Math.max(...vals);
    const size = Math.ceil((maxE - minE + 1) / 5) || 1;
    return Array.from({ length: 5 }, (_, i) => {
      const start = minE + i * size, end = start + size - 1;
      return { start, end, count: baseData.filter(c => c.experience_years >= start && c.experience_years <= end).length };
    });
  }, [baseData]);

const totalApplicants = useMemo(() => {
  return candidates.filter(c =>
    c.applications?.some(app => app.jobId === selectedJob?.id)
  ).length;
}, [candidates, selectedJob]);

  const availableCities = useMemo(() => [...new Set(candidates.map(c => c.city))].sort(), [candidates]);
  const availableLevels = useMemo(() => [...new Set(candidates.map(c => c.level))].sort(), [candidates]);
  const cityCounts      = useMemo(() => { const m = {}; candidates.forEach(c => { m[c.city]  = (m[c.city]  || 0) + 1; }); return m; }, [candidates]);
  const levelCounts     = useMemo(() => { const m = {}; candidates.forEach(c => { m[c.level] = (m[c.level] || 0) + 1; }); return m; }, [candidates]);

  const totalPages        = Math.ceil(matches.length / ITEMS_PER_PAGE);
  const paginatedMatches  = matches.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // ── Acciones ───────────────────────────────────────────────────────────────
  const toggleSavedJob = id => setSavedJobs(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const toggleInterview = candidate => {
    setInterviews(prev => {
      if (prev.find(i => i.candidateId === candidate.id)) {
        return prev.filter(i => i.candidateId !== candidate.id);
      }
      return [...prev, {
        candidateId:   candidate.id,
        candidateName: candidate.name,
        jobId:         selectedJob?.id,
        jobTitle:      selectedJob?.title,
        recruiter:     profile?.name || "Reclutador",
        status:        "pending",
        assignedAt:    new Date().toISOString(),
      }];
    });
  };

  const updateInterviewStatus = (candidateId, status) =>
    setInterviews(prev => prev.map(i => i.candidateId === candidateId ? { ...i, status } : i));

  const handleFinalize = ({ candidateId, decision, reason, startDate }) =>
    setFinalized(prev => [...prev, { candidateId, decision, reason, startDate, finalizedAt: new Date().toISOString() }]);

  // ── Estilos ────────────────────────────────────────────────────────────────
  const card  = { background: "#f8fafc", borderRadius: 16, boxShadow: "6px 6px 12px #d1d9e6, -6px -6px 12px #ffffff", padding: 20, marginBottom: 18 };
  const inp   = { borderRadius: 12, border: "none", background: "#f1f5f9", boxShadow: "inset 2px 2px 5px #d1d9e6, inset -2px -2px 5px #fff", padding: "8px 12px", fontSize: 13, outline: "none" };
  const btn   = (bg, color = "#fff", extra = {}) => ({ padding: "7px 14px", borderRadius: 10, border: "none", background: bg, color, fontWeight: 600, cursor: "pointer", fontSize: 13, transition: "all .2s", display: "inline-flex", alignItems: "center", gap: 5, ...extra });
  const th    = { background: "#f1f5f9", padding: "10px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, whiteSpace: "nowrap" };
  const td    = { padding: "10px 12px", fontSize: 13, borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" };
  const tabSt = active => ({ padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, background: active ? "#009330" : "transparent", color: active ? "#fff" : "#9ca3af", transition: "all .2s", marginBottom: 2 });
  const badge = match => ({ display: "inline-block", padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, background: match > 80 ? "#009330" : match > 50 ? "#ffce00" : "#cbd5e1", color: match > 80 ? "#fff" : "#000" });

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: "#fff", borderRadius: 10, padding: "8px 12px", boxShadow: "0 4px 20px rgba(0,0,0,.1)", fontSize: 13 }}><strong>{payload[0].name}</strong><div>{payload[0].value} candidatos</div></div>;
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      {profileModal  && <ProfileModal  candidate={profileModal}  onClose={() => setProfileModal(null)} />}
      {finalizeModal && <FinalizeModal candidate={finalizeModal} onClose={() => setFinalizeModal(null)} onFinalize={handleFinalize} />}

      <div style={{ display: "flex", minHeight: "100vh", background: "linear-gradient(145deg,#eef2f7,#fff)", fontFamily: "'Inter',system-ui,sans-serif" }}>

        {/* ══ SIDEBAR ══ */}
        <aside style={{ width: 220, minHeight: "100vh", background: "#111827", color: "#fff", padding: "24px 16px", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 28, letterSpacing: 0.4 }}>
            <span style={{ color: "#009330" }}>Mi</span>Banco Talent
          </div>
          {[
            { id: "panel",    label: "📊 Panel General" },
            { id: "stats",    label: "📈 Estadísticas" },
            { id: "tracking", label: "⭐ Seguimiento" },
          ].map(t => <div key={t.id} style={tabSt(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</div>)}
          <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid #1f2937" }}>
            {profile && <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 8 }}>👤 {profile.name || "Reclutador"}</div>}
            <button onClick={logout} style={{ background: "none", border: "none", color: "#f4323f", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}>Cerrar sesión →</button>
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main style={{ flex: 1, padding: "28px 30px", overflowY: "auto" }}>
          <h2 style={{ margin: "0 0 4px 0", fontWeight: 800, fontSize: 22 }}>Dashboard RRHH 📊</h2>
          <p style={{ color: "#6b7280", marginBottom: 22, fontSize: 14 }}>Vacante activa: <strong>{selectedJob?.title}</strong></p>

          {!permissions.isRecruiter ? (
            <div style={{ background: "#eff6ff", borderRadius: 14, padding: 20, color: "#3b82f6", fontWeight: 600 }}>⚠️ No tienes acceso de reclutador.</div>
          ) : (
            <>

              {/* ════════════ PANEL GENERAL ════════════ */}
              {activeTab === "panel" && (
                <>
                  {/* ── VACANTE CARD ── */}
                  <div style={{ ...card, position: "relative" }}>
                    <div style={{ position: "absolute", top: 16, right: 16 }}>
                      <StarIcon filled={savedJobs.includes(selectedJob?.id)} onClick={() => toggleSavedJob(selectedJob?.id)} size={22} />
                    </div>

                    {/* Búsqueda + orden */}
                    <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f1f5f9", borderRadius: 12, padding: "7px 12px", boxShadow: "inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff", flex: 1, minWidth: 180 }}>
                        <SearchIcon />
                        <input value={jobSearch} onChange={e => { setJobSearch(e.target.value); setJobIndex(0); }} placeholder="Buscar vacante..." style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, width: "100%" }} />
                        {jobSearch && <span style={{ cursor: "pointer", color: "#9ca3af" }} onClick={() => setJobSearch("")}><XIcon /></span>}
                      </div>
                      <select value={sortType} onChange={e => setSortType(e.target.value)} style={{ ...inp, minWidth: 160 }}>
                        <option value="recent">📅 Más recientes</option>
                        <option value="old">🕰️ Más antiguos</option>
                        <option value="more">📈 Más vacantes</option>
                        <option value="less">📉 Menos vacantes</option>
                        <option value="saved">⭐ Guardados</option>
                      </select>
                    </div>

                    {/* Navegación */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                      <button style={btn("#f1f5f9", "#374151", { padding: "6px 10px" })} onClick={goPrevJob}><ChevronL /></button>
                      <div style={{ flex: 1, textAlign: "center", fontWeight: 700, fontSize: 14 }}>
                        {selectedJob?.title}
                        <span style={{ color: "#9ca3af", fontWeight: 400 }}> · {selectedJob?.city}</span>
                        <span style={{ fontSize: 11, marginLeft: 8, background: "#f0fdf4", color: "#009330", borderRadius: 6, padding: "2px 8px", fontWeight: 700 }}>{selectedJob?.status}</span>
                      </div>
                      <button style={btn("#f1f5f9", "#374151", { padding: "6px 10px" })} onClick={goNextJob}><ChevronR /></button>
                    </div>

                    {/* Detalle */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 14 }}>
                      <InfoBox label="Skills requeridos" value={(selectedJob?.skills_required || []).join(", ")} />
                      <InfoBox label="Exp. mínima" value={`${selectedJob?.min_experience} años`} />
                      <InfoBox label="Modalidad" value={selectedJob?.modality} />
                      <InfoBox label="Tipo" value={selectedJob?.type} />
                    </div>

                    {/* Footer stats */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid #f1f5f9", color: "#6b7280", fontSize: 13, flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}><UsersIcon /><span>Postulantes calificados: <strong style={{ color: "#1f2937" }}>{totalApplicants}</strong></span></div>
                     <InfoBox label="Deadline" value={remainingTime} />
                      <div style={{ fontSize: 12 }}>Creado por: <strong>{selectedJob?.created_by}</strong></div>
                    </div>
                  </div>

                  {/* ── GRÁFICOS ── */}
                  <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 16, marginBottom: 18 }}>
                    <div style={{ ...card, textAlign: "center", padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Género</div>
                      <PieChart width={168} height={168}>
                        <Pie data={pieData} dataKey="value" cx={84} cy={84} outerRadius={65}>
                          <Cell fill="#009330" />
                          <Cell fill="#e0e0e0" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>🟢 {women} M &nbsp; ⚫ {men} H</div>
                    </div>
                    <div style={{ ...card, padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>Distribución de Experiencia</div>
                      <div style={{ display: "flex", height: 50, alignItems: "flex-end", gap: 4 }}>
                        {expRanges.map((r, i) => {
                          const pct = totalCandidates ? (r.count / totalCandidates) * 100 : 0;
                          return (
                            <div key={i} title={`${r.start}-${r.end} años · ${r.count} candidatos`} style={{ flex: Math.max(pct, 4), background: `rgba(0,147,48,${0.2 + (i / 5) * 0.8})`, borderRadius: "6px 6px 0 0", display: "flex", alignItems: "flex-end", justifyContent: "center", minWidth: 22, cursor: "default", transition: "all .2s" }}>
                              <span style={{ fontSize: 10, color: "#fff", fontWeight: 700, paddingBottom: 3 }}>{r.count}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                        {expRanges.map((r, i) => <div key={i} style={{ flex: 1, fontSize: 10, color: "#9ca3af", textAlign: "center" }}>{r.start}-{r.end}a</div>)}
                      </div>
                    </div>
                  </div>

                  {/* ── FILTROS ── */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <select value={filterExp}   onChange={e => setFilterExp(e.target.value)}   style={inp}>
                      <option value="all">— Experiencia —</option>
                      <option value="0">Sin experiencia</option>
                      <option value="1">1+ años</option>
                      <option value="2">2+ años</option>
                      <option value="5">5+ años</option>
                    </select>
                    <select value={filterCity}  onChange={e => setFilterCity(e.target.value)}  style={inp}>
                      <option value="all">— Ciudad —</option>
                      {availableCities.map(c => <option key={c} value={c}>{c} ({cityCounts[c]})</option>)}
                    </select>
                    <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={inp}>
                      <option value="all">— Nivel —</option>
                      {availableLevels.map(l => <option key={l} value={l}>{l} ({levelCounts[l]})</option>)}
                    </select>
                    <button style={btn("#ffce00", "#000")} onClick={() => { setFilterExp("all"); setFilterCity("all"); setFilterLevel("all"); }}>↺ Restablecer</button>
                  </div>

                  {/* ── TABLA CANDIDATOS ── */}
                  <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>
                          {["Candidato", "Título / Carrera", "Skills match", "Ciudad", "Nivel", "Estado laboral", "Match", "Acciones"].map(h => <th key={h} style={th}>{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMatches.map(c => {
                          const emp          = EMPLOYMENT_LABELS[c.employment_status] || EMPLOYMENT_LABELS.unemployed;
                          const hasInterview = interviewIds.includes(c.id);
                          const edu          = c.education?.[0];
                          const matchedSkills = (selectedJob?.skills_required || []).filter(s => (c.skills || []).includes(s));
                          return (
                            <tr key={c.id} onMouseEnter={e => e.currentTarget.style.background="#f9fafb"} onMouseLeave={e => e.currentTarget.style.background="#fff"} style={{ background: "#fff", transition: "background .15s" }}>
                              <td style={td}>
                                <div style={{ fontWeight: 700 }}>{c.name}</div>
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{c.experience_years} años exp.</div>
                              </td>
                              <td style={td}>
                                <div style={{ fontWeight: 600 }}>{edu?.degree || "—"}</div>
                                <div style={{ fontSize: 11, color: "#9ca3af" }}>{edu?.institution || ""}</div>
                              </td>
                              <td style={td}>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                  {matchedSkills.length
                                    ? matchedSkills.map(s => <span key={s} style={{ fontSize: 10, background: "#f0fdf4", color: "#009330", border: "1px solid #bbf7d0", borderRadius: 6, padding: "2px 6px", fontWeight: 600 }}>{s}</span>)
                                    : <span style={{ fontSize: 11, color: "#9ca3af" }}>—</span>}
                                </div>
                              </td>
                              <td style={td}>{c.city}</td>
                              <td style={td}><span style={{ fontSize: 11, background: "#f1f5f9", borderRadius: 8, padding: "3px 8px" }}>{c.level}</span></td>
                              <td style={td}><span style={{ fontSize: 11, fontWeight: 600, color: emp.color }}>{emp.icon} {emp.label}</span></td>
                              <td style={td}><span style={badge(c.match)}>{c.match}%</span></td>
                              <td style={{ ...td, minWidth: 115 }}>
                                <div style={{ display: "flex", gap: 5 }}>
                                  {/* Ver perfil */}
                                  <button title="Ver perfil" style={btn("#f1f5f9", "#374151", { padding: "5px 8px" })} onClick={() => setProfileModal(c)}><EyeIcon /></button>
                                  {/* Coordinar / quitar entrevista */}
                                  <button
                                    title={hasInterview ? "Entrevista coordinada (click para quitar)" : "Coordinar entrevista"}
                                    style={btn(hasInterview ? "#f0fdf4" : "#f1f5f9", hasInterview ? "#009330" : "#9ca3af", { padding: "5px 8px", border: hasInterview ? "1.5px solid #bbf7d0" : "1.5px solid transparent" })}
                                    onClick={() => toggleInterview(c)}
                                  >
                                    <CheckIcon color={hasInterview ? "#009330" : "#9ca3af"} />
                                  </button>
                                  {/* Finalizar (solo si ya tiene entrevista) */}
                                  {hasInterview && (
                                    <button title="Finalizar proceso" style={btn("#fff5f5", "#f4323f", { padding: "5px 8px", border: "1.5px solid #fecdd3" })} onClick={() => setFinalizeModal(c)}><XIcon /></button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!paginatedMatches.length && (
                          <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: "#9ca3af", padding: 32 }}>Sin resultados con los filtros actuales</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Paginación */}
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 14 }}>
                    <button style={btn("#f1f5f9", "#374151", { padding: "6px 10px" })} disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><ChevronL /></button>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{currentPage} / {totalPages || 1}</span>
                    <button style={btn("#f1f5f9", "#374151", { padding: "6px 10px" })} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}><ChevronR /></button>
                  </div>
                </>
              )}

              {/* ════════════ ESTADÍSTICAS ════════════ */}
              {activeTab === "stats" && (
                <div>
                  <h4 style={{ fontWeight: 800, marginBottom: 20 }}>📈 Estadísticas generales</h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginBottom: 22 }}>
                    {[
                      { label: "Candidatos activos",    value: candidates.filter(c => !finalizedIds.includes(c.id)).length, color: "#009330" },
                      { label: "Vacantes abiertas",     value: jobs.length,       color: "#3fb1e2" },
                      { label: "En proceso entrevista", value: interviews.filter(i => !finalizedIds.includes(i.candidateId)).length, color: "#f39000" },
                      { label: "Procesos finalizados",  value: finalized.length,  color: "#6b7280" },
                      { label: "Aceptados",  value: finalized.filter(f => f.decision === "accepted").length, color: "#009330" },
                      { label: "Rechazados", value: finalized.filter(f => f.decision === "rejected").length, color: "#f4323f" },
                    ].map(s => (
                      <div key={s.label} style={{ ...card, textAlign: "center", padding: "18px 12px", marginBottom: 0 }}>
                        <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={card}>
                    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Candidatos por ciudad</div>
                    {Object.entries(cityCounts).map(([city, count]) => (
                      <div key={city} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 80, fontSize: 13, fontWeight: 600 }}>{city}</div>
                        <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                          <div style={{ width: `${(count / candidates.length) * 100}%`, background: "#009330", height: "100%", borderRadius: 8 }} />
                        </div>
                        <div style={{ fontSize: 12, color: "#9ca3af", minWidth: 24 }}>{count}</div>
                      </div>
                    ))}
                  </div>

                  <div style={card}>
                    <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Estado laboral</div>
                    {Object.entries(EMPLOYMENT_LABELS).map(([key, val]) => {
                      const count = candidates.filter(c => c.employment_status === key).length;
                      return (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                          <div style={{ width: 210, fontSize: 12, fontWeight: 600, color: val.color }}>{val.icon} {val.label}</div>
                          <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 8, height: 10, overflow: "hidden" }}>
                            <div style={{ width: `${(count / candidates.length) * 100}%`, background: val.color, height: "100%", borderRadius: 8 }} />
                          </div>
                          <div style={{ fontSize: 12, color: "#9ca3af", minWidth: 24 }}>{count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ════════════ SEGUIMIENTO ════════════ */}
              {activeTab === "tracking" && (
                <div>
                  <h4 style={{ fontWeight: 800, marginBottom: 18 }}>⭐ Seguimiento de entrevistas</h4>

                  {/* Filtros */}
                  <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                    <select value={trackRecruiter} onChange={e => setTrackRecruiter(e.target.value)} style={inp}>
                      <option value="all">— Reclutador —</option>
                      {recruiters.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={trackStatus} onChange={e => setTrackStatus(e.target.value)} style={inp}>
                      <option value="all">— Estado —</option>
                      <option value="pending">⏳ Esperando entrevista</option>
                      <option value="scheduled">📅 Entrevista coordinada</option>
                      <option value="done">✅ Entrevista realizada</option>
                    </select>
                    <button style={btn("#f1f5f9", "#374151")} onClick={() => { setTrackRecruiter("all"); setTrackStatus("all"); }}>↺ Limpiar</button>
                  </div>

                  {/* Tabla seguimiento */}
                  {activeInterviews.length === 0 ? (
                    <div style={{ ...card, textAlign: "center", color: "#9ca3af", padding: 40 }}>
                      No hay candidatos en seguimiento aún.<br />
                      <span style={{ fontSize: 12 }}>Usa el ✓ en la tabla de candidatos para coordinar una entrevista.</span>
                    </div>
                  ) : (
                    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                          <tr>{["Candidato", "Vacante", "Reclutador", "Asignado", "Estado", "Acciones"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                          {activeInterviews.map(iv => {
                            const candidate = candidates.find(c => c.id === iv.candidateId);
                            const stConf = {
                              pending:   { label: "⏳ Esperando",   color: "#f39000", bg: "#fff7ed" },
                              scheduled: { label: "📅 Coordinada",  color: "#3fb1e2", bg: "#eff6ff" },
                              done:      { label: "✅ Realizada",   color: "#009330", bg: "#f0fdf4" },
                            };
                            const st = stConf[iv.status] || stConf.pending;
                            return (
                              <tr key={iv.candidateId} onMouseEnter={e => e.currentTarget.style.background="#f9fafb"} onMouseLeave={e => e.currentTarget.style.background="#fff"} style={{ background: "#fff" }}>
                                <td style={td}>
                                  <div style={{ fontWeight: 700 }}>{iv.candidateName}</div>
                                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{candidate?.level} · {candidate?.city}</div>
                                </td>
                                <td style={{ ...td, fontSize: 12 }}>{iv.jobTitle}</td>
                                <td style={{ ...td, fontSize: 12 }}>{iv.recruiter}</td>
                                <td style={{ ...td, fontSize: 11, color: "#9ca3af" }}>{new Date(iv.assignedAt).toLocaleDateString("es-PE")}</td>
                                <td style={td}><span style={{ fontSize: 11, fontWeight: 700, color: st.color, background: st.bg, borderRadius: 8, padding: "4px 10px" }}>{st.label}</span></td>
                                <td style={td}>
                                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                                    <button style={btn("#f1f5f9", "#374151", { padding: "5px 8px" })} onClick={() => setProfileModal(candidate)}><EyeIcon /></button>
                                    {iv.status !== "scheduled" && (
                                      <button style={btn("#eff6ff", "#3fb1e2", { fontSize: 12, padding: "5px 10px" })} onClick={() => updateInterviewStatus(iv.candidateId, "scheduled")}>📅 Coordinar</button>
                                    )}
                                    {iv.status !== "done" && (
                                      <button style={btn("#f0fdf4", "#009330", { fontSize: 12, padding: "5px 10px" })} onClick={() => updateInterviewStatus(iv.candidateId, "done")}>✅ Realizada</button>
                                    )}
                                    {iv.status === "done" && (
                                      <button style={btn("#fff5f5", "#f4323f", { fontSize: 12, padding: "5px 10px" })} onClick={() => setFinalizeModal(candidate)}>Finalizar</button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Procesos finalizados */}
                  {finalized.length > 0 && (
                    <>
                      <h5 style={{ fontWeight: 800, marginTop: 28, marginBottom: 14 }}>📁 Procesos finalizados</h5>
                      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>{["Candidato", "Decisión", "Motivo", "Fecha", "Inicio/Cierre"].map(h => <th key={h} style={th}>{h}</th>)}</tr>
                          </thead>
                          <tbody>
                            {finalized.map(f => {
                              const c = candidates.find(x => x.id === f.candidateId);
                              return (
                                <tr key={f.candidateId} style={{ background: "#fff" }}>
                                  <td style={td}><strong>{c?.name}</strong></td>
                                  <td style={td}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: f.decision === "accepted" ? "#009330" : "#f4323f", background: f.decision === "accepted" ? "#f0fdf4" : "#fff5f5", borderRadius: 8, padding: "4px 10px" }}>
                                      {f.decision === "accepted" ? "✅ Aceptado" : "❌ Rechazado"}
                                    </span>
                                  </td>
                                  <td style={{ ...td, fontSize: 12, color: "#6b7280", maxWidth: 200 }}>{f.reason}</td>
                                  <td style={{ ...td, fontSize: 11, color: "#9ca3af" }}>{new Date(f.finalizedAt).toLocaleDateString("es-PE")}</td>
                                  <td style={{ ...td, fontSize: 11, color: "#9ca3af" }}>{f.startDate}</td>
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
            </>
          )}
        </main>
      </div>
    </>
  );
}