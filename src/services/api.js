import { fleet, maintenance, routeStops } from '../data/fleetData';
// Prototipo autocontenido: acceso local y consultas por reglas; no servidor ni IA generativa.
export const AUTH_STORAGE_KEY = 'mototaxi_david_session_v2';
const DATA_KEY = 'mototaxi_david_operations_v2';
const SETTINGS_KEY = 'mototaxi_david_settings_v2';
const users = {
  admin: {
    password: 'admin123',
    id: 1,
    username: 'admin',
    display_name: 'Administración',
    role: 'administrador'
  },
  piloto: {
    password: 'piloto123',
    id: 2,
    username: 'piloto',
    display_name: 'Rubén Castillo',
    role: 'piloto',
    driver_id: 6
  }
};
const drivers = ['Carlos Méndez', 'Luis García', 'Mario López', 'Edwin Pérez', 'Víctor Santos', 'Rubén Castillo'].map((name, i) => ({
  id: i + 1,
  name,
  phone: `5550-100${i + 1}`
}));
export const today = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Guatemala',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).format(new Date());
const time = () => new Date().toISOString();
const copy = x => structuredClone(x);
const wait = x => Promise.resolve(copy(x));
export const money = x => `Q ${Number(x || 0).toLocaleString('es-GT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;
function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}
function seed() {
  const date = today();
  const vehicles = fleet.map((v, i) => ({
    ...v,
    driver: drivers[i].name,
    driver_id: i + 1,
    daily_quota: v.dailyQuota,
    next_service: v.nextService
  }));
  const payments = vehicles.filter(v => v.daily_quota && v.paidToday).map((v, i) => ({
    id: `initial-${i}`,
    vehicle_id: v.id,
    driver_id: v.driver_id,
    work_date: date,
    expected_amount: v.daily_quota,
    received_amount: v.daily_quota
  }));
  const attendance = drivers.map(d => ({
    id: `attendance-${d.id}`,
    driver_id: d.id,
    work_date: date,
    status: d.id === 4 ? 'Ausente' : d.id === 6 ? 'En ruta' : 'Presente'
  }));
  // Historial de ejemplo compartido por panel, reportes y asistente.
  for (let days = 1; days <= 22; days++) {
    const dt = new Date(`${date}T12:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - days);
    const work_date = dt.toISOString().slice(0, 10);
    vehicles.filter(v => v.daily_quota).forEach((v, i) => payments.push({
      id: `history-${days}-${i}`,
      vehicle_id: v.id,
      driver_id: v.driver_id,
      work_date,
      expected_amount: 125,
      received_amount: i === 1 && days % 4 === 0 ? 0 : 125
    }));
    drivers.forEach(d => attendance.push({
      id: `history-att-${days}-${d.id}`,
      driver_id: d.id,
      work_date,
      status: d.id === 4 && days % 7 === 0 ? 'Ausente' : 'Presente'
    }));
  }
  return {
    vehicles,
    payments,
    attendance,
    maintenance: maintenance.map((m, i) => ({
      id: i + 1,
      vehicle_id: m.vehicle,
      task: m.task,
      due_label: m.due,
      risk: m.risk,
      cost_estimate: [450, 180, 300, 250][i],
      completed: false
    })),
    tracking: [],
    route: {
      name: 'Cuilapa - Oratorio',
      vehicleId: 'MB-001',
      stops: copy(routeStops),
      running: false,
      finished: false,
      lastUpdate: null
    },
    activity: []
  };
}
function state() {
  const stored = read(DATA_KEY, null);
  if (stored) return stored;
  const initial = seed();
  localStorage.setItem(DATA_KEY, JSON.stringify(initial));
  return initial;
}
function save(data, action) {
  if (action) data.activity.unshift({
    id: crypto.randomUUID(),
    action,
    at: time(),
    actor: read(AUTH_STORAGE_KEY, {})?.user?.display_name || 'Piloto'
  });
  data.activity = data.activity.slice(0, 100);
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event('operations-updated'));
}
function vehicleFor(data, id) {
  const v = data.vehicles.find(v => v.id === id);
  if (!v) throw new Error('Selecciona una unidad válida.');
  return v;
}
function finite(value, min = 0, max = Infinity) {
  if (!Number.isFinite(Number(value)) || Number(value) < min || Number(value) > max) throw new Error(`Valor fuera del rango permitido (mínimo ${min}${max === Infinity ? '' : `, máximo ${max}`}).`);
}
export async function loginWithCredentials({
  username,
  password
}) {
  const a = users[username.toLowerCase()];
  if (!a || a.password !== password) throw new Error('Usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.');
  const {
    password: _,
    ...user
  } = a;
  return wait({
    access_token: crypto.randomUUID(),
    expires_at: Date.now() + 8 * 3600000,
    token_type: 'local',
    user
  });
}
export async function getCurrentUser() {
  const s = read(AUTH_STORAGE_KEY, null),
    u = s?.user,
    a = u && users[u.username];
  if (!a || !s.expires_at || s.expires_at < Date.now() || a.role !== u.role) throw new Error('La sesión ha vencido. Inicia sesión nuevamente.');
  const {
    password: _,
    ...user
  } = a;
  return wait(user);
}
export async function logoutSession() {
  return wait({
    ok: true
  });
}
function dailyData(data, date) {
  const hasRecords = date === today() || data.payments.some(p => p.work_date === date) || data.attendance.some(a => a.work_date === date);
  const quotas = (hasRecords && date <= today() ? data.vehicles : []).filter(v => v.daily_quota > 0).map(v => {
    const p = data.payments.filter(p => p.vehicle_id === v.id && p.work_date === date);
    return {
      vehicle_id: v.id,
      driver_name: v.driver,
      expected: p.length ? p[0].expected_amount : v.daily_quota,
      received: p.reduce((n, p) => n + p.received_amount, 0)
    };
  });
  const expected = quotas.reduce((n, v) => n + v.expected, 0),
    received = quotas.reduce((n, v) => n + v.received, 0),
    pending = quotas.filter(v => v.received < v.expected),
    attendance = data.attendance.filter(a => a.work_date === date);
  return {
    report_date: date,
    expected_amount: expected,
    received_amount: received,
    pending_amount: Math.max(0, expected - received),
    collection_rate: expected ? Math.round(received / expected * 100) : 0,
    payments_pending: pending.length,
    attendance_absent: attendance.filter(a => a.status === 'Ausente').length,
    maintenance_open: data.maintenance.filter(m => !m.completed).length,
    alerts_open: pending.length + data.maintenance.filter(m => !m.completed && m.risk === 'Alta').length,
    quotas,
    attendance
  };
}
export function getLocalDashboardData() {
  const data = state(),
    d = dailyData(data, today()),
    active = data.vehicles.filter(v => v.status !== 'Mantenimiento').length,
    compliance = d.attendance.length ? Math.round(d.attendance.filter(a => ['Presente', 'En ruta'].includes(a.status)).length / d.attendance.length * 100) : 0;
  const preferences = getSettings();
  const alerts = (preferences.quotaAlerts ? d.quotas : []).filter(v => v.received < v.expected).map(v => ({
    title: `${v.vehicle_id} · cuota pendiente`,
    detail: `${v.driver_name} tiene ${money(v.expected - v.received)} por entregar.`,
    level: 'Finanzas'
  }));
  data.maintenance.filter(m => preferences.maintenanceAlerts && !m.completed && m.risk === 'Alta').forEach(m => alerts.push({
    title: `${m.vehicle_id} · ${m.task}`,
    detail: `Prioridad alta · ${m.due_label}`,
    level: 'Mantenimiento'
  }));
  return {
    fleet: data.vehicles.map(v => ({
      ...v,
      dailyQuota: v.daily_quota,
      nextService: v.next_service,
      paidToday: !d.quotas.some(q => q.vehicle_id === v.id && q.received < q.expected)
    })),
    kpis: [{
      label: 'Cuotas recibidas hoy',
      value: money(d.received_amount),
      trend: `${d.collection_rate}% cobrado`,
      tone: 'green'
    }, {
      label: 'Unidades disponibles',
      value: `${active} / ${data.vehicles.length}`,
      trend: 'Flota total',
      tone: 'cyan'
    }, {
      label: 'Alertas por atender',
      value: alerts.length,
      trend: 'Pendientes',
      tone: 'amber'
    }, {
      label: 'Asistencia de hoy',
      value: `${compliance}%`,
      trend: `${d.attendance_absent} ausencia(s)`,
      tone: 'green'
    }],
    maintenance: data.maintenance.filter(m => !m.completed).map(m => ({
      ...m,
      vehicle: m.vehicle_id,
      due: m.due_label
    })),
    alerts,
    route: data.route,
    activity: data.activity,
    quotaSummary: {
      expected_today: d.expected_amount,
      received_today: d.received_amount,
      pending_today: d.pending_amount,
      collection_rate: d.collection_rate
    }
  };
}
export async function getDashboardData() {
  return wait(getLocalDashboardData());
}
export async function getJourneyData() {
  return wait({
    route: state().route
  });
}
export async function getOperationOptions() {
  const d = state();
  return wait({
    vehicles: d.vehicles,
    drivers,
    maintenance: d.maintenance
  });
}
export async function createQuotaPayment(payload) {
  const d = state(),
    v = vehicleFor(d, payload.vehicle_id);
  if (!v.daily_quota) throw new Error('Esta unidad no tiene cuota diaria asignada.');
  if (payload.driver_id !== v.driver_id) throw new Error('El piloto debe corresponder a la unidad asignada.');
  finite(payload.expected_amount, 0.01);
  finite(payload.received_amount, 0.01, payload.expected_amount);
  const records = d.payments.filter(p => p.vehicle_id === v.id && p.work_date === today()),
    paid = records.reduce((n, p) => n + p.received_amount, 0);
  if (records.length && records[0].expected_amount !== payload.expected_amount) throw new Error('La cuota esperada debe coincidir con la del primer abono del día.');
  if (paid + payload.received_amount > payload.expected_amount) throw new Error(`Esta unidad ya tiene ${money(paid)} registrados. El abono supera el saldo pendiente.`);
  const item = {
    ...payload,
    id: crypto.randomUUID(),
    work_date: today(),
    created_at: time(),
    status: 'Registrada'
  };
  d.payments.push(item);
  save(d, `Cuota ${v.id}: ${money(payload.received_amount)}`);
  return wait(item);
}
export async function createAttendance(payload) {
  if (!drivers.some(x => x.id === payload.driver_id) || !['Presente', 'Ausente', 'Descanso', 'En ruta'].includes(payload.status)) throw new Error('Selecciona un piloto y un estado válidos.');
  const d = state(),
    item = {
      ...payload,
      id: crypto.randomUUID(),
      work_date: today()
    };
  d.attendance = d.attendance.filter(a => !(a.driver_id === payload.driver_id && a.work_date === today()));
  d.attendance.push(item);
  save(d, `Asistencia de ${drivers.find(x => x.id === payload.driver_id).name}: ${payload.status}`);
  return wait(item);
}
export async function createMaintenance(payload) {
  const d = state();
  vehicleFor(d, payload.vehicle_id);
  finite(payload.cost_estimate);
  if (!payload.task.trim() || !payload.due_label.trim() || !['Baja', 'Media', 'Alta'].includes(payload.risk)) throw new Error('Completa el trabajo, vencimiento y prioridad.');
  const item = {
    ...payload,
    id: crypto.randomUUID(),
    completed: false
  };
  d.maintenance.push(item);
  save(d, `Servicio programado: ${payload.vehicle_id} · ${payload.task}`);
  return wait(item);
}
export async function completeMaintenance(id) {
  const d = state(),
    m = d.maintenance.find(m => m.id === id);
  if (!m) throw new Error('Servicio no encontrado.');
  m.completed = true;
  m.completed_at = time();
  save(d, `Servicio completado: ${m.vehicle_id} · ${m.task}`);
  return wait(m);
}
export async function updateVehicle(id, payload) {
  const d = state(),
    v = vehicleFor(d, id);
  finite(payload.km, v.km);
  finite(payload.health, 0, 100);
  if (!['Operativa', 'Alerta', 'Mantenimiento', 'En ruta'].includes(payload.status)) throw new Error('Estado inválido.');
  Object.assign(v, payload);
  save(d, `Unidad ${id} actualizada`);
  return wait(v);
}
export async function getReportsData(filters = {}) {
  const d = state(),
    date = filters.dailyDate || today(),
    monthKey = filters.month || today().slice(0, 7),
    daily = dailyData(d, date);
  const dates = [...new Set(d.payments.filter(p => p.work_date.startsWith(monthKey)).map(p => p.work_date))],
    totals = dates.map(date => dailyData(d, date));
  const expected = totals.reduce((n, x) => n + x.expected_amount, 0),
    received = totals.reduce((n, x) => n + x.received_amount, 0),
    open = d.maintenance.filter(m => !m.completed);
  return wait({
    daily,
    monthly: {
      year: +monthKey.slice(0, 4),
      month: +monthKey.slice(5),
      expected_amount: expected,
      received_amount: received,
      pending_amount: expected - received,
      collection_rate: expected ? +(received / expected * 100).toFixed(2) : 0,
      active_days: dates.length,
      payments_pending: totals.reduce((n, x) => n + x.payments_pending, 0)
    },
    maintenanceReport: {
      open_events: open.length,
      completed_events: d.maintenance.length - open.length,
      high_risk_open: open.filter(m => m.risk === 'Alta').length,
      estimated_open_cost: open.reduce((n, m) => n + m.cost_estimate, 0)
    },
    delinquency: {
      report_date: date,
      pending_total: daily.pending_amount,
      items: daily.quotas.filter(v => v.received < v.expected).map(v => ({
        vehicle_id: v.vehicle_id,
        driver_name: v.driver_name,
        pending_amount: v.expected - v.received,
        days_overdue: Math.max(0, Math.floor((new Date(`${today()}T12:00:00Z`) - new Date(`${date}T12:00:00Z`)) / 86400000)),
        status: 'Pendiente'
      }))
    }
  });
}
export async function downloadReport(report, filters) {
  const data = await getReportsData(filters),
    labels = {
      expected_amount: 'Monto esperado',
      received_amount: 'Monto recibido',
      pending_amount: 'Saldo pendiente',
      collection_rate: 'Cobranza (%)',
      report_date: 'Fecha',
      payments_pending: 'Cuotas pendientes',
      attendance_absent: 'Ausencias',
      maintenance_open: 'Servicios abiertos',
      alerts_open: 'Alertas',
      open_events: 'Servicios abiertos',
      completed_events: 'Servicios completados',
      high_risk_open: 'Prioridad alta',
      estimated_open_cost: 'Costo estimado',
      active_days: 'Días registrados',
      year: 'Año',
      month: 'Mes'
    };
  const source = report === 'maintenance' ? data.maintenanceReport : data[report];
  const rows = report === 'delinquency' ? [['Unidad', 'Piloto', 'Pendiente (Q)', 'Días de mora', 'Estado'], ...data.delinquency.items.map(x => [x.vehicle_id, x.driver_name, x.pending_amount, x.days_overdue, x.status])] : [['Campo', 'Valor'], ...Object.entries(source).filter(([, v]) => !Array.isArray(v)).map(([k, v]) => [labels[k] || k, v])];
  const cell = v => `"${String(v ?? '').replace(/^[=+@-]/, "'$&").replaceAll('"', '""')}"`,
    url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(r => r.map(cell).join(',')).join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `mototaxi-${report}-${filters?.dailyDate || today()}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function askLocalAssistant(question) {
  const text = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    d = state(),
    daily = dailyData(d, today());
  const result = {
    mode: 'local',
    answer: '',
    insights: [],
    suggested_actions: [],
    matched_topic: 'general',
    sources: [],
    at: time()
  };
  const selected = d.vehicles.filter(v => text.includes(v.id.toLowerCase()) || new RegExp(`\\b${v.id.slice(3)}\\b`).test(text)),
    matches = id => !selected.length || selected.some(x => x.id === id);
  if (/combustible|gasolina|consumo|trimestre|prediccion/.test(text)) {
    result.answer = 'No hay registros suficientes para calcular esa tendencia con fiabilidad.';
    result.insights = ['El historial disponible incluye cuotas, asistencia y servicios; no incluye consumos de combustible ni series completas de desgaste.'];
    result.suggested_actions = ['Registrar consumos y kilometraje durante varias jornadas antes de comparar rendimientos.'];
  } else if (/cuota|cobr|pago|saldo|recauda|moros|finanz/.test(text)) {
    result.matched_topic = 'cuotas';
    const qs = daily.quotas.filter(v => matches(v.vehicle_id)),
      received = qs.reduce((n, x) => n + x.received, 0),
      expected = qs.reduce((n, x) => n + x.expected, 0);
    result.answer = `Se han recibido ${money(received)} de ${money(expected)} esperados hoy. El saldo pendiente es ${money(expected - received)}.`;
    result.insights = qs.map(v => `${v.vehicle_id} · ${v.driver_name}: ${money(v.received)} recibido / ${money(v.expected)} esperado.`);
    result.suggested_actions = qs.filter(v => v.received < v.expected).map(v => `Gestionar el saldo de ${v.vehicle_id}: ${money(v.expected - v.received)}.`);
    result.sources = ['Cuotas del día', 'Asignaciones de flota'];
  } else if (/asisten|piloto|ausen|conductor|personal/.test(text)) {
    result.matched_topic = 'asistencia';
    const ranking = drivers.map(v => ({
      ...v,
      absences: d.attendance.filter(a => a.driver_id === v.id && a.work_date.startsWith(today().slice(0, 7)) && a.status === 'Ausente').length
    })).sort((a, b) => b.absences - a.absences);
    result.answer = `${ranking[0].name} registra el mayor número de ausencias del mes: ${ranking[0].absences}. Hoy hay ${daily.attendance_absent} ausencia(s) registrada(s).`;
    result.insights = ranking.map(v => `${v.name}: ${v.absences} ausencia(s) en el mes.`);
    result.suggested_actions = ['Revisar novedades y confirmar la cobertura antes de asignar salidas.'];
    result.sources = ['Registros de asistencia', 'Directorio de pilotos'];
  } else if (/ruta|microbus|oratorio|cuilapa|gps|parada|demora/.test(text)) {
    result.matched_topic = 'ruta';
    const completed = d.route.stops.filter(s => s.state === 'Completado').length;
    result.answer = `${d.route.vehicleId} · ${d.route.name}: ${completed} de ${d.route.stops.length} puntos completados. ${d.route.finished ? 'Recorrido finalizado.' : d.route.running ? 'Jornada iniciada.' : 'Jornada pendiente de inicio.'}`;
    result.insights = d.route.stops.map(s => `${s.name} · ${s.time} · ${s.state}`);
    result.suggested_actions = ['Consultar puntos de control y registrar la llegada al siguiente destino.'];
    result.sources = ['Jornada del piloto', 'Puntos de control'];
  } else if (/manten|aceite|freno|servicio|taller|riesgo|priori|unidad|flota/.test(text)) {
    result.matched_topic = 'mantenimiento';
    const open = d.maintenance.filter(m => !m.completed && matches(m.vehicle_id)).sort((a, b) => ({
      Alta: 0,
      Media: 1,
      Baja: 2
    })[a.risk] - {
      Alta: 0,
      Media: 1,
      Baja: 2
    }[b.risk]);
    result.answer = open.length ? `Hay ${open.length} servicio(s) pendiente(s). Prioriza ${open[0].vehicle_id}: ${open[0].task.toLowerCase()}, con prioridad ${open[0].risk.toLowerCase()}.` : 'No hay servicios pendientes para la selección consultada.';
    result.insights = open.map(m => `${m.vehicle_id} · ${m.task} · ${m.due_label} · ${money(m.cost_estimate)} estimados.`);
    result.suggested_actions = open.slice(0, 2).map(m => `Programar ${m.task.toLowerCase()} para ${m.vehicle_id}.`);
    result.sources = ['Órdenes de mantenimiento', 'Estado de las unidades'];
  } else {
    result.answer = 'Puedo consultar cuotas, asistencia, mantenimientos y puntos de control. Indica el proceso o la unidad que deseas revisar.';
    result.suggested_actions = ['¿Qué unidades necesitan mantenimiento?', '¿Cuánto falta por cobrar hoy?', '¿Qué piloto tiene más ausencias?'];
  }
  return wait(result);
}
export function getSettings() {
  return read(SETTINGS_KEY, {
    company: 'Mototaxi David',
    location: 'Cuilapa, Santa Rosa',
    start: '06:00',
    end: '18:00',
    maintenanceAlerts: true,
    quotaAlerts: true
  });
}
export function saveSettings(settings) {
  if (!settings.company.trim() || !settings.location.trim() || settings.start >= settings.end) throw new Error('Completa los datos y define una hora de cierre posterior al inicio.');
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  save(state(), 'Preferencias de operación actualizadas');
}
export async function updateJourney(action) {
  const d = state(),
    r = d.route;
  if (action === 'start') {
    if (r.finished) throw new Error('El recorrido ya finalizó.');
    r.running = true;
  } else if (action === 'pause') r.running = false;else if (action === 'checkin') {
    if (!r.running || r.finished) throw new Error('Inicia la jornada para registrar una llegada.');
    const next = r.stops.find(s => s.state !== 'Completado');
    if (next) {
      next.state = 'Completado';
      next.time = new Date().toLocaleTimeString('es-GT', {
        timeZone: 'America/Guatemala',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    const following = r.stops.find(s => s.state !== 'Completado');
    if (following) following.state = 'En curso';else {
      r.finished = true;
      r.running = false;
    }
  }
  r.lastUpdate = time();
  save(d, action === 'checkin' ? 'Llegada registrada en punto de control' : action === 'start' ? 'Jornada iniciada' : 'Jornada pausada');
  return wait(r);
}
export async function getTrackingSessions() {
  return wait(state().tracking.map(s => ({
    ...s,
    is_active: new Date(s.expires_at).getTime() > Date.now()
  })));
}
export async function createTrackingSession(payload) {
  const d = state(),
    v = vehicleFor(d, payload.vehicle_id);
  finite(payload.expires_hours, 1, 24);
  if (payload.driver_id !== v.driver_id) throw new Error('Selecciona el piloto asignado a esta unidad.');
  const token = crypto.randomUUID(),
    item = {
      ...payload,
      id: token,
      token,
      driver_name: v.driver,
      expires_at: new Date(Date.now() + payload.expires_hours * 3600000).toISOString(),
      is_active: true,
      consent_at: null,
      public_url: `/jornada/${token}`
    };
  d.tracking.unshift(item);
  save(d, `Jornada creada para ${v.id}`);
  return wait(item);
}
export async function getPublicTrackingSession(token) {
  const s = state().tracking.find(s => s.token === token);
  if (!s) throw new Error('Enlace de jornada no encontrado en este navegador.');
  const active = new Date(s.expires_at).getTime() > Date.now();
  return wait({
    ...s,
    is_active: active,
    can_send_gps: active && Boolean(s.consent_at)
  });
}
export async function acceptTrackingConsent(token, payload) {
  const session = await getPublicTrackingSession(token);
  if (!session.is_active || !payload.accepted || !payload.consent_name.trim()) throw new Error('Revisa la vigencia y completa tu nombre.');
  const d = state(),
    s = d.tracking.find(s => s.token === token);
  s.consent_at = time();
  s.consent_name = payload.consent_name;
  save(d, `Consentimiento de jornada: ${s.vehicle_id}`);
  return getPublicTrackingSession(token);
}
export async function sendTrackingPoint(token, payload) {
  const s = await getPublicTrackingSession(token);
  if (!s.can_send_gps) throw new Error('La jornada ha vencido o falta consentimiento.');
  const d = state(),
    item = {
      ...payload,
      id: crypto.randomUUID(),
      recorded_at: time()
    },
    session = d.tracking.find(s => s.token === token);
  session.latest_point = item;
  save(d, `Ubicación registrada: ${s.vehicle_id}`);
  return wait(item);
}
