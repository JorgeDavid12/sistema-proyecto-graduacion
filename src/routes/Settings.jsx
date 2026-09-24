import {
  AlertTriangle,
  CheckCircle2,
  Database,
  PlugZap,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { getDatabaseStatus } from "../services/api";

export default function Settings() {
  const [database, setDatabase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    setLoading(true);
    setMessage(null);
    const controller = new AbortController();

    getDatabaseStatus(controller.signal)
      .then(setDatabase)
      .catch((error) => {
        setDatabase(null);
        setMessage(`No se pudo leer la base de datos: ${error.message}`);
      })
      .finally(() => setLoading(false));
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-emeraldTech">Fase 8</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Configuracion de base de datos
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-warmWhite/70">
              El sistema puede trabajar con SQLite local o PostgreSQL real usando
              `DATABASE_URL`. Esta pantalla muestra el motor activo sin exponer claves.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                  <Database size={24} />
                </span>
                <div>
                  <p className="text-sm text-warmWhite/58">Estado actual</p>
                  <h2 className="text-2xl font-semibold text-white">
                    {database?.is_postgresql ? "PostgreSQL" : "SQLite local"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={loadStatus}
                className="inline-flex items-center gap-2 rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] px-3 py-2 text-sm text-warmWhite/72 transition hover:border-emeraldTech/35 hover:text-white"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
            </div>

            {loading && <p className="mt-6 text-sm text-warmWhite/58">Leyendo conexion...</p>}
            {message && (
              <div className="mt-6 rounded-lg border border-alertAmber/30 bg-alertAmber/10 p-4 text-sm font-semibold text-alertAmber">
                {message}
              </div>
            )}

            {database && (
              <div className="mt-6 grid gap-3">
                <StatusRow label="Estado" value={database.status} icon={CheckCircle2} />
                <StatusRow label="Driver" value={database.driver} icon={PlugZap} />
                <StatusRow label="Base" value={database.database || "Sin nombre"} icon={Database} />
                <StatusRow label="Host" value={formatHost(database)} icon={Server} />
              </div>
            )}
          </GlassCard>

          <div className="grid gap-5">
            <GlassCard className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-cyberCyan/12 text-cyberCyan">
                  <ShieldCheck size={24} />
                </span>
                <div>
                  <p className="text-sm text-warmWhite/58">Modo seguro</p>
                  <h2 className="text-2xl font-semibold text-white">PostgreSQL opcional</h2>
                </div>
              </div>
              <p className="mt-5 leading-7 text-warmWhite/66">
                Mientras `DATABASE_URL` apunte a SQLite, todo queda en archivo local. Cuando
                decidas migrar, basta configurar una URL PostgreSQL y reiniciar FastAPI.
              </p>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-alertAmber/12 text-alertAmber">
                  <AlertTriangle size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold text-white">Antes de migrar</h2>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-warmWhite/66">
                    <li>- Tener PostgreSQL instalado o una base administrada.</li>
                    <li>- Crear usuario, clave y base de datos.</li>
                    <li>- Definir `DATABASE_URL` en `.env`.</li>
                    <li>- Reiniciar FastAPI para crear tablas y sembrar datos iniciales.</li>
                  </ul>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function StatusRow({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
      <div className="flex items-center gap-3">
        <Icon className="text-emeraldTech" size={18} />
        <span className="text-sm text-warmWhite/58">{label}</span>
      </div>
      <span className="max-w-[58%] truncate text-right text-sm font-semibold text-white">
        {value}
      </span>
    </div>
  );
}

function formatHost(database) {
  if (!database.host || database.host === "local") return "local";
  return database.port ? `${database.host}:${database.port}` : database.host;
}
