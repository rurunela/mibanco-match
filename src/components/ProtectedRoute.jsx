import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allow, children }) {
  const { user, profile, loading } = useAuth();

  // 1. MIENTRAS CARGA, NO RE-DIRIGAS. Quédate quieto.
  if (loading) {
    return <div className="p-10 text-center">Verificando acceso...</div>;
  }

  // 2. SI NO HAY USUARIO, AL HOME
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. SI EL ROL NO COINCIDE
  if (allow && !allow.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  // 4. SOPORTE PARA AMBOS MODOS (como envoltorio o como ruta hija)
  return children ? children : <Outlet />;
}