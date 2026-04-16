import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { doc, updateDoc } from "firebase/firestore";
import "../styles/Perfil.css";

export default function Perfil() {
  const { user, profile } = useAuth();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  // 🔄 INIT SEGURO
  useEffect(() => {
    if (profile) {
      setForm({
        ...profile,
        skills: profile.skills || [],
        experience: profile.experience || [],
        education: profile.education || [],
        links: profile.links || {},
        preferences: profile.preferences || {},
        location: profile.location || { city: "", country: "Perú" }
      });
    }
  }, [profile]);

  if (!form) return <p className="text-center mt-5">Cargando perfil...</p>;

  // 🧠 HANDLERS
  const update = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateNested = (parent, key, value) => {
    setForm(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [key]: value }
    }));
  };

  const handleSkills = (value) => {
    const arr = value.split(",").map(s => s.trim());
    update("skills", arr);
    update("skills_normalized", arr.map(s => s.toLowerCase()));
  };

  const handleSave = async () => {
    setSaving(true);

    await updateDoc(doc(db, "users", user.uid), {
      ...form,
      total_experience: form.experience.reduce((a, e) => a + (e.years || 0), 0),
      updatedAt: new Date()
    });

    setSaving(false);
    alert("Guardado 🚀");
  };

  return (
    <div className="container py-4">

      {/* 🧑 HEADER */}
      <div className="card p-4 shadow-sm mb-4 text-center">
        <img
          src={form.photoURL || "https://via.placeholder.com/100"}
          className="rounded-circle mb-2"
          style={{ width: 90, height: 90 }}
        />
        <h4>{form.name}</h4>

        <input
          className="form-control text-center"
          placeholder="Tu headline..."
          value={form.headline || ""}
          onChange={e => update("headline", e.target.value)}
        />
      </div>

      {/* GRID */}
      <div className="row g-3">

        {/* IZQUIERDA */}
        <div className="col-md-6">

          {/* BIO */}
          <div className="card p-3 shadow-sm">
            <h6>Sobre mí</h6>
            <textarea
              className="form-control"
              value={form.bio || ""}
              onChange={e => update("bio", e.target.value)}
            />
          </div>

          {/* SKILLS */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Skills</h6>
            <input
              className="form-control"
              value={form.skills.join(", ")}
              onChange={e => handleSkills(e.target.value)}
            />
          </div>

        </div>

        {/* DERECHA */}
        <div className="col-md-6">

          {/* UBICACIÓN */}
          <div className="card p-3 shadow-sm">
            <h6>Ubicación</h6>
            <input
              className="form-control mb-2"
              placeholder="Ciudad"
              value={form.location.city || ""}
              onChange={e => updateNested("location", "city", e.target.value)}
            />
          </div>

          {/* LINKS */}
          <div className="card p-3 shadow-sm mt-3">
            <h6>Links</h6>
            <input
              className="form-control mb-2"
              placeholder="LinkedIn"
              value={form.links.linkedin || ""}
              onChange={e => updateNested("links", "linkedin", e.target.value)}
            />
          </div>

        </div>
      </div>

      {/* EXPERIENCIA */}
      <div className="card p-3 shadow-sm mt-4">
        <h6>Experiencia</h6>

        {form.experience?.map((exp, i) => (
          <div key={i} className="mb-2 d-flex gap-2">
            <input
              className="form-control"
              placeholder="Puesto"
              value={exp.role}
              onChange={e => {
                const copy = [...form.experience];
                copy[i].role = e.target.value;
                update("experience", copy);
              }}
            />
            <input
              type="number"
              className="form-control"
              placeholder="Años"
              value={exp.years}
              onChange={e => {
                const copy = [...form.experience];
                copy[i].years = Number(e.target.value);
                update("experience", copy);
              }}
            />
          </div>
        ))}

        <button
          className="btn btn-outline-primary btn-sm"
          onClick={() =>
            update("experience", [...form.experience, { role: "", years: 0 }])
          }
        >
          + Añadir
        </button>
      </div>

      {/* SAVE */}
      <button
        className="btn btn-success w-100 mt-4"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Guardando..." : "Guardar perfil"}
      </button>
    </div>
  );
}