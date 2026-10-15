import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowUp, Plus, Sparkles, CheckCircle2, ArrowRight, UserRound, Loader2, Database, Wrench, Wallet, Users, Route } from 'lucide-react';
import AppShell from '../components/AppShell';
import GlassCard from '../components/GlassCard';
import { askLocalAssistant } from '../services/api';
const suggestions = [{
  icon: Wrench,
  label: 'Mantenimiento',
  question: '¿Qué unidades necesitan mantenimiento?'
}, {
  icon: Wallet,
  label: 'Cuotas pendientes',
  question: '¿Cuánto falta por cobrar hoy?'
}, {
  icon: Users,
  label: 'Asistencia',
  question: '¿Qué piloto tiene más ausencias?'
}, {
  icon: Route,
  label: 'Estado de la ruta',
  question: '¿Cómo va la ruta Cuilapa–Oratorio?'
}];
const destinations = {
  cuotas: '/sistema/operacion',
  asistencia: '/sistema/operacion',
  mantenimiento: '/sistema/operacion',
  ruta: '/sistema/piloto'
};
export default function AiSettings() {
  const [question, setQuestion] = useState(''),
    [messages, setMessages] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem('fleet_conversation_v2')) || [];
      } catch {
        return [];
      }
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const end = useRef(null),
    input = useRef(null),
    pending = useRef(false);
  useEffect(() => {
    sessionStorage.setItem('fleet_conversation_v2', JSON.stringify(messages));
    if (messages.length) end.current?.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    });
  }, [messages, busy]);
  async function send(value) {
    const text = value.trim();
    if (!text || pending.current) return;
    pending.current = true;
    setBusy(true);
    setQuestion('');
    setError('');
    setMessages(m => [...m, {
      id: crypto.randomUUID(),
      role: 'user',
      text
    }]);
    try {
      const response = await askLocalAssistant(text);
      setMessages(m => [...m, {
        id: crypto.randomUUID(),
        role: 'assistant',
        ...response
      }]);
    } catch (e) {
      setError(e.message);
    } finally {
      pending.current = false;
      setBusy(false);
      input.current?.focus();
    }
  }
  return <AppShell><div className="page-content ai-page"><div className="page-heading"><div><span className="eyebrow">INTELIGENCIA OPERATIVA</span><h1>Asistente de operaciones</h1><p>Convierte los registros de tu flota en decisiones concretas.</p></div><button className="secondary-button" disabled={busy} onClick={() => {
          setMessages([]);
          setError('');
          input.current?.focus();
        }}><Plus size={17} />Nueva consulta</button></div>
    <div className="ai-layout"><GlassCard className="chat-panel"><div className="chat-header"><div className="flex items-center gap-3"><span className="brand-mark"><Bot size={23} /></span><div><strong className="block text-sm">Asistente Mototaxi David</strong><small className="text-warmWhite/50">Consultas sobre registros de operación</small></div></div><span className="status-badge"><span className="h-1.5 w-1.5 rounded-full bg-emeraldTech" />Disponible</span></div>
      <div className="chat-messages" aria-live="polite" aria-busy={busy}>
        {!messages.length && <div className="chat-welcome"><span className="welcome-icon"><Sparkles size={28} /></span><h2>¿Qué necesitas revisar hoy?</h2><p>Consulta cuotas, servicios pendientes, asistencia y avances de la ruta. Las respuestas se basan en los registros disponibles.</p><div className="suggestion-grid">{suggestions.map(({
                  icon: Icon,
                  label,
                  question: q
                }) => <button key={label} onClick={() => send(q)} disabled={busy}><Icon size={19} /><strong>{label}</strong><span>{q}</span><ArrowRight size={16} /></button>)}</div></div>}
        {messages.map(m => <div key={m.id} className={`chat-message ${m.role === 'user' ? 'from-user' : ''}`}><span className="message-avatar">{m.role === 'user' ? <UserRound size={17} /> : <Bot size={19} />}</span><div className="message-body">{m.role === 'user' ? <p>{m.text}</p> : <><span className="eyebrow">ANÁLISIS DE REGISTROS</span><p className="assistant-answer">{m.answer}</p>{m.insights?.length > 0 && <details open><summary>Datos consultados</summary><ul>{m.insights.map((x, i) => <li key={i}>{x}</li>)}</ul></details>}{m.suggested_actions?.length > 0 && <div className="assistant-actions"><strong>Acciones recomendadas</strong>{m.suggested_actions.map((x, i) => <p key={i}><CheckCircle2 size={15} /><span>{x}</span></p>)}</div>}{m.sources?.length > 0 && <div className="source-chips">{m.sources.map(x => <span key={x}><Database size={12} />{x}</span>)}</div>}{destinations[m.matched_topic] && <Link to={destinations[m.matched_topic]} className="mt-4 inline-flex items-center gap-2 text-sm text-emeraldTech">Abrir módulo correspondiente<ArrowRight size={15} /></Link>}<small className="mt-4 block text-xs text-warmWhite/40">Consultado {new Date(m.at).toLocaleTimeString('es-GT', {
                      timeZone: 'America/Guatemala',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} · Los registros pueden cambiar después de esta consulta.</small></>}</div></div>)}
        {busy && <div className="flex items-center gap-2 text-sm text-warmWhite/60"><Loader2 size={17} className="animate-spin" />Consultando los registros…</div>}{error && <p role="alert" className="notice error">{error}</p>}<div ref={end} />
      </div><form className="chat-composer" onSubmit={e => {
            e.preventDefault();
            send(question);
          }}><label className="sr-only" htmlFor="assistant-question">Consulta al asistente</label><textarea id="assistant-question" ref={input} value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ej. ¿Qué servicios tiene pendientes MT-079?" maxLength={600} rows={2} onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(question);
              }
            }} /><button aria-label="Enviar consulta" className="primary-button" disabled={!question.trim() || busy}>{busy ? <Loader2 size={19} className="animate-spin" /> : <ArrowUp size={20} />}</button><p>Enter para enviar · Shift + Enter para una nueva línea. Verifica las recomendaciones antes de aplicarlas.</p></form>
    </GlassCard><aside className="grid gap-5"><GlassCard className="p-5"><span className="eyebrow">ALCANCE DE LAS CONSULTAS</span><h2 className="mt-2">Información a tu alcance</h2><div className="mt-5 grid gap-5">{suggestions.map(({
                icon: Icon,
                label,
                question: q
              }) => <button className="flex items-center gap-3 text-left" onClick={() => send(q)} disabled={busy} key={label}><Icon size={19} className="text-emeraldTech" /><span className="text-sm">{label}</span><ArrowRight size={14} className="ml-auto text-warmWhite/40" /></button>)}</div></GlassCard><GlassCard className="p-5"><h2>Decisiones con contexto</h2><p className="mt-3 text-sm leading-6 text-warmWhite/60">El asistente consulta los datos actuales. Cuando no hay suficiente historial para una tendencia o un diagnóstico, te indica qué información falta.</p><div className="mt-5 border-t border-warmWhite/10 pt-4 text-xs leading-5 text-warmWhite/45">Las recomendaciones de mantenimiento apoyan la planificación. La evaluación mecánica corresponde al personal responsable.</div></GlassCard></aside></div>
  </div></AppShell>;
}
