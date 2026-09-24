import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./routes/Landing.jsx";
import Defense from "./routes/Defense.jsx";
import Dashboard from "./routes/Dashboard.jsx";
import Operations from "./routes/Operations.jsx";
import Reports from "./routes/Reports.jsx";
import Settings from "./routes/Settings.jsx";
import GpsAdmin from "./routes/GpsAdmin.jsx";
import AiSettings from "./routes/AiSettings.jsx";
import TrackDemo from "./routes/TrackDemo.jsx";
import TrackingSession from "./routes/TrackingSession.jsx";
import Login from "./routes/Login.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/demo" replace />} />
      <Route path="/demo" element={<Landing />} />
      <Route path="/demo/defensa" element={<Defense />} />
      <Route path="/jornada/:token" element={<TrackingSession />} />
      <Route path="/defensa" element={<Navigate to="/demo/defensa" replace />} />
      <Route path="/login" element={<Navigate to="/sistema/login" replace />} />
      <Route path="/sistema/login" element={<Login />} />
      <Route path="/app" element={<Navigate to="/sistema" replace />} />
      <Route path="/app/operacion" element={<Navigate to="/sistema/operacion" replace />} />
      <Route path="/app/reportes" element={<Navigate to="/sistema/reportes" replace />} />
      <Route path="/app/configuracion" element={<Navigate to="/sistema/configuracion" replace />} />
      <Route path="/app/gps" element={<Navigate to="/sistema/gps" replace />} />
      <Route path="/app/ia" element={<Navigate to="/sistema/ia" replace />} />
      <Route path="/track/demo" element={<Navigate to="/sistema/piloto" replace />} />
      <Route
        path="/sistema"
        element={
          <RequireAuth roles={["administrador"]}>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/operacion"
        element={
          <RequireAuth roles={["administrador"]}>
            <Operations />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/reportes"
        element={
          <RequireAuth roles={["administrador"]}>
            <Reports />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/configuracion"
        element={
          <RequireAuth roles={["administrador"]}>
            <Settings />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/gps"
        element={
          <RequireAuth roles={["administrador"]}>
            <GpsAdmin />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/ia"
        element={
          <RequireAuth roles={["administrador"]}>
            <AiSettings />
          </RequireAuth>
        }
      />
      <Route
        path="/sistema/piloto"
        element={
          <RequireAuth roles={["administrador", "piloto"]}>
            <TrackDemo />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
