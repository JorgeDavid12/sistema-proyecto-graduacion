import { useState } from 'react';
import { Save, Building2, Clock, ShieldCheck, Bell } from 'lucide-react';
import AppShell from '../components/AppShell';
import GlassCard from '../components/GlassCard';
import { getSettings, saveSettings } from '../services/api';
export default function Settings() {
  const [form, setForm] = useState(getSettings),
    [message, setMessage] = useState(''),
    [error, setError] = useState(false);
  function submit(e) {
    e.preventDefault();
    try {
      saveSettings(form);
      setError(false);
      setMessage('Configuración guardada correctamente.');
    } catch (e) {
      setError(true);
      setMessage(e.message);
    }
  }
  const field = (key, label, type = 'text') => <label className="field-label" key={key}>{label}<input className="form-input" required type={type} value={form[key]} onChange={e => setForm({
      ...form,
      [key]: e.target.value
    })} /></label>;
  return <AppShell><div className="page-content"><div className="page-heading"><div><span className="eyebrow">ADMINISTRACIÓN</span><h1>Configuración</h1><p>Define los datos de la empresa y las preferencias de operación.</p></div></div>
    {message && <p role="status" className={`notice mb-5 ${error ? 'error' : 'success'}`}>{message}</p>}<form onSubmit={submit}><div className="grid items-start gap-5 lg:grid-cols-2"><GlassCard className="p-6"><div className="flex items-center gap-3"><Building2 size={22} className="text-emeraldTech" /><h2>Información de la empresa</h2></div><div className="mt-6 grid gap-5">{field('company', 'Nombre comercial')}{field('location', 'Sede de operación')}</div></GlassCard><GlassCard className="p-6"><div className="flex items-center gap-3"><Clock size={22} className="text-emeraldTech" /><h2>Horario de la jornada</h2></div><p className="mt-3 text-sm text-warmWhite/55">Horario de referencia para el equipo operativo.</p><div className="mt-6 grid grid-cols-2 gap-5">{field('start', 'Inicio', 'time')}{field('end', 'Cierre', 'time')}</div><p className="mt-4 text-xs text-warmWhite/40">Zona horaria: Guatemala (UTC−6).</p></GlassCard><GlassCard className="p-6"><div className="flex items-center gap-3"><Bell size={22} className="text-emeraldTech" /><h2>Prioridades en el resumen</h2></div><div className="mt-5 grid gap-5">{[['maintenanceAlerts', 'Servicios de prioridad alta', 'Mostrar mantenimientos que requieren atención.'], ['quotaAlerts', 'Cuotas pendientes', 'Mostrar los saldos por cobrar de la jornada.']].map(([key, label, desc]) => <label className="flex items-center justify-between gap-4" key={key}><span><strong className="text-sm">{label}</strong><small className="mt-1 block text-warmWhite/50">{desc}</small></span><input type="checkbox" checked={form[key]} onChange={e => setForm({
                  ...form,
                  [key]: e.target.checked
                })} className="h-5 w-5 accent-emeraldTech" /></label>)}</div></GlassCard><GlassCard className="p-6"><div className="flex items-center gap-3"><ShieldCheck size={22} className="text-emeraldTech" /><h2>Perfiles de acceso</h2></div><div className="mt-5 grid gap-4"><div className="permission-row"><strong>Administrador</strong><p>Flota, cuotas, asistencia, mantenimiento, reportes y configuración.</p></div><div className="permission-row"><strong>Piloto</strong><p>Jornada asignada, puntos de control y registro de llegadas.</p></div></div></GlassCard></div><div className="mt-6 flex justify-end"><button className="primary-button" type="submit"><Save size={17} />Guardar configuración</button></div></form>
  </div></AppShell>;
}
