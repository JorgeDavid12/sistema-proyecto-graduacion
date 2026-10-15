import { Link, NavLink, useLocation } from 'react-router-dom';
import { BarChart3, Bot, ClipboardList, FileSpreadsheet, LogOut, MapPinned, Route, Settings, ShieldCheck, UserRound, Menu, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getSettings } from '../services/api';
const links = [{
  to: '/sistema',
  label: 'Resumen',
  icon: BarChart3,
  roles: ['administrador']
}, {
  to: '/sistema/operacion',
  label: 'Operación diaria',
  icon: ClipboardList,
  roles: ['administrador']
}, {
  to: '/sistema/reportes',
  label: 'Reportes',
  icon: FileSpreadsheet,
  roles: ['administrador']
}, {
  to: '/sistema/gps',
  label: 'Rutas y jornadas',
  icon: MapPinned,
  roles: ['administrador']
}, {
  to: '/sistema/ia',
  label: 'Asistente de IA',
  icon: Bot,
  roles: ['administrador']
}, {
  to: '/sistema/piloto',
  label: 'Jornada del piloto',
  icon: Route,
  roles: ['administrador', 'piloto']
}, {
  to: '/sistema/configuracion',
  label: 'Configuración',
  icon: Settings,
  roles: ['administrador']
}];
export default function AppShell({
  children,
  compact = false
}) {
  const {
      isAuthenticated,
      logout,
      user
    } = useAuth(),
    location = useLocation(),
    [open, setOpen] = useState(false);
  const visible = links.filter(x => x.roles.includes(user?.role)),
    current = visible.find(x => x.to === location.pathname),
    company = getSettings().company;
  const home = user?.role === 'piloto' ? '/sistema/piloto' : '/sistema';
  if (compact) return <div className="min-h-screen bg-graphite text-warmWhite">{children}</div>;
  return <div className="workspace-shell min-h-screen bg-graphite text-warmWhite">
    {open && <button className="sidebar-overlay" aria-label="Cerrar menú" onClick={() => setOpen(false)} />}
    <aside className={`workspace-sidebar ${open ? 'is-open' : ''}`}>
      <Link to={home} className="brand"><span className="brand-mark"><Route size={24} /></span><span><strong>{company}</strong><small>GESTIÓN DE FLOTAS</small></span></Link>
      <div className="sidebar-label">ESPACIO DE TRABAJO</div>
      <nav aria-label="Navegación principal">{visible.map(({
          to,
          label,
          icon: Icon
        }) => <NavLink key={to} to={to} end={to === '/sistema'} onClick={() => setOpen(false)} className={({
          isActive
        }) => `sidebar-link ${isActive ? 'active' : ''}`}><Icon size={19} /><span>{label}</span>{label === 'Asistente de IA' && <span className="tiny-badge">IA</span>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="flex items-center gap-3"><ShieldCheck size={20} className="text-emeraldTech" /><div><strong className="block text-sm">Acceso por perfil</strong><small className="text-warmWhite/60">{user?.role === 'piloto' ? 'Operación de unidad' : 'Administración de flota'}</small></div></div><p className="mt-4 text-xs text-warmWhite/40">Cuilapa · Santa Rosa, Guatemala</p></div>
    </aside>
    <div className="workspace-content">
      <header className="workspace-topbar">
        <div className="flex min-w-0 items-center gap-3"><button className="icon-button menu-toggle" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button><span className="hidden text-sm text-warmWhite/45 sm:inline">Flota</span><ChevronRight size={14} className="hidden text-warmWhite/30 sm:block" /><span className="truncate text-sm font-medium">{current?.label || 'Mototaxi David'}</span></div>
        <div className="flex items-center gap-3"><div className="avatar"><UserRound size={17} /></div><div className="hidden sm:block"><strong className="block text-xs">{user?.display_name}</strong><small className="text-[11px] capitalize text-warmWhite/50">{user?.role}</small></div>{isAuthenticated && <button className="icon-button" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>}</div>
      </header>
      <main>{children}</main>
    </div>
  </div>;
}
