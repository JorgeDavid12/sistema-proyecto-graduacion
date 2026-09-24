import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  Database,
  LineChart,
  Map,
  Presentation,
  Server,
  Smartphone,
  Target,
} from "lucide-react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import RouteMap from "../components/RouteMap";
import { defenseSlides } from "../data/demoData";

const indicators = [
  { label: "Mantenimiento", value: "Km entre servicios", icon: LineChart },
  { label: "Asistencia", value: "Cumplimiento laboral", icon: Target },
  { label: "Logistica", value: "Puntos de control", icon: Map },
  { label: "Finanzas", value: "Recaudacion efectiva", icon: Database },
];

export default function Defense() {
  return (
    <AppShell>
      <section className="relative overflow-hidden bg-tech-radial">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(246,242,232,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(246,242,232,0.04)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="relative mx-auto flex min-h-[86vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-cyberCyan/35 bg-cyberCyan/10 px-3 py-2 text-sm font-semibold text-cyberCyan">
              <Presentation size={17} />
              Modo defensa
            </div>
            <h1 className="text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              Una keynote academica para explicar el sistema completo.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-warmWhite/72">
              Esta vista resume el problema, la hipotesis, los objetivos, la arquitectura
              futura y los indicadores con lenguaje visual fuerte para una presentacion de
              graduacion.
            </p>
            <Link
              to="/sistema"
              className="mt-9 inline-flex items-center gap-2 rounded-lg bg-emeraldTech px-5 py-3 text-sm font-bold text-graphite shadow-glow transition hover:-translate-y-1"
            >
              Entrar al sistema
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-graphite py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:px-8">
          {defenseSlides.map((slide, index) => (
            <GlassCard
              key={slide.title}
              className="grid min-h-[360px] items-center overflow-hidden p-6 sm:p-9 lg:grid-cols-[0.85fr_1.15fr]"
            >
              <div className="relative min-h-56">
                <div className="absolute inset-0 rounded-lg border border-emeraldTech/18 bg-deepGreen/60" />
                <div className="absolute left-8 top-8 text-7xl font-semibold text-emeraldTech/20">
                  0{index + 1}
                </div>
                <div className="absolute bottom-8 left-8 right-8">
                  <span className="inline-flex rounded-lg bg-emeraldTech/12 px-3 py-2 text-sm font-semibold text-emeraldTech">
                    {slide.eyebrow}
                  </span>
                </div>
              </div>
              <div className="pt-7 lg:pl-10 lg:pt-0">
                <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                  {slide.title}
                </h2>
                <p className="mt-5 text-lg leading-8 text-warmWhite/68">{slide.text}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      <section className="bg-warmWhite py-20 text-graphite">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1fr] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-deepGreen">Arquitectura futura</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight">
              La demo explica el proyecto. El sistema se trabaja por separado.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                { icon: Smartphone, text: "PWA movil para piloto" },
                { icon: Server, text: "API FastAPI" },
                { icon: Database, text: "PostgreSQL" },
                { icon: Bot, text: "Gemini con funciones seguras" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="rounded-lg border border-graphite/10 bg-white p-5">
                  <Icon className="text-deepGreen" size={24} />
                  <p className="mt-4 font-semibold">{text}</p>
                </div>
              ))}
            </div>
          </div>
          <RouteMap />
        </div>
      </section>

      <section className="bg-deepGreen py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-4">
            {indicators.map(({ label, value, icon: Icon }) => (
              <GlassCard key={label} className="p-6 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech text-graphite">
                  <Icon size={22} />
                </span>
                <p className="mt-5 text-sm text-warmWhite/58">{label}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{value}</h3>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
