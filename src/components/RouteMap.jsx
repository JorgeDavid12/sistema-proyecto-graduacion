import { MapPin, Navigation2 } from "lucide-react";
import { routeStops } from "../data/fleetData";

export default function RouteMap({
  compact = false,
  stops = routeStops,
  routeName = "Cuilapa - Oratorio",
  vehicleId = "MB-001",
  eyebrow = "Puntos de control de ruta",
}) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-warmWhite/10 bg-graphiteSoft p-5">
      <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(16,240,155,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(16,240,155,0.08)_1px,transparent_1px)] [background-size:34px_34px]" />
      <div className="relative">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emeraldTech">{eyebrow}</p>
            <h3 className="mt-1 text-xl font-semibold text-white">{routeName}</h3>
            <p className="mt-1 text-xs text-warmWhite/48">{vehicleId}</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-lg border border-cyberCyan/30 bg-cyberCyan/12 text-cyberCyan">
            <Navigation2 size={22} />
          </span>
        </div>

        <div className={`${compact ? "mt-5" : "mt-8"} relative h-48 sm:h-56`}>
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 620 240">
            <path
              d="M42 170 C120 38 220 215 307 96 C390 -12 472 108 580 42"
              fill="none"
              stroke="rgba(246,242,232,0.12)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            <path
              d="M42 170 C120 38 220 215 307 96 C390 -12 472 108 580 42"
              fill="none"
              stroke="#34d399"
              strokeDasharray="14 12"
              strokeWidth="4"
              strokeLinecap="round"

            />
          </svg>
          <div className="absolute left-[5%] top-[63%] text-emeraldTech">
            <MapPin size={24} />
          </div>
          <div className="absolute grid h-10 w-10 place-items-center rounded-lg bg-cyberCyan text-graphite" style={{ left: `${8 + Math.max(0, stops.findIndex(s => s.state === "En curso") === -1 ? stops.filter(s => s.state === "Completado").length - 1 : stops.findIndex(s => s.state === "En curso")) * 27}%`, top: "35%" }}>
            <Navigation2 size={22} />
          </div>
          <div className="absolute right-[5%] top-[9%] text-alertAmber">
            <MapPin size={24} />
          </div>
        </div>

        <p className="mb-4 text-xs text-warmWhite/50">Esquema del recorrido · Avance según puntos de control registrados.</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {stops.map((stop) => (
            <div key={stop.name} className="rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-3">
              <p className="truncate text-sm font-semibold text-white">{stop.name}</p>
              <p className="mt-1 text-xs text-warmWhite/58">{stop.time}</p>
              <p
                className={`mt-3 text-xs font-semibold ${
                  stop.state === "En curso"
                    ? "text-cyberCyan"
                    : stop.state === "Completado"
                      ? "text-emeraldTech"
                      : "text-alertAmber"
                }`}
              >
                {stop.state}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
