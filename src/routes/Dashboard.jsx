import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Banknote, AlertTriangle, Wrench, Search, ArrowRight, Bot, RefreshCw, CalendarDays } from 'lucide-react';
import AppShell from '../components/AppShell';
import GlassCard from '../components/GlassCard';
import MetricCard from '../components/MetricCard';
import RouteMap from '../components/RouteMap';
import { getLocalDashboardData, money, today } from '../services/api';
export default function Dashboard() {
  const [data, setData] = useState(getLocalDashboardData),
    [search, setSearch] = useState('');
  useEffect(() => {
    const update = () => setData(getLocalDashboardData());
    window.addEventListener('operations-updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('operations-updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);
  const vehicles = data.fleet.filter(v => `${v.id} ${v.driver} ${v.line}`.toLowerCase().includes(search.toLowerCase()));
  return <AppShell><div className="page-content">
    <div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN DE FLOTA</span><h1>Resumen de operación</h1><p>Cuotas, disponibilidad y prioridades de tu jornada.</p></div><div className="flex flex-wrap items-center gap-3"><span className="date-chip"><CalendarDays size={16} />{new Date(`${today()}T12:00:00`).toLocaleDateString('es-GT', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}</span><Link to="/sistema/operacion" className="primary-button"><Banknote size={16} />Registrar operación</Link></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{data.kpis.map(m => <MetricCard key={m.label} {...m} />)}</div>
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.65fr_1fr]">
      <GlassCard className="overflow-hidden"><div className="panel-heading"><div><span className="eyebrow">6 UNIDADES · 2 TIPOS DE TRANSPORTE</span><h2>Estado de la flota</h2></div><button className="icon-button" onClick={() => setData(getLocalDashboardData())} aria-label="Actualizar resumen"><RefreshCw size={17} /></button></div>
        <label className="fleet-search"><Search size={17} /><input aria-label="Buscar unidad o piloto" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar unidad, línea o piloto…" /></label>
        <div className="overflow-x-auto"><table className="data-table min-w-[660px]"><thead><tr><th>Unidad / piloto</th><th>Kilometraje</th><th>Cuota de hoy</th><th>Condición</th></tr></thead><tbody>{vehicles.map(v => <tr key={v.id}><td><strong>{v.id}</strong><small>{v.driver}</small></td><td>{v.km.toLocaleString('es-GT')} km</td><td><span className={v.paidToday ? 'text-emeraldTech' : 'text-alertAmber'}>{!v.dailyQuota ? 'Sin cuota' : v.paidToday ? 'Completa' : 'Pendiente'}</span></td><td><span className={`status-badge ${v.status === 'Alerta' ? 'warning' : v.status === 'Mantenimiento' ? 'neutral' : ''}`}>{v.status}</span></td></tr>)}{!vehicles.length && <tr><td colSpan="4">No se encontraron unidades para esta búsqueda.</td></tr>}</tbody></table></div>
      </GlassCard>
      <div className="grid gap-5"><GlassCard className="p-5"><div className="flex items-center justify-between"><h2>Prioridades de hoy</h2><AlertTriangle size={20} className="text-alertAmber" /></div><div className="mt-4 grid gap-3">{data.alerts.map(a => <Link to="/sistema/operacion" key={a.title} className="priority-item"><span>{a.level}</span><strong>{a.title}</strong><p>{a.detail}</p><ArrowUpRight size={16} /></Link>)}{!data.alerts.length && <p className="text-sm text-warmWhite/60">Las cuotas y servicios prioritarios están al día.</p>}</div></GlassCard>
      <GlassCard className="p-5"><div className="flex items-center gap-3"><span className="brand-mark"><Bot size={21} /></span><div><h2>Asistente de operaciones</h2><p className="text-sm text-warmWhite/50">Analiza registros y prioriza acciones.</p></div></div><Link className="secondary-button mt-5 w-full" to="/sistema/ia">Consultar al asistente<ArrowRight size={16} /></Link></GlassCard></div>
    </div>
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-2"><GlassCard className="p-5"><div className="panel-heading !px-0 !pt-0"><div><span className="eyebrow">CONTROL FINANCIERO</span><h2>Cobranza de la jornada</h2></div><Banknote size={21} className="text-emeraldTech" /></div><div className="mt-4 flex items-end justify-between"><strong className="text-3xl text-white">{money(data.quotaSummary.received_today)}</strong><span className="text-sm text-warmWhite/50">de {money(data.quotaSummary.expected_today)}</span></div><div className="progress-track mt-4"><span style={{
              width: `${data.quotaSummary.collection_rate}%`
            }} /></div><div className="mt-3 flex justify-between text-sm"><span className="text-warmWhite/60">{data.quotaSummary.collection_rate}% recaudado</span><span className="text-alertAmber">{money(data.quotaSummary.pending_today)} pendiente</span></div><Link to="/sistema/reportes" className="mt-6 inline-flex items-center gap-2 text-sm text-emeraldTech">Revisar cierre diario<ArrowRight size={16} /></Link></GlassCard>
      <GlassCard className="p-5"><div className="flex items-center justify-between"><h2>Próximos servicios</h2><Wrench size={20} className="text-emeraldTech" /></div><div className="mt-4 grid gap-3">{data.maintenance.slice(0, 4).map(m => <div key={m.id} className="flex items-center justify-between gap-3 border-b border-warmWhite/10 pb-3"><div><strong className="text-sm">{m.vehicle} · {m.task}</strong><p className="mt-1 text-xs text-warmWhite/50">{m.due}</p></div><span className={`status-badge ${m.risk === 'Alta' ? 'warning' : 'neutral'}`}>{m.risk}</span></div>)}{!data.maintenance.length && <p className="text-sm text-warmWhite/60">No hay servicios pendientes.</p>}</div></GlassCard></div>
    <div className="mt-6 grid items-start gap-5 xl:grid-cols-[1.3fr_1fr]"><RouteMap stops={data.route.stops} routeName={data.route.name} vehicleId={data.route.vehicleId} eyebrow="Puntos de control de ruta" compact /><GlassCard className="p-5"><h2>Actividad reciente</h2><p className="mt-1 text-sm text-warmWhite/50">Registro de movimientos de la operación.</p><div className="mt-5 grid gap-4">{data.activity.slice(0, 5).map(a => <div key={a.id} className="activity-item"><span /><div><strong className="text-sm">{a.action}</strong><small>{a.actor} · {new Date(a.at).toLocaleString('es-GT', {
                    timeZone: 'America/Guatemala'
                  })}</small></div></div>)}{!data.activity.length && <p className="notice">Los registros de cuotas, asistencia y servicios aparecerán aquí conforme se realicen.</p>}</div></GlassCard></div>
  </div></AppShell>;
}
