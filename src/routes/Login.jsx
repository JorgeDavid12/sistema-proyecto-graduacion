import { Eye, EyeOff, ArrowRight, Route, LockKeyhole, ShieldCheck, Truck, Wrench, MapPinned, Loader2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { getSettings } from '../services/api';
export default function Login() {
  const location = useLocation(),
    navigate = useNavigate(),
    {
      bootstrapping,
      isAuthenticated,
      login,
      user
    } = useAuth();
  const [form, setForm] = useState({
      username: '',
      password: ''
    }),
    [visible, setVisible] = useState(false),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [support, setSupport] = useState(false);
  const company = getSettings().company;
  const home = role => role === 'piloto' ? '/sistema/piloto' : '/sistema';
  if (!bootstrapping && isAuthenticated) return <Navigate to={home(user?.role)} replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const u = await login(form.username, form.password),
        p = location.state?.from?.pathname;
      const allowed = u.role === 'administrador' ? p?.startsWith('/sistema') && p !== '/sistema/login' : p === '/sistema/piloto';
      navigate(allowed ? p : home(u.role), {
        replace: true
      });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <div className="login-page">
    <section className="login-story"><div className="brand"><span className="brand-mark"><Route size={25} /></span><span><strong>{company}</strong><small>SISTEMA INTEGRAL DE FLOTAS</small></span></div>
      <div className="login-story-body"><span className="eyebrow">CONTROL Y CONTINUIDAD OPERATIVA</span><h1>Tu flota. <br />Una sola <br /><span>visión.</span></h1><p>La información que necesitas para cuidar tus unidades, organizar al equipo y cerrar cada jornada con claridad.</p>
        <div className="login-features">{[{
            icon: Truck,
            title: 'Operación centralizada',
            text: 'Unidades, pilotos y cuotas en un mismo lugar.'
          }, {
            icon: Wrench,
            title: 'Mantenimiento preventivo',
            text: 'Prioridades y servicios para cuidar la flota.'
          }, {
            icon: MapPinned,
            title: 'Control de jornadas',
            text: 'Puntos de control de la ruta Cuilapa–Oratorio.'
          }].map(({
            icon: Icon,
            title,
            text
          }) => <div key={title}><span><Icon size={21} /></span><div><strong>{title}</strong><small>{text}</small></div></div>)}</div>
      </div><div className="login-story-footer">Cuilapa, Santa Rosa <span>·</span> Guatemala</div>
    </section>
    <section className="login-access"><div className="login-form-wrap"><div className="login-lock"><LockKeyhole size={24} /></div><span className="eyebrow mt-7 block">BIENVENIDO A TU ESPACIO</span><h2>Iniciar sesión</h2><p className="login-description">Ingresa con tu cuenta para acceder a las herramientas de tu equipo.</p>
      <form onSubmit={submit} className="mt-8 grid gap-5"><label className="field-label">Usuario<div className="input-icon"><UserRound size={18} /><input autoComplete="username" name="username" placeholder="Tu nombre de usuario" required value={form.username} onChange={e => setForm({
                ...form,
                username: e.target.value
              })} autoCapitalize="none" spellCheck="false" /></div></label>
      <label className="field-label">Contraseña<div className="input-icon"><LockKeyhole size={18} /><input autoComplete="current-password" name="password" placeholder="Ingresa tu contraseña" type={visible ? 'text' : 'password'} required value={form.password} onChange={e => setForm({
                ...form,
                password: e.target.value
              })} /><button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
      <button type="button" className="text-right text-sm text-emeraldTech" onClick={() => setSupport(!support)}>¿Necesitas ayuda para acceder?</button>
      {support && <p className="notice">Solicita al administrador de Mototaxi David la revisión de tu usuario o el restablecimiento de tu contraseña.</p>}
      {message && <p role="alert" className="notice error">{message}</p>}
      <button type="submit" className="primary-button w-full" disabled={busy || bootstrapping}>{busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />} {busy ? 'Verificando acceso…' : 'Ingresar al sistema'}</button>
      </form><div className="login-permissions"><ShieldCheck size={18} /><p>Tu perfil determina las funciones disponibles.<br /><span>Administración de flota y jornada del piloto.</span></p></div>
    </div><footer>© {new Date().getFullYear()} {company} · Gestión de transporte</footer></section>
  </div>;
}
