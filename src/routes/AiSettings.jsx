import { AlertTriangle, Bot, CheckCircle2, KeyRound, PlugZap, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { getExternalAiStatus } from "../services/api";

export default function AiSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    setLoading(true);
    setMessage(null);
    const controller = new AbortController();

    getExternalAiStatus(controller.signal)
      .then(setStatus)
      .catch((error) => {
        setStatus(null);
        setMessage(`No se pudo leer IA externa: ${error.message}`);
      })
      .finally(() => setLoading(false));
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-emeraldTech">Fase 10</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              IA externa opcional
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-warmWhite/70">
              El sistema mantiene IA externa bloqueada hasta que autorices proveedor,
              modelo, costo y clave en `.env`. El asistente local sigue disponible sin costo.
            </p>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                  <Bot size={24} />
                </span>
                <div>
                  <p className="text-sm text-warmWhite/58">Estado actual</p>
                  <h2 className="text-2xl font-semibold text-white">
                    {status?.ready ? "Autorizada" : "Bloqueada"}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={loadStatus}
                className="grid h-10 w-10 place-items-center rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] text-warmWhite/72"
                aria-label="Actualizar IA"
              >
                <RefreshCw size={17} />
              </button>
            </div>

            {loading && <p className="mt-6 text-sm text-warmWhite/58">Leyendo configuracion...</p>}
            {message && (
              <div className="mt-6 rounded-lg border border-alertAmber/30 bg-alertAmber/10 p-4 text-sm font-semibold text-alertAmber">
                {message}
              </div>
            )}

            {status && (
              <div className="mt-6 grid gap-3">
                <StatusRow label="Habilitada" value={status.enabled ? "Si" : "No"} icon={ShieldCheck} />
                <StatusRow label="Proveedor" value={status.provider || "Sin definir"} icon={PlugZap} />
                <StatusRow label="Modelo" value={status.model || "Sin definir"} icon={Bot} />
                <StatusRow label="Clave" value={status.has_api_key ? "Configurada" : "Sin clave"} icon={KeyRound} />
                <StatusRow label="Costo autorizado" value={status.cost_acknowledged ? "Si" : "No"} icon={CheckCircle2} />
              </div>
            )}
          </GlassCard>

          <div className="grid gap-5">
            <GlassCard className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-alertAmber/12 text-alertAmber">
                  <AlertTriangle size={24} />
                </span>
                <div>
                  <h2 className="text-2xl font-semibold text-white">Candado de autorizacion</h2>
                  <p className="mt-4 leading-7 text-warmWhite/66">
                    Aunque alguien llame el endpoint externo, FastAPI responde 403 si falta
                    proveedor, modelo, clave o aceptacion de costo. Esta fase no consume
                    tokens ni hace llamadas pagadas.
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <p className="text-sm font-semibold uppercase text-emeraldTech">Variables requeridas</p>
              <pre className="mt-4 overflow-x-auto rounded-lg bg-graphiteSoft p-4 text-sm leading-7 text-warmWhite/72">
{`AI_EXTERNAL_ENABLED=true
AI_PROVIDER=openai|google|anthropic
AI_MODEL=modelo_autorizado
AI_API_KEY=clave_autorizada
AI_COST_ACKNOWLEDGED=true`}
              </pre>
              {status && <p className="mt-4 text-sm leading-6 text-warmWhite/58">{status.detail}</p>}
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
