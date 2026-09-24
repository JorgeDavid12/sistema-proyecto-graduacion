import { KeyRound, Loader2, LogIn, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../auth/AuthContext";

const initialAccounts = [
  { label: "Administrador", username: "admin", password: "admin123" },
  { label: "Piloto", username: "piloto", password: "piloto123" },
];

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bootstrapping, isAuthenticated, login, user } = useAuth();
  const [form, setForm] = useState({ username: "admin", password: "admin123" });
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!bootstrapping && isAuthenticated) {
    return <Navigate to={homeForRole(user?.role)} replace />;
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const loggedUser = await login(form.username, form.password);
      const requestedPath = location.state?.from?.pathname;
      const destination = allowedPathForRole(loggedUser.role, requestedPath);
      navigate(destination, { replace: true });
    } catch (error) {
      setMessage(error.message || "No se pudo iniciar sesion local.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell compact>
      <div className="min-h-[calc(100vh-4rem)] bg-tech-radial px-4 py-10">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase text-emeraldTech">Fase 6</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Acceso local por rol
            </h1>
            <p className="mt-4 max-w-xl leading-7 text-warmWhite/70">
              Inicia sesion contra FastAPI local. Administrador abre el panel completo;
              piloto entra solo a su jornada asignada.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {initialAccounts.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() =>
                    setForm({ username: account.username, password: account.password })
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] px-3 py-2 text-sm font-semibold text-warmWhite/72 transition hover:border-emeraldTech/35 hover:text-white"
                >
                  <UserRound size={16} />
                  {account.label}
                </button>
              ))}
            </div>
          </div>

          <GlassCard className="p-6">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                <ShieldCheck size={24} />
              </span>
              <div>
                <p className="text-sm text-warmWhite/58">Sesion local</p>
                <h2 className="text-2xl font-semibold text-white">Mototaxi David</h2>
              </div>
            </div>

            <form onSubmit={submit} className="grid gap-4">
              <label className="block">
                <span className="text-sm font-semibold text-warmWhite/66">Usuario</span>
                <input
                  type="text"
                  autoComplete="username"
                  value={form.username}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, username: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-warmWhite/66">Clave</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                />
              </label>

              {message && (
                <div className="rounded-lg border border-alertAmber/30 bg-alertAmber/10 p-3 text-sm font-semibold text-alertAmber">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || bootstrapping}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
                Entrar
              </button>
            </form>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-3 text-sm text-warmWhite/60">
              <KeyRound className="shrink-0 text-emeraldTech" size={18} />
              <span>admin/admin123 / piloto/piloto123</span>
            </div>
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
}

function homeForRole(role) {
  return role === "piloto" ? "/sistema/piloto" : "/sistema";
}

function allowedPathForRole(role, requestedPath) {
  if (!requestedPath || requestedPath === "/login" || requestedPath === "/sistema/login") {
    return homeForRole(role);
  }
  if (role === "piloto" && requestedPath.startsWith("/sistema")) return "/sistema/piloto";
  return requestedPath;
}
