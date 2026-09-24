import { Link, NavLink } from "react-router-dom";
import {
  BarChart3,
  Bot,
  ClipboardList,
  FileSpreadsheet,
  LogIn,
  LogOut,
  MapPinned,
  Navigation,
  Presentation,
  Route,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const links = [
  { to: "/demo", label: "Demo", icon: Presentation },
  { to: "/demo/defensa", label: "Defensa", icon: ShieldCheck },
  { to: "/sistema", label: "Sistema", icon: BarChart3, roles: ["administrador"] },
  { to: "/sistema/operacion", label: "Operacion", icon: ClipboardList, roles: ["administrador"] },
  { to: "/sistema/reportes", label: "Reportes", icon: FileSpreadsheet, roles: ["administrador"] },
  { to: "/sistema/gps", label: "GPS", icon: Navigation, roles: ["administrador"] },
  { to: "/sistema/ia", label: "IA", icon: Bot, roles: ["administrador"] },
  { to: "/sistema/configuracion", label: "Config", icon: Settings, roles: ["administrador"] },
  { to: "/sistema/piloto", label: "Piloto", icon: MapPinned, roles: ["administrador", "piloto"] },
];

export default function AppShell({ children, compact = false }) {
  const { isAuthenticated, logout, user } = useAuth();
  const visibleLinks = links.filter((link) => !link.roles || link.roles.includes(user?.role));
  const homePath = user?.role === "piloto" ? "/sistema/piloto" : "/sistema";

  return (
    <div className="min-h-screen bg-graphite text-warmWhite">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-warmWhite/10 bg-graphite/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/demo" className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-emeraldTech/35 bg-emeraldTech/10 text-emeraldTech shadow-glow">
              <Route size={22} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                Mototaxi David
              </span>
              <span className="block truncate text-xs text-warmWhite/62">
                Sistema Integral de Flotas
              </span>
            </span>
          </Link>

          {!compact && (
            <nav className="hidden items-center gap-1 md:flex">
              {visibleLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                      isActive
                        ? "bg-emeraldTech/14 text-emeraldTech"
                        : "text-warmWhite/70 hover:bg-warmWhite/8 hover:text-white",
                    ].join(" ")
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <span className="hidden max-w-[190px] items-center gap-2 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] px-3 py-2 text-sm text-warmWhite/68 lg:inline-flex">
                <UserRound size={16} />
                <span className="truncate">{user.display_name}</span>
              </span>
            )}

            <Link
              to={isAuthenticated ? homePath : "/sistema/login"}
              className="hidden items-center gap-2 rounded-lg border border-emeraldTech/35 bg-emeraldTech/12 px-4 py-2 text-sm font-semibold text-emeraldTech shadow-glow transition hover:bg-emeraldTech/18 sm:inline-flex"
            >
              {isAuthenticated ? <ShieldCheck size={16} /> : <LogIn size={16} />}
              {isAuthenticated ? (user?.role === "piloto" ? "Mi jornada" : "Abrir panel") : "Entrar"}
            </Link>

            {isAuthenticated && (
              <button
                type="button"
                onClick={logout}
                className="grid h-10 w-10 place-items-center rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] text-warmWhite/70 transition hover:border-alertAmber/35 hover:text-alertAmber"
                aria-label="Cerrar sesion"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">{children}</main>

      {!compact && (
        <nav
          className="no-scrollbar fixed inset-x-3 bottom-3 z-50 flex gap-2 overflow-x-auto rounded-lg border border-warmWhite/10 bg-graphite/88 p-2 shadow-glass backdrop-blur-2xl md:hidden"
        >
          {visibleLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "flex min-w-[4.25rem] flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] transition",
                  isActive
                    ? "bg-emeraldTech/16 text-emeraldTech"
                    : "text-warmWhite/62 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={17} />
              <span className="max-w-full truncate">{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
