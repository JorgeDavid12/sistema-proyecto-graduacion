import {
  AlertTriangle,
  Banknote,
  Bot,
  CalendarDays,
  ChevronRight,
  Gauge,
  MapPinned,
  Radio,
  Search,
  ShieldCheck,
  Server,
  Sparkles,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import MetricCard from "../components/MetricCard";
import RouteMap from "../components/RouteMap";
import { askLocalAssistant, getDashboardData, getLocalDashboardData } from "../services/api";

const statusStyles = {
  Operativa: "bg-emeraldTech/12 text-emeraldTech border-emeraldTech/25",
  Alerta: "bg-alertAmber/12 text-alertAmber border-alertAmber/30",
  Mantenimiento: "bg-warmWhite/10 text-warmWhite border-warmWhite/15",
  "En ruta": "bg-cyberCyan/12 text-cyberCyan border-cyberCyan/25",
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(() => getLocalDashboardData());
  const [loadingApi, setLoadingApi] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [assistantQuestion, setAssistantQuestion] = useState("Que unidades necesitan mantenimiento?");
  const [assistantAnswer, setAssistantAnswer] = useState({
    mode: "local_preview",
    matched_topic: "mantenimiento",
    answer:
      "El asistente local esta listo. Enciende FastAPI para obtener analisis calculado desde la base local.",
    insights: [
      "No usa Gemini ni servicios externos.",
      "No consume recursos cuando el backend esta apagado.",
    ],
    suggested_actions: ["Usar preguntas sobre mantenimiento, cuotas, personal o ruta."],
  });
  const [assistantBusy, setAssistantBusy] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    getDashboardData(controller.signal)
      .then((data) => {
        setDashboard(data);
        setApiError(null);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDashboard(getLocalDashboardData());
          setApiError(error.message);
        }
      })
      .finally(() => setLoadingApi(false));

    return () => controller.abort();
  }, []);

  const statusCopy = useMemo(() => {
    if (loadingApi) {
      return {
        label: "Conectando API",
        detail: "Intentando leer FastAPI local",
        tone: "text-cyberCyan border-cyberCyan/30 bg-cyberCyan/10",
      };
    }

    if (dashboard.source === "api") {
      return {
        label: "API conectada",
        detail: dashboard.apiBaseUrl,
        tone: "text-emeraldTech border-emeraldTech/30 bg-emeraldTech/10",
      };
    }

    return {
      label: "Fallback local",
      detail: apiError || "Backend apagado o no disponible",
      tone: "text-alertAmber border-alertAmber/30 bg-alertAmber/10",
    };
  }, [apiError, dashboard.apiBaseUrl, dashboard.source, loadingApi]);

  function askPreset(question) {
    setAssistantQuestion(question);
    setAssistantBusy(true);
    const controller = new AbortController();

    askLocalAssistant(question, controller.signal)
      .then(setAssistantAnswer)
      .catch((error) => {
        setAssistantAnswer({
          mode: "local_fallback",
          matched_topic: "sin_conexion",
          answer:
            "No pude consultar FastAPI ahora. El asistente local no usa servicios externos; solo responde cuando el backend esta encendido.",
          insights: [error.message],
          suggested_actions: ["Levantar FastAPI y volver a intentar.", "Mantener datos locales como respaldo visual."],
        });
      })
      .finally(() => setAssistantBusy(false));
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-emeraldTech">
                  Sistema - Dashboard administrador
                </p>
                <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
                  Centro de mando Mototaxi David
                </h1>
                <p className="mt-4 max-w-2xl leading-7 text-warmWhite/70">
                  Panel operativo separado de la demo academica, protegido por sesion local
                  y roles internos.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span
                  className={`inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${statusCopy.tone}`}
                  title={statusCopy.detail}
                >
                  <Server size={17} />
                  <span className="truncate">{statusCopy.label}</span>
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-warmWhite/12 bg-warmWhite/8 px-3 py-2 text-sm text-warmWhite/72">
                  <ShieldCheck size={17} />
                  Demo controlada
                </span>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {dashboard.kpis.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1.4fr_0.8fr] lg:px-8">
          <GlassCard className="overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-warmWhite/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-warmWhite/58">Flota operativa</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Unidades y pilotos</h2>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] px-3 py-2 text-sm text-warmWhite/58">
                <Search size={16} />
                Vista simulada
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="border-b border-warmWhite/10 text-sm text-warmWhite/50">
                  <tr>
                    <th className="px-5 py-4 font-medium">Unidad</th>
                    <th className="px-5 py-4 font-medium">Piloto</th>
                    <th className="px-5 py-4 font-medium">Km</th>
                    <th className="px-5 py-4 font-medium">Cuota</th>
                    <th className="px-5 py-4 font-medium">Salud</th>
                    <th className="px-5 py-4 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.fleet.map((unit) => (
                    <tr key={unit.id} className="border-b border-warmWhite/7 last:border-0">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{unit.id}</p>
                        <p className="text-sm text-warmWhite/50">{unit.line}</p>
                      </td>
                      <td className="px-5 py-4 text-warmWhite/72">{unit.driver}</td>
                      <td className="px-5 py-4 text-warmWhite/72">
                        {unit.km.toLocaleString("es-GT")}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={
                            unit.paidToday
                              ? "text-emeraldTech"
                              : "text-alertAmber"
                          }
                        >
                          {unit.paidToday ? "Registrada" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-2 w-28 overflow-hidden rounded-lg bg-warmWhite/10">
                          <div
                            className={`h-full rounded-lg ${
                              unit.health > 80
                                ? "bg-emeraldTech"
                                : unit.health > 60
                                  ? "bg-alertAmber"
                                  : "bg-red-400"
                            }`}
                            style={{ width: `${unit.health}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-lg border px-3 py-1 text-xs font-semibold ${statusStyles[unit.status]}`}
                        >
                          {unit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="grid gap-5">
            <GlassCard className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-warmWhite/58">Alertas</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">Atencion hoy</h2>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-alertAmber/12 text-alertAmber">
                  <AlertTriangle size={22} />
                </span>
              </div>
              <div className="mt-5 space-y-3">
                  {dashboard.alerts.map((alert) => (
                  <div key={alert.title} className="rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-white">{alert.title}</p>
                        <p className="mt-2 text-sm leading-6 text-warmWhite/58">{alert.detail}</p>
                      </div>
                      <ChevronRight className="shrink-0 text-warmWhite/35" size={18} />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-alertAmber">{alert.level}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                  {
                    icon: Banknote,
                    label: "Cuotas",
                    value: `Q${dashboard.quotaSummary.expected_today}`,
                  },
                  { icon: CalendarDays, label: "Asistencia", value: "91%" },
                  { icon: Gauge, label: "Ruta", value: "8m" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="rounded-lg bg-warmWhite/[0.055] p-3">
                    <Icon className="mx-auto text-emeraldTech" size={20} />
                    <p className="mt-2 text-xs text-warmWhite/50">{label}</p>
                    <p className="mt-1 font-semibold text-white">{value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-warmWhite/58">Mantenimiento</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Proximos servicios</h2>
              </div>
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                <Wrench size={22} />
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard.maintenance.map((item) => (
                <div key={`${item.vehicle}-${item.task}`} className="flex items-center justify-between gap-4 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
                  <div>
                    <p className="font-semibold text-white">{item.vehicle}</p>
                    <p className="mt-1 text-sm text-warmWhite/58">{item.task}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-emeraldTech">{item.due}</p>
                    <p className="mt-1 text-xs text-warmWhite/45">Riesgo {item.risk}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyberCyan/12 text-cyberCyan">
                <MapPinned size={22} />
              </span>
              <div>
                <p className="text-sm text-warmWhite/58">Auditoria logistica</p>
                <h2 className="text-2xl font-semibold text-white">Ruta del microbus</h2>
              </div>
            </div>
            <RouteMap
              compact
              eyebrow="Ruta operativa"
              routeName={dashboard.route.name}
              vehicleId={dashboard.route.vehicleId}
              stops={dashboard.route.stops}
            />
          </GlassCard>
        </section>

        <section className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
          <GlassCard className="grid gap-6 p-5 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                  <Bot size={22} />
                </span>
                <div>
                  <p className="text-sm text-warmWhite/58">API local gratuita</p>
                  <h2 className="text-2xl font-semibold text-white">Asistente sin Gemini</h2>
                </div>
              </div>
              <p className="mt-4 leading-7 text-warmWhite/62">
                Analiza datos locales con reglas del backend. No usa IA externa, no
                genera cobros y no corre si FastAPI esta apagado.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  "Que unidades necesitan mantenimiento?",
                  "Como van las cuotas de hoy?",
                  "Que piloto tiene mas ausencias?",
                  "Como esta la ruta Cuilapa-Oratorio?",
                ].map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => askPreset(question)}
                    className="rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] px-3 py-2 text-left text-sm text-warmWhite/72 transition hover:border-emeraldTech/35 hover:text-white"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-warmWhite/10 bg-graphiteSoft p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-emeraldTech">{assistantQuestion}</p>
                <span className="inline-flex items-center gap-2 rounded-lg bg-emeraldTech/10 px-2 py-1 text-xs text-emeraldTech">
                  <Sparkles size={14} />
                  {assistantBusy ? "Consultando" : assistantAnswer.mode}
                </span>
              </div>
              <p className="mt-4 text-lg leading-8 text-white">{assistantAnswer.answer}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-warmWhite/42">Hallazgos</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-warmWhite/68">
                    {assistantAnswer.insights.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-warmWhite/42">Acciones</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-warmWhite/68">
                    {assistantAnswer.suggested_actions.map((item) => (
                      <li key={item}>- {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </section>
      </div>
    </AppShell>
  );
}
