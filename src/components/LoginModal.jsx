import { useAuth } from "../context/AuthContext";

export default function LoginModal() {
  const { loginWithGoogle } = useAuth();

  return (
    <div className="modal fade" id="loginModal" tabIndex="-1">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content p-4 rounded-4 text-center">

          <h4 className="fw-bold mb-2">Inicia sesión</h4>
          <p className="text-muted mb-4">
            Accede para postular en segundos
          </p>

          <button
            className="btn btn-dark w-100"
            onClick={loginWithGoogle}
          >
            Continuar con Google
          </button>

        </div>
      </div>
    </div>
  );
}