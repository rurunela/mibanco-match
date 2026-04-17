import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import * as bootstrap from "bootstrap";
import logoBanco from "../assets/banco.png";

export default function LoginModal() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 CIERRE CORRECTO (sin window.bootstrap)
  const closeModal = () => {
    const modalEl = document.getElementById("loginModal");
    if (!modalEl) return;

    const modal =
      bootstrap.Modal.getInstance(modalEl) ||
      new bootstrap.Modal(modalEl);

    modal.hide();
  };

  // 🧠 MANEJO DE ERRORES BONITO
  const getFirebaseError = (err) => {
    switch (err.code) {
      case "auth/email-already-in-use":
        return "Este correo ya está registrado.";
      case "auth/invalid-credential":
        return "Correo o contraseña incorrectos.";
      case "auth/weak-password":
        return "La contraseña debe tener al menos 6 caracteres.";
      case "auth/invalid-email":
        return "Correo inválido.";
      default:
        return "Ocurrió un error. Intenta nuevamente.";
    }
  };

  const handleEmailAuth = async () => {
    setError("");

    if (!form.email || !form.password) {
      setError("Completa todos los campos.");
      return;
    }

    if (isRegister && !form.name) {
      setError("Ingresa tu nombre.");
      return;
    }

    if (form.password.length < 6) {
      setError("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }

    try {
      setLoading(true);

      if (isRegister) {
        await registerWithEmail(form.email, form.password, form.name);
      } else {
        await loginWithEmail(form.email, form.password);
      }

      closeModal();

    } catch (err) {
      setError(getFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      await loginWithGoogle();
      closeModal();
    } catch (err) {
      setError("Error al iniciar con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="loginModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-4 rounded-4 shadow border-0">

          {/* LOGO */}
          <div className="text-center mb-3">
            <img src={logoBanco} height="50" alt="logo" />
          </div>

          <h4 className="fw-bold text-center">
            {isRegister ? "Crear cuenta" : "Iniciar sesión"}
          </h4>

          <p className="text-muted text-center mb-4">
            Plataforma de talento MiBanco
          </p>

          {/* ERROR */}
          {error && (
            <div className="alert alert-danger py-2 text-center">
              {error}
            </div>
          )}

          {/* FORM */}
          {isRegister && (
            <input
              className="form-control mb-2"
              placeholder="Nombre completo"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          )}

          <input
            className="form-control mb-2"
            placeholder="Correo electrónico"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            className="form-control mb-3"
            placeholder="Contraseña"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <button
            className="btn btn-success w-100 mb-2 fw-semibold"
            onClick={handleEmailAuth}
            disabled={loading}
          >
            {loading
              ? "Procesando..."
              : isRegister
              ? "Registrarme"
              : "Ingresar"}
          </button>

          <div className="text-muted text-center my-2">o</div>

          <button
            className="btn btn-dark w-100 mb-3"
            onClick={handleGoogle}
            disabled={loading}
          >
            Continuar con Google
          </button>

          {/* TOGGLE */}
          <div className="text-center">
            <small>
              {isRegister ? "¿Ya tienes cuenta?" : "¿No tienes cuenta?"}{" "}
              <span
                className="text-success fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setError("");
                  setIsRegister(!isRegister);
                }}
              >
                {isRegister ? "Inicia sesión" : "Regístrate"}
              </span>
            </small>
          </div>

        </div>
      </div>
    </div>
  );
}