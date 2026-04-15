import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allow = [] }) {
  const { loading, permissions } = useAuth();

  // 🔒 esperar Firebase
  if (loading) return <p>Cargando...</p>;

  const role = permissions?.role ?? "user";

  const hasAccess =
    allow.length === 0 || allow.includes(role);

  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return children;
}