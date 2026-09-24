import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BatteryCharging,
  Clock3,
  MapPin,
  Navigation,
  Radio,
  Send,
  ShieldCheck,
  Signal,
} from "lucide-react";
import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../auth/AuthContext";
import { routeStops } from "../data/demoData";
import { getRouteDemo, sendGpsPoint } from "../services/api";

export default function TrackDemo() {
  const { user } = useAuth();
  // Futuro GPS real:
  // 1. Cambiar esta ruta por /track/:token.
  // 2. Explicar al piloto que se compartira ubicacion durante la jornada.
  // 3. Solo con autorizacion, usar navigator.geolocation.watchPosition.
  // 4. Enviar puntos al backend con token temporal.
  // En esta fase NO se solicita ubicacion real ni se activa GPS del navegador.
  const [route, setRoute] = useState({
    source: "local",
    route: {
      name: "Cuilapa - Oratorio",
      vehicleId: "MB-001",
      stops: routeStops,
    },
  });
  const [sendState, setSendState] = useState({
    status: "idle",
    message: "Listo para enviar un punto local al backend.",
  });

  useEffect(() => {
    const controller = new AbortController();

    getRouteDemo(controller.signal)
      .then(setRoute)
      .catch(() => {
        setRoute({
          source: "local",
          route: {
            name: "Cuilapa - Oratorio",
            vehicleId: "MB-001",
            stops: routeStops,
          },
        });
      });

    return () => controller.abort();
  }, []);

  function sendLocalPoint() {
    setSendState({ status: "sending", message: "Enviando punto simulado..." });
    const controller = new AbortController();

    sendGpsPoint(
      {
        vehicle_id: route.route.vehicleId,
        latitude: 14.1914,
        longitude: -90.3746,
        speed_kmh: 58,
        simulated: true,
      },
      controller.signal,
    )
      .then((point) => {
        setSendState({
          status: "sent",
          message: `Punto local guardado a ${point.speed_kmh} km/h. No se uso GPS real.`,
        });
      })
      .catch(() => {
        setSendState({
          status: "error",
          message: "Backend apagado. No se envio nada y no hay proceso en segundo plano.",
        });
      });
  }

  return (
    <AppShell compact>
      <div className="min-h-screen bg-tech-radial px-4 pb-8 pt-6">
        <div className="mx-auto max-w-md">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              to={user?.role === "piloto" ? "/demo" : "/sistema"}
              className="grid h-11 w-11 place-items-center rounded-lg border border-warmWhite/12 bg-warmWhite/8 text-white"
              aria-label={user?.role === "piloto" ? "Volver al proyecto" : "Volver al dashboard"}
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="text-right">
              <p className="text-sm text-warmWhite/58">Sistema piloto</p>
              <h1 className="font-semibold text-white">Jornada movil</h1>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <div className="relative min-h-[300px] p-6">
              <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(16,240,155,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(16,240,155,0.09)_1px,transparent_1px)] [background-size:32px_32px]" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-warmWhite/60">Unidad asignada</p>
                    <h2 className="mt-1 text-3xl font-semibold text-white">
                      {route.route.vehicleId}
                    </h2>
                    <p className="mt-2 text-sm text-warmWhite/58">
                      {user?.role === "piloto" ? "Piloto" : "Vista"}: {user?.display_name}
                    </p>
                  </div>
                  <span className="grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech text-graphite shadow-glow">
                    <Navigation size={24} />
                  </span>
                </div>

                <div className="mt-8 rounded-lg border border-emeraldTech/24 bg-emeraldTech/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-4 w-4">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-emeraldTech opacity-60" />
                        <span className="relative inline-flex h-4 w-4 rounded-lg bg-emeraldTech" />
                      </span>
                      <span className="font-semibold text-emeraldTech">Transmitiendo</span>
                    </div>
                    <Radio className="text-emeraldTech" size={20} />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-warmWhite/68">
                    Ubicacion local simulada activa desde{" "}
                    {route.source === "api" ? "FastAPI" : "datos locales"}. No se usa GPS
                    real en esta fase.
                  </p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    { icon: Signal, label: "Senal", value: "Alta" },
                    { icon: BatteryCharging, label: "Bateria", value: "86%" },
                    { icon: Clock3, label: "Atraso", value: "8 min" },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="rounded-lg bg-warmWhite/[0.055] p-3 text-center">
                      <Icon className="mx-auto text-cyberCyan" size={18} />
                      <p className="mt-2 text-[11px] text-warmWhite/48">{label}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={sendLocalPoint}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={sendState.status === "sending"}
                >
                  <Send size={18} />
                  Enviar punto local
                </button>
                <p
                  className={`mt-3 text-sm leading-6 ${
                    sendState.status === "error" ? "text-alertAmber" : "text-warmWhite/60"
                  }`}
                >
                  {sendState.message}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="mt-5 p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-cyberCyan/12 text-cyberCyan">
                <MapPin size={22} />
              </span>
              <div>
                <p className="text-sm text-warmWhite/58">Trayecto actual</p>
                <h2 className="text-xl font-semibold text-white">{route.route.name}</h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {route.route.stops.map((stop, index) => (
                <div key={stop.name} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`grid h-9 w-9 place-items-center rounded-lg border text-sm font-semibold ${
                        stop.state === "En curso"
                          ? "border-cyberCyan/35 bg-cyberCyan/14 text-cyberCyan"
                          : stop.state === "Completado"
                            ? "border-emeraldTech/35 bg-emeraldTech/14 text-emeraldTech"
                            : "border-alertAmber/35 bg-alertAmber/14 text-alertAmber"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {index < route.route.stops.length - 1 && <span className="h-10 w-px bg-warmWhite/14" />}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-white">{stop.name}</p>
                    <p className="mt-1 text-sm text-warmWhite/54">
                      {stop.time} · {stop.state}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <div className="mt-5 rounded-lg border border-warmWhite/10 bg-graphite/50 p-4 text-sm leading-6 text-warmWhite/60 backdrop-blur-xl">
            <div className="mb-2 flex items-center gap-2 font-semibold text-emeraldTech">
              <ShieldCheck size={18} />
              Sistema seguro
            </div>
            Esta pantalla representa el flujo movil del piloto con sesion local. No solicita
            permisos del navegador, no obtiene coordenadas reales y no envia informacion a
            servicios externos.
          </div>
        </div>
      </div>
    </AppShell>
  );
}
