import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { profile, logout, permissions } = useAuth();

  const users = [
    { name: "Lucía Campos", match: 95, city: "Lima", skills: "React" },
    { name: "María Rodríguez", match: 75, city: "Arequipa", skills: "JS" },
  ];

  return (
    <div className="container-fluid">
      <div className="row">

        {/* SIDEBAR */}
        <aside className="col-md-2 bg-dark text-white min-vh-100 p-3">

          <h5>MiBanco Talent</h5>

          <p className="small text-muted">
            {profile?.role}
          </p>

          <button
            className="btn btn-sm btn-outline-light mt-3"
            onClick={logout}
          >
            Logout
          </button>

          {/* 🔥 RECRUITER PANEL */}
          {permissions.isRecruiter && (
            <div className="mt-4">
              <h6>Recruiter Tools</h6>

              <button className="btn btn-success btn-sm w-100 mb-2">
                Ver candidatos
              </button>

              <button className="btn btn-outline-light btn-sm w-100">
                Matches en vivo
              </button>
            </div>
          )}

          {/* 🔥 ADMIN PANEL */}
          {permissions.isAdmin && (
            <div className="mt-4">
              <h6 className="text-warning">Admin Panel</h6>

              <button className="btn btn-warning btn-sm w-100 mb-2">
                Crear recruiter
              </button>

              <button className="btn btn-outline-light btn-sm w-100 mb-2">
                Gestionar usuarios
              </button>

              <button className="btn btn-outline-light btn-sm w-100">
                Logs del sistema
              </button>
            </div>
          )}

        </aside>

        {/* MAIN */}
        <main className="col-md-10 p-4">

          <h2 className="fw-bold mb-2">
            Resultados Match 🔥
          </h2>

          <p className="text-muted">
            Bienvenido, {profile?.name}
          </p>

          {/* SOLO RECRUITER Y ADMIN VEN ESTO */}
          {permissions.isRecruiter && (
            <table className="table table-hover mt-4">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Ciudad</th>
                  <th>Skills</th>
                  <th>Match</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u, i) => (
                  <tr key={i}>
                    <td>{u.name}</td>
                    <td>{u.city}</td>
                    <td>{u.skills}</td>
                    <td>
                      <span className="badge bg-success">
                        {u.match}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* USER NORMAL VIEW */}
          {!permissions.isRecruiter && (
            <div className="alert alert-info mt-4">
              No tienes acceso al panel de reclutamiento aún.
            </div>
          )}

        </main>

      </div>
    </div>
  );
}