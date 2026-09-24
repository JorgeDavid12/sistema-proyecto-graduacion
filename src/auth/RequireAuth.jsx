import { Link, Navigate, useLocation } from "react-router-dom";
import { Lock, ShieldAlert } from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { useAuth } from "./AuthContext";

export default function RequireAuth({ children, roles = [] }) {
  const location = useLocation();
  const { bootstrapping, isAuthenticated, user } = useAuth();

  if (bootstrapping) {
    return (
      <AppShell compact>
        <div className="grid min-h-[calc(100vh-4rem)] place-items-center px-4">
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
              <Lock size={22} />
            </span>
            <p className="mt-4 text-sm font-semibold text-warmWhite/64">
              Validando sesion local...
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sistema/login" replace state={{ from: location }} />;
  }

  if (roles.length > 0 && !roles.includes(user.role)) {
    return (
      <AppShell>
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-3xl place-items-center px-4 py-10">
          <GlassCard className="p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-alertAmber/12 text-alertAmber">
              <ShieldAlert size={24} />
            </span>
            <p className="mt-4 text-sm font-semibold uppercase text-alertAmber">
              Acceso restringido
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">
              Tu rol actual es {user.role}
            </h1>
            <p className="mt-3 leading-7 text-warmWhite/64">
              Esta seccion requiere permisos de administrador. La cuenta piloto solo puede
              entrar a su jornada movil.
            </p>
            <Link
              to={user.role === "piloto" ? "/sistema/piloto" : "/sistema"}
              className="mt-5 inline-flex rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite"
            >
              Ir a mi vista
            </Link>
          </GlassCard>
        </div>
      </AppShell>
    );
  }

  return children;
}
