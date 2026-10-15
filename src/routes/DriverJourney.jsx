import { useEffect, useState } from 'react';
import { Play, Pause, CheckCircle2, MapPin, Route, Clock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import AppShell from '../components/AppShell';
import GlassCard from '../components/GlassCard';
import { getJourneyData, updateJourney, getSettings, today } from '../services/api';
export default function DriverJourney() {
  const {
      user
    } = useAuth(),
    [route, setRoute] = useState(null),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const update = () => getJourneyData().then(d => setRoute(d.route));
    update();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  async function act(action) {
    setBusy(true);
    setMessage('');
    try {
      const next = await updateJourney(action);
      setRoute(next);
      setMessage(action === 'checkin' ? 'Llegada registrada correctamente.' : action === 'start' ? 'Jornada iniciada. Registra tu llegada en cada punto de control.' : 'Jornada pausada.');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!route) return <AppShell><p className="page-content">Cargando jornada…</p></AppShell>;
  const next = route.stops.find(s => s.state !== 'Completado'),
    settings = getSettings();
  return <AppShell><div className="page-content"><div className="page-heading"><div><span className="eyebrow">OPERACIÓN DEL PILOTO</span><h1>Mi jornada</h1><p>{user.role === 'administrador' ? 'Supervisión de la jornada de Rubén Castillo' : 'Rubén Castillo · Unidad asignada MB-001'}</p></div><span className="date-chip"><Clock size={16} />{today()} · {settings.start}–{settings.end}</span></div>
    <div className="journey-layout"><GlassCard className="p-6"><div className="flex items-start justify-between"><div><span className="eyebrow">UNIDAD ASIGNADA</span><h2 className="mt-2 !text-4xl">{route.vehicleId}</h2><p className="mt-2 text-sm text-warmWhite/60">Microbús · Rubén Castillo</p></div><span className="brand-mark"><Route size={25} /></span></div><div className="journey-state"><span className={`status-badge ${route.running ? '' : 'neutral'}`}>{route.finished ? 'Recorrido finalizado' : route.running ? 'Jornada en curso' : 'Jornada pausada'}</span><h3>{route.name}</h3><p>{route.finished ? 'Todos los puntos de control fueron completados.' : `Próximo punto: ${next?.name}`}</p></div>
      <div className="grid grid-cols-2 gap-3"><div className="stat-tile"><span>Puntos completados</span><strong>{route.stops.filter(s => s.state === 'Completado').length} / {route.stops.length}</strong></div><div className="stat-tile"><span>Último registro</span><strong>{route.lastUpdate ? new Date(route.lastUpdate).toLocaleTimeString('es-GT', {
                  timeZone: 'America/Guatemala',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Sin registro'}</strong></div></div>
      <div className="mt-6 grid gap-3">{!route.finished && <button className="primary-button w-full" disabled={busy} onClick={() => act(route.running ? 'pause' : 'start')}>{route.running ? <Pause size={17} /> : <Play size={17} />} {route.running ? 'Pausar jornada' : 'Iniciar jornada'}</button>}<button className="secondary-button w-full" disabled={busy || !route.running || route.finished} onClick={() => act('checkin')}><CheckCircle2 size={18} />{route.finished ? 'Recorrido completado' : `Registrar llegada a ${next?.name}`}</button></div>{message && <p role="status" className="notice mt-4">{message}</p>}<div className="mt-6 border-t border-warmWhite/10 pt-4 text-xs leading-5 text-warmWhite/50"><ShieldCheck size={16} className="mb-2 text-emeraldTech" />Registra únicamente llegadas de tu jornada. El control de puntos se actualiza al confirmar cada destino.</div>
    </GlassCard><GlassCard className="p-6"><span className="eyebrow">ITINERARIO DE LA UNIDAD</span><h2 className="mt-2">Puntos de control</h2><p className="mt-2 text-sm text-warmWhite/50">Salida, avance y llegada a destino.</p><div className="journey-stops">{route.stops.map((s, i) => <div className={`journey-stop ${s.state === 'Completado' ? 'complete' : ''}`} key={s.name}><span>{s.state === 'Completado' ? <CheckCircle2 size={19} /> : <MapPin size={19} />}</span><div><strong>{s.name}</strong><small>{s.state === 'Completado' ? 'Paso registrado' : 'Horario de referencia'} · {s.time}</small></div><span className={`status-badge ${s.state === 'Pendiente' ? 'neutral' : ''}`}>{s.state}</span></div>)}</div></GlassCard></div>
  </div></AppShell>;
}
