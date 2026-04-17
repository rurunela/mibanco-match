import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Perfil from "./pages/Perfil";
import Notificaciones from "./pages/Notificaciones";
import Vacantes from "./pages/Vacantes.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/vacantes" element={<Vacantes />} />
            
            {/* Rutas para todos los logueados */}
            <Route element={<ProtectedRoute allow={["user", "recruiter", "admin"]} />}>
              <Route path="/perfil" element={<Perfil />} />
              <Route path="/notificaciones" element={<Notificaciones />} />
            </Route>

            {/* Ruta del Dashboard: Si falla, es por permisos */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allow={["recruiter", "admin"]}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
        
          </Route>
          
          {/* Si escribes cualquier cosa mal, te manda al home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </NotificationProvider>
    </AuthProvider>
  );
}