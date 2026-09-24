import { AlertTriangle, Bot, MapPin, Navigation, RadioTower, Wrench } from "lucide-react";

export default function FleetScene() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-tech-radial" />
      <div className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(246,242,232,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(246,242,232,0.05)_1px,transparent_1px)] [background-size:54px_54px]" />

      <svg
        className="absolute left-1/2 top-24 h-[680px] w-[980px] -translate-x-1/2 opacity-80"
        viewBox="0 0 980 680"
        role="img"
        aria-label="Ruta tecnologica simulada de Mototaxi David"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#10f09b" />
            <stop offset="56%" stopColor="#45d9ff" />
            <stop offset="100%" stopColor="#ffbe45" />
          </linearGradient>
        </defs>
        <path
          d="M110 500 C230 260 315 555 445 338 C548 166 675 238 826 98"
          fill="none"
          stroke="rgba(246,242,232,0.12)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        <path
          d="M110 500 C230 260 315 555 445 338 C548 166 675 238 826 98"
          fill="none"
          stroke="url(#routeGradient)"
          strokeDasharray="18 18"
          strokeWidth="5"
          strokeLinecap="round"
          className="animate-route-dash"
        />
        {[
          [110, 500],
          [445, 338],
          [826, 98],
        ].map(([cx, cy]) => (
          <g key={`${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r="14" fill="#10f09b" opacity="0.18" />
            <circle cx={cx} cy={cy} r="5" fill="#10f09b" />
          </g>
        ))}
      </svg>

      <div className="absolute right-[8%] top-28 hidden w-72 animate-float-slow rounded-lg border border-emeraldTech/24 bg-graphite/58 p-4 shadow-glass backdrop-blur-xl lg:block">
        <div className="flex items-center gap-3 text-emeraldTech">
          <RadioTower size={22} />
          <span className="text-sm font-semibold">Telemetria demo</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-warmWhite/66">
          Microbus MB-001 transmitiendo posicion simulada hacia el panel.
        </p>
      </div>

      <div className="absolute bottom-20 left-[7%] hidden w-64 animate-float-slow rounded-lg border border-cyberCyan/24 bg-graphite/58 p-4 shadow-glass backdrop-blur-xl [animation-delay:1.2s] md:block">
        <div className="flex items-center gap-3 text-cyberCyan">
          <Bot size={22} />
          <span className="text-sm font-semibold">IA futura</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-warmWhite/66">
          Analisis predictivo preparado para fase posterior.
        </p>
      </div>

      <div className="absolute left-[52%] top-[43%] grid h-16 w-16 place-items-center rounded-lg border border-emeraldTech/30 bg-emeraldTech/12 text-emeraldTech shadow-glow">
        <Navigation size={28} />
      </div>

      <div className="absolute bottom-[25%] right-[20%] grid h-12 w-12 place-items-center rounded-lg border border-alertAmber/30 bg-alertAmber/12 text-alertAmber">
        <AlertTriangle size={21} />
      </div>
      <div className="absolute left-[20%] top-[31%] grid h-12 w-12 place-items-center rounded-lg border border-cyberCyan/30 bg-cyberCyan/12 text-cyberCyan">
        <Wrench size={21} />
      </div>
      <div className="absolute right-[36%] top-[18%] grid h-12 w-12 place-items-center rounded-lg border border-emeraldTech/30 bg-emeraldTech/12 text-emeraldTech">
        <MapPin size={21} />
      </div>
    </div>
  );
}
