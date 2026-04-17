import { useNotifications } from "../context/NotificationContext";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useMemo } from "react";
import { db } from "../firebase/config";
import {
  collection, addDoc, deleteDoc, updateDoc,
  doc, onSnapshot, query, where, serverTimestamp,
} from "firebase/firestore";

// ─── TIPOS DE REGLA ────────────────────────────────────────────────────────────
const RULE_TYPES = [
  { value: "count_threshold",   label: "Umbral de notificaciones", icon: "🔢", desc: "Alerta cuando el total de notificaciones supere un número." },
  { value: "vacancy_activity",  label: "Actividad por vacante",    icon: "📋", desc: "Recibe alertas de actividad asociada a una vacante específica." },
  { value: "vacancy_closed",    label: "Vacante cerrada",          icon: "🔒", desc: "Notificación cuando una vacante se cierre (incluso si la cerraste tú)." },
  { value: "open_vacancies",    label: "Vacantes abiertas",        icon: "📊", desc: "Alerta cuando el número de vacantes abiertas cambie." },
  { value: "interview_reminder",label: "Recordatorio de entrevista",icon: "📅", desc: "Aviso automático antes de una entrevista programada." },
];

const REMINDER_OPTIONS  = [
  { value: 1,  label: "1 día antes" },
  { value: 3,  label: "3 días antes" },
  { value: 7,  label: "1 semana antes" },
  { value: 14, label: "2 semanas antes" },
];

const THRESHOLD_OPTIONS = [10, 25, 50, 100, 200];

// ─── COLORES POR TIPO ──────────────────────────────────────────────────────────
const TYPE_COLORS = {
  count_threshold:   { bg: "#fef3c7", color: "#92400e", border: "#fde68a", icon: "🔢" },
  vacancy_activity:  { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", icon: "📋" },
  vacancy_closed:    { bg: "#fff5f5", color: "#b91c1c", border: "#fecaca", icon: "🔒" },
  open_vacancies:    { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: "📊" },
  interview_reminder:{ bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff", icon: "📅" },
  general:           { bg: "#f8fafc", color: "#374151", border: "#e5e7eb", icon: "🔔" },
};

// ─── ESTILOS COMPARTIDOS ───────────────────────────────────────────────────────
const inp = {
  borderRadius: 10, border: "none", background: "#f1f5f9",
  boxShadow: "inset 2px 2px 5px #d1d9e6,inset -2px -2px 5px #fff",
  padding: "9px 13px", fontSize: 13, outline: "none", color: "#1f2937",
  width: "100%", boxSizing: "border-box",
};

const card = {
  background: "#f8fafc", borderRadius: 14,
  boxShadow: "6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff",
  padding: "18px 20px", marginBottom: 14,
};

// ─── HELPERS ───────────────────────────────────────────────────────────────────
const formatDate = (n) => {
  try {
    const ts = n.createdAt?.toDate?.() || (n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000) : null);
    if (!ts) return "";
    return ts.toLocaleString("es-PE", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
};

const notifColors = (n) => (n.type && TYPE_COLORS[n.type]) ? TYPE_COLORS[n.type] : TYPE_COLORS.general;


// ═══════════════════════════════════════════════════════════════════════════════
// ─── TARJETA DE NOTIFICACIÓN (compartida) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationCard({ n, onMarkAsRead }) {
  const tc   = notifColors(n);
  const date = formatDate(n);

  return (
    <div
      onClick={() => !n.read && onMarkAsRead(n.id)}
      style={{
        background:   !n.read ? "#f0f7ff" : "#fff",
        borderRadius: 14,
        boxShadow:    "4px 4px 10px #d1d9e6,-4px -4px 10px #fff",
        padding:      "16px 18px",
        cursor:       !n.read ? "pointer" : "default",
        borderLeft:   !n.read ? "4px solid #3fb1e2" : "4px solid transparent",
        transition:   "all .2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
          {tc.icon}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges de tipo y vacante */}
          {n.type && (
            <span style={{ background: tc.bg, color: tc.color, border: `1px solid ${tc.border}`, borderRadius: 8, padding: "2px 9px", fontSize: 10, fontWeight: 700, marginBottom: 5, display: "inline-block" }}>
              {RULE_TYPES.find(r => r.value === n.type)?.label || n.type}
            </span>
          )}
          {n.vacancyTitle && (
            <span style={{ background: "#f1f5f9", color: "#374151", borderRadius: 8, padding: "2px 9px", fontSize: 10, fontWeight: 600, marginLeft: 6, display: "inline-block" }}>
              📋 {n.vacancyTitle}
            </span>
          )}

          {/* Mensaje */}
          <p style={{ margin: "6px 0 4px", fontWeight: !n.read ? 600 : 400, fontSize: 14, color: "#1f2937", lineHeight: 1.5 }}>
            {n.message}
          </p>

          {/* Metadata */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {date && <span style={{ fontSize: 11, color: "#9ca3af" }}>🕐 {date}</span>}
            {n.candidateName && (
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600 }}>👤 {n.candidateName}</span>
            )}
          </div>
        </div>

        {!n.read && (
          <span style={{ background: "#3fb1e2", color: "#fff", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
            Nueva
          </span>
        )}
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── LISTA VACÍA (compartida) ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function EmptyState({ totalCount, onClearFilters }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", background: "#f8fafc", borderRadius: 16, boxShadow: "6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{totalCount === 0 ? "🔔" : "🔍"}</div>
      <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>
        {totalCount === 0
          ? "No tienes notificaciones por ahora."
          : "Ninguna notificación coincide con los filtros."}
      </p>
      {totalCount > 0 && onClearFilters && (
        <button
          onClick={onClearFilters}
          style={{ marginTop: 16, padding: "9px 20px", borderRadius: 10, border: "none", background: "#009330", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── PANEL DE REGLAS (solo reclutadores) ──────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationRulesPanel({ userId }) {
  const [rules, setRules]         = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [vacancies, setVacancies] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    type: "count_threshold", enabled: true, threshold: 10,
    vacancyId: "", vacancyTitle: "", daysBeforeInterview: 1,
    notifyOnAny: true, openVacanciesLimit: 5,
  });

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(
      query(collection(db, "notificationRules"), where("userId", "==", userId)),
      snap => setRules(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    return onSnapshot(
      query(collection(db, "jobs"), where("createdBy", "==", userId)),
      snap => setVacancies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [userId]);

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { userId, type: form.type, enabled: form.enabled, createdAt: serverTimestamp(), config: {} };

      if (form.type === "count_threshold") {
        payload.config = { threshold: Number(form.threshold) };
      } else if (form.type === "vacancy_activity" || form.type === "vacancy_closed") {
        payload.config = {
          notifyOnAny:  form.notifyOnAny,
          vacancyId:    form.notifyOnAny ? "" : form.vacancyId,
          vacancyTitle: form.notifyOnAny ? "Todas las vacantes" : (vacancies.find(v => v.id === form.vacancyId)?.title || form.vacancyTitle),
        };
      } else if (form.type === "open_vacancies") {
        payload.config = { openVacanciesLimit: Number(form.openVacanciesLimit) };
      } else if (form.type === "interview_reminder") {
        payload.config = { daysBeforeInterview: Number(form.daysBeforeInterview) };
      }

      await addDoc(collection(db, "notificationRules"), payload);
      setShowForm(false);
      setForm({ type: "count_threshold", enabled: true, threshold: 10, vacancyId: "", vacancyTitle: "", daysBeforeInterview: 1, notifyOnAny: true, openVacanciesLimit: 5 });
    } catch (e) {
      console.error("Error guardando regla:", e);
    }
    setSaving(false);
  };

  const toggleRule = (ruleId, enabled) =>
    updateDoc(doc(db, "notificationRules", ruleId), { enabled: !enabled });

  const deleteRule = async (ruleId) => {
    if (!window.confirm("¿Eliminar esta regla?")) return;
    await deleteDoc(doc(db, "notificationRules", ruleId));
  };

  const ruleLabel = (rule) => {
    const cfg = rule.config || {};
    switch (rule.type) {
      case "count_threshold":    return `Alerta cuando superes ${cfg.threshold} notificaciones`;
      case "vacancy_activity":   return cfg.notifyOnAny ? "Actividad en cualquier vacante" : `Actividad en: ${cfg.vacancyTitle || cfg.vacancyId}`;
      case "vacancy_closed":     return cfg.notifyOnAny ? "Cuando se cierre cualquier vacante" : `Cierre de: ${cfg.vacancyTitle || cfg.vacancyId}`;
      case "open_vacancies":     return `Cuando el número de vacantes abiertas baje de ${cfg.openVacanciesLimit}`;
      case "interview_reminder": return `Recordatorio ${cfg.daysBeforeInterview === 1 ? "1 día" : `${cfg.daysBeforeInterview} días`} antes de entrevistas`;
      default:                   return "Regla de notificación";
    }
  };

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 800, fontSize: 16, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 }}>
            ⚙️ Reglas de notificación
          </h4>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
            Configura cuándo y cómo quieres ser notificado.
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: showForm ? "#f1f5f9" : "#009330", color: showForm ? "#374151" : "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: showForm ? "none" : "0 4px 12px rgba(0,147,48,.3)", transition: "all .2s" }}>
          {showForm ? "✕ Cancelar" : "+ Nueva regla"}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div style={{ ...card, border: "2px solid #bbf7d0", marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 14 }}>Nueva regla</div>

          {/* Tipo */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Tipo de alerta</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
              {RULE_TYPES.map(rt => (
                <button key={rt.value} onClick={() => updateForm("type", rt.value)}
                  style={{ padding: "10px 14px", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all .15s", background: form.type === rt.value ? "#f0fdf4" : "#f1f5f9", border: `2px solid ${form.type === rt.value ? "#009330" : "transparent"}`, color: form.type === rt.value ? "#009330" : "#374151" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{rt.icon} {rt.label}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 3 }}>{rt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Config por tipo */}
          <div style={{ background: "#f1f5f9", borderRadius: 12, padding: "14px 16px", marginBottom: 14 }}>
            {form.type === "count_threshold" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Umbral de notificaciones</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {THRESHOLD_OPTIONS.map(n => (
                    <button key={n} onClick={() => updateForm("threshold", n)}
                      style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, background: form.threshold === n ? "#009330" : "#fff", color: form.threshold === n ? "#fff" : "#374151", border: `2px solid ${form.threshold === n ? "#009330" : "#e5e7eb"}` }}>
                      {n}+
                    </button>
                  ))}
                  <input type="number" min="1" placeholder="Personalizado"
                    style={{ ...inp, width: 130 }}
                    value={THRESHOLD_OPTIONS.includes(form.threshold) ? "" : form.threshold}
                    onChange={e => updateForm("threshold", e.target.value)} />
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  Recibirás una alerta cuando acumules más de <strong>{form.threshold}</strong> notificaciones sin revisar.
                </div>
              </div>
            )}

            {(form.type === "vacancy_activity" || form.type === "vacancy_closed") && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Vacante objetivo</div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={form.notifyOnAny} onChange={e => updateForm("notifyOnAny", e.target.checked)} />
                  <span>Aplicar a <strong>todas mis vacantes</strong></span>
                </label>
                {!form.notifyOnAny && (
                  <select style={inp} value={form.vacancyId} onChange={e => updateForm("vacancyId", e.target.value)}>
                    <option value="">— Selecciona una vacante —</option>
                    {vacancies.map(v => (
                      <option key={v.id} value={v.id}>{v.title || v.id} ({v.status || "Sin estado"})</option>
                    ))}
                  </select>
                )}
                {form.type === "vacancy_closed" && (
                  <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 8, background: "#fff5f5", borderRadius: 8, padding: "8px 12px" }}>
                    ⚠️ Serás notificado incluso si fuiste tú quien cerró la vacante.
                  </div>
                )}
              </div>
            )}

            {form.type === "open_vacancies" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Alerta cuando las vacantes abiertas bajen de</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[1, 2, 3, 5, 10].map(n => (
                    <button key={n} onClick={() => updateForm("openVacanciesLimit", n)}
                      style={{ padding: "8px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, background: form.openVacanciesLimit === n ? "#009330" : "#fff", color: form.openVacanciesLimit === n ? "#fff" : "#374151", border: `2px solid ${form.openVacanciesLimit === n ? "#009330" : "#e5e7eb"}` }}>
                      {n}
                    </button>
                  ))}
                  <input type="number" min="1" placeholder="Personalizado"
                    style={{ ...inp, width: 130 }}
                    value={[1, 2, 3, 5, 10].includes(form.openVacanciesLimit) ? "" : form.openVacanciesLimit}
                    onChange={e => updateForm("openVacanciesLimit", Number(e.target.value))} />
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  También recibirás una notificación cuando <strong>no quede ninguna vacante abierta</strong>.
                </div>
              </div>
            )}

            {form.type === "interview_reminder" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>Tiempo de anticipación</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {REMINDER_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => updateForm("daysBeforeInterview", opt.value)}
                      style={{ padding: "9px 16px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: 13, background: form.daysBeforeInterview === opt.value ? "#7e22ce" : "#fff", color: form.daysBeforeInterview === opt.value ? "#fff" : "#374151", border: `2px solid ${form.daysBeforeInterview === opt.value ? "#7e22ce" : "#e5e7eb"}` }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  Se generará un recordatorio {form.daysBeforeInterview === 1 ? "el día anterior" : `${form.daysBeforeInterview} días antes`} de cada entrevista programada.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: "11px 0", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#f1f5f9", color: "#374151", fontWeight: 700, cursor: "pointer" }}>
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ flex: 2, padding: "11px 0", borderRadius: 12, border: "none", background: saving ? "#9ca3af" : "#009330", color: "#fff", fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", boxShadow: saving ? "none" : "0 4px 12px rgba(0,147,48,.3)" }}>
              {saving ? "Guardando..." : "✓ Guardar regla"}
            </button>
          </div>
        </div>
      )}

      {/* Lista de reglas */}
      {rules.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 20px", background: "#f8fafc", borderRadius: 14, color: "#9ca3af", border: "1.5px dashed #e5e7eb" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙️</div>
          <p style={{ fontSize: 13, margin: 0 }}>No tienes reglas configuradas.<br />Crea una para personalizar tus alertas.</p>
        </div>
      ) : (
        <div>
          {rules.map(rule => {
            const tc    = TYPE_COLORS[rule.type] || TYPE_COLORS.general;
            const rtype = RULE_TYPES.find(r => r.value === rule.type);
            return (
              <div key={rule.id}
                style={{ display: "flex", alignItems: "center", gap: 12, background: rule.enabled ? "#fff" : "#f9fafb", borderRadius: 12, padding: "12px 16px", marginBottom: 10, boxShadow: "3px 3px 8px #d1d9e6,-3px -3px 8px #fff", border: `1.5px solid ${rule.enabled ? tc.border : "#e5e7eb"}`, opacity: rule.enabled ? 1 : 0.65, transition: "all .2s" }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{tc.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#1f2937" }}>{rtype?.label}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{ruleLabel(rule)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  <button onClick={() => toggleRule(rule.id, rule.enabled)}
                    style={{ padding: "5px 12px", borderRadius: 8, border: `1.5px solid ${rule.enabled ? "#009330" : "#e5e7eb"}`, background: rule.enabled ? "#f0fdf4" : "#f1f5f9", color: rule.enabled ? "#009330" : "#9ca3af", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                    {rule.enabled ? "✓ Activa" : "Inactiva"}
                  </button>
                  <button onClick={() => deleteRule(rule.id)}
                    style={{ width: 30, height: 30, borderRadius: 8, border: "none", background: "#fff5f5", color: "#f4323f", cursor: "pointer", fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── BARRA DE FILTROS (solo reclutadores) ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
function FilterBar({ filters, setFilters, totalCount, filteredCount, vacancyOptions }) {
  const set = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const hasActive = filters.search || filters.readStatus !== "all" || filters.type !== "all" || filters.vacancyId || filters.dateFrom || filters.dateTo;

  return (
    <div style={{ background: "#f8fafc", borderRadius: 16, boxShadow: "6px 6px 12px #d1d9e6,-6px -6px 12px #ffffff", padding: "16px 20px", marginBottom: 20 }}>
      {/* Búsqueda + contador */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: 15 }}>🔍</span>
          <input
            style={{ ...inp, paddingLeft: 36 }}
            placeholder="Buscar en notificaciones..."
            value={filters.search}
            onChange={e => set("search", e.target.value)}
          />
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, whiteSpace: "nowrap" }}>
          {filteredCount} / {totalCount}
        </div>
        {hasActive && (
          <button
            onClick={() => setFilters({ search: "", readStatus: "all", type: "all", vacancyId: "", dateFrom: "", dateTo: "" })}
            style={{ padding: "8px 14px", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "#fff5f5", color: "#f4323f", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Filtros rápidos */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {[{ value: "all", label: "Todas" }, { value: "unread", label: "Sin leer" }, { value: "read", label: "Leídas" }].map(opt => (
          <button key={opt.value} onClick={() => set("readStatus", opt.value)}
            style={{ padding: "6px 14px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: 12, transition: "all .15s", background: filters.readStatus === opt.value ? "#009330" : "#f1f5f9", color: filters.readStatus === opt.value ? "#fff" : "#6b7280", border: `1.5px solid ${filters.readStatus === opt.value ? "#009330" : "transparent"}` }}>
            {opt.label}
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: "#e5e7eb", margin: "0 4px" }} />

        <select style={{ ...inp, width: "auto", fontSize: 12, padding: "6px 12px" }}
          value={filters.type} onChange={e => set("type", e.target.value)}>
          <option value="all">Todos los tipos</option>
          {RULE_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.icon} {rt.label}</option>)}
          <option value="general">🔔 General</option>
        </select>

        {vacancyOptions.length > 0 && (
          <select style={{ ...inp, width: "auto", fontSize: 12, padding: "6px 12px" }}
            value={filters.vacancyId} onChange={e => set("vacancyId", e.target.value)}>
            <option value="">Todas las vacantes</option>
            {vacancyOptions.map(v => <option key={v.id} value={v.id}>{v.title || v.id}</option>)}
          </select>
        )}

        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Desde</span>
          <input type="date" style={{ ...inp, width: 140, fontSize: 12, padding: "6px 10px" }}
            value={filters.dateFrom} onChange={e => set("dateFrom", e.target.value)} />
          <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Hasta</span>
          <input type="date" style={{ ...inp, width: 140, fontSize: 12, padding: "6px 10px" }}
            value={filters.dateTo} onChange={e => set("dateTo", e.target.value)} />
        </div>
      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function Notificaciones() {
  const { notifications, markAsRead } = useNotifications();
  const { user, permissions }         = useAuth();

  const isRecruiter = permissions?.isRecruiter || permissions?.isAdmin;

  // ── Estado solo para reclutadores ────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "", readStatus: "all", type: "all",
    vacancyId: "", dateFrom: "", dateTo: "",
  });
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [markingAll, setMarkingAll]         = useState(false);
  const [vacancyOptions, setVacancyOptions] = useState([]);

  // Cargar vacantes para el filtro (reclutadores)
  useEffect(() => {
    if (!isRecruiter || !user?.uid) return;
    return onSnapshot(
      query(collection(db, "jobs"), where("createdBy", "==", user.uid)),
      snap => setVacancyOptions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
  }, [isRecruiter, user?.uid]);

  // ── Filtrado (reclutadores) ───────────────────────────────────────────────
  const filteredNotifications = useMemo(() => {
    if (!isRecruiter) return notifications; // usuarios ven todas sin filtrar
    return notifications.filter(n => {
      if (filters.search && !n.message?.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.readStatus === "unread" && n.read)  return false;
      if (filters.readStatus === "read"   && !n.read) return false;
      if (filters.type !== "all" && n.type !== filters.type) return false;
      if (filters.vacancyId && n.vacancyId !== filters.vacancyId) return false;
      if (filters.dateFrom || filters.dateTo) {
        const ts = n.createdAt?.toDate?.() || (n.createdAt?.seconds ? new Date(n.createdAt.seconds * 1000) : null);
        if (ts) {
          if (filters.dateFrom && ts < new Date(filters.dateFrom)) return false;
          if (filters.dateTo   && ts > new Date(filters.dateTo + "T23:59:59")) return false;
        }
      }
      return true;
    });
  }, [notifications, filters, isRecruiter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(notifications.filter(n => !n.read).map(n => markAsRead(n.id)));
    } catch (e) {
      console.error(e);
    }
    setMarkingAll(false);
  };

  const clearFilters = () =>
    setFilters({ search: "", readStatus: "all", type: "all", vacancyId: "", dateFrom: "", dateTo: "" });

  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 16px", fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 22, color: "#1f2937", display: "flex", alignItems: "center", gap: 10 }}>
            🔔 Notificaciones
            {unreadCount > 0 && (
              <span style={{ background: "#f4323f", color: "#fff", borderRadius: 20, padding: "2px 10px", fontSize: 13, fontWeight: 800 }}>
                {unreadCount}
              </span>
            )}
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>
            {notifications.length} notificación{notifications.length !== 1 ? "es" : ""} en total
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* "Marcar todo" solo si hay no leídas — ambos roles */}
          {unreadCount > 0 && (
            <button onClick={handleMarkAll} disabled={markingAll}
              style={{ padding: "9px 18px", borderRadius: 12, border: "1.5px solid #bbf7d0", background: "#f0fdf4", color: "#009330", fontWeight: 700, fontSize: 13, cursor: markingAll ? "not-allowed" : "pointer" }}>
              {markingAll ? "Marcando..." : "✓ Marcar todo como leído"}
            </button>
          )}

          {/* Botón de reglas — solo reclutadores */}
          {isRecruiter && (
            <button onClick={() => setShowRulesPanel(s => !s)}
              style={{ padding: "9px 18px", borderRadius: 12, border: "none", background: showRulesPanel ? "#374151" : "#1f2937", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px rgba(31,41,55,.2)", display: "flex", alignItems: "center", gap: 7 }}>
              ⚙️ {showRulesPanel ? "Ocultar reglas" : "Configurar reglas"}
            </button>
          )}
        </div>
      </div>

      {/* ── PANEL DE REGLAS — solo reclutadores ────────────────────────────── */}
      {isRecruiter && showRulesPanel && (
        <div style={{ background: "#f8fafc", borderRadius: 20, boxShadow: "8px 8px 16px #d1d9e6,-8px -8px 16px #ffffff", padding: "24px", marginBottom: 28, border: "2px solid #e5e7eb" }}>
          <NotificationRulesPanel userId={user?.uid} />
        </div>
      )}

      {/* ── FILTROS — solo reclutadores ─────────────────────────────────────── */}
      {isRecruiter && (
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          totalCount={notifications.length}
          filteredCount={filteredNotifications.length}
          vacancyOptions={vacancyOptions}
        />
      )}

      {/* ── LISTA DE NOTIFICACIONES ─────────────────────────────────────────── */}
      {filteredNotifications.length === 0 ? (
        <EmptyState
          totalCount={notifications.length}
          onClearFilters={isRecruiter ? clearFilters : null}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredNotifications.map(n => (
            <NotificationCard key={n.id} n={n} onMarkAsRead={markAsRead} />
          ))}
        </div>
      )}

      {/* ── RESUMEN INFERIOR ─────────────────────────────────────────────────── */}
      {filteredNotifications.length > 0 && (
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <p style={{ fontSize: 12, color: "#9ca3af" }}>
            Mostrando {filteredNotifications.length} de {notifications.length} notificacion{notifications.length !== 1 ? "es" : ""}
            {unreadCount > 0 && ` · ${unreadCount} sin leer`}
          </p>
        </div>
      )}
    </div>
  );
}