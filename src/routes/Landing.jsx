import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BrainCircuit,
  CalendarCheck,
  MapPinned,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import AppShell from "../components/AppShell";
import FleetScene from "../components/FleetScene";
import GlassCard from "../components/GlassCard";
import MetricCard from "../components/MetricCard";
import RouteMap from "../components/RouteMap";
import SectionTitle from "../components/SectionTitle";
import { kpis, modules } from "../data/demoData";

const problemCards = [
  {
    icon: Wrench,
    title: "Mantenimiento reactivo",
    text: "Los servicios dependen de memoria y papel, elevando el riesgo de fallas costosas.",
  },
  {
    icon: CalendarCheck,
    title: "Asistencia informal",
    text: "Las ausencias y descansos no quedan auditados con suficiente trazabilidad.",
  },
  {
    icon: MapPinned,
    title: "Ruta sin visibilidad",
    text: "El microbus opera con control humano vulnerable a retrasos y reportes imprecisos.",
  },
];

const impact = [
  "Centralizacion de seis unidades operativas",
  "Alertas preventivas por kilometraje e historial",
  "Control diario de cuotas y saldos pendientes",
  "Base visual para defensa academica y futuras integraciones",
];

export default function Landing() {
  return (
    <AppShell>
      <section className="relative isolate min-h-[92vh] overflow-hidden">
        <FleetScene />
        <div className="relative z-10 mx-auto flex min-h-[92vh] max-w-7xl items-center px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-4xl animate-fade-up">
            <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-emeraldTech/30 bg-emeraldTech/10 px-3 py-2 text-sm font-semibold text-emeraldTech">
              <Sparkles size={17} />
              Proyecto de Graduacion I
            </div>
            <h1 className="max-w-5xl text-5xl font-semibold leading-tight text-white sm:text-6xl lg:text-7xl">
              Sistema Integral de Gestion de Flotas para Mototaxi David
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-warmWhite/74 sm:text-xl">
              Una plataforma web visual, responsiva y academica para demostrar como la
              administracion de transporte puede evolucionar de cuadernos y memoria a datos,
              alertas y supervision inteligente.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/demo/defensa"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emeraldTech px-5 py-3 text-sm font-bold text-graphite shadow-glow transition hover:-translate-y-1"
              >
                Ver defensa visual
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/sistema"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-warmWhite/18 bg-warmWhite/8 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-1 hover:border-cyberCyan/45"
              >
                Entrar al sistema
                <BarChart3 size={18} />
              </Link>
            </div>
          </div>
        </div>
        <div className="relative z-10 mx-auto -mt-28 grid max-w-7xl gap-4 px-4 pb-14 sm:px-6 md:grid-cols-4 lg:px-8">
          {kpis.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>
      </section>

      <section className="bg-warmWhite py-20 text-graphite">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            eyebrow="Diagnostico"
            title="El problema no es la demanda. Es la falta de control operativo."
            text="La empresa tiene liquidez diaria y activos valiosos, pero su crecimiento expuso una deuda administrativa: registros manuales, poca trazabilidad y decisiones tomadas sin datos consolidados."
          />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {problemCards.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-lg border border-graphite/10 bg-white p-6 shadow-[0_18px_50px_rgba(17,23,22,0.12)] transition hover:-translate-y-1"
              >
                <span className="grid h-12 w-12 place-items-center rounded-lg bg-deepGreen text-emeraldTech">
                  <Icon size={22} />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-graphite/68">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-graphite py-20">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionTitle
              eyebrow="Solucion propuesta"
              title="Un ERP pequeno, enfocado en transporte local."
              text="La demo conserva la experiencia visual para defensa. El sistema operativo vive separado, con login local, roles y datos listos para avanzar sobre procesos reales."
            />
            <div className="mt-8 space-y-3">
              {impact.map((item) => (
                <div key={item} className="flex items-center gap-3 text-warmWhite/78">
                  <BadgeCheck className="shrink-0 text-emeraldTech" size={19} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <GlassCard className="p-5">
            <RouteMap />
          </GlassCard>
        </div>
      </section>

      <section className="bg-deepGreen py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionTitle
            align="center"
            eyebrow="Modulos clave"
            title="Todo gira alrededor de cuatro variables de investigacion."
            text="Mantenimiento, asistencia, logistica y finanzas se convierten en pantallas claras para demostrar impacto academico y utilidad real."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module, index) => {
              const icons = [BrainCircuit, BarChart3, ShieldCheck, MapPinned];
              const Icon = icons[index];
              return (
                <GlassCard key={module.title} className="p-6 transition hover:-translate-y-1">
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-emeraldTech/25 bg-emeraldTech/12 text-emeraldTech">
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold text-white">{module.title}</h3>
                  <p className="mt-3 leading-7 text-warmWhite/66">{module.text}</p>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
