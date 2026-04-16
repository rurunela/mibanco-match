import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Perfil from "./pages/Perfil";

export default function App() {
  return (
    <Routes>

      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allow={["recruiter", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

      </Route>

    </Routes>
  );
}