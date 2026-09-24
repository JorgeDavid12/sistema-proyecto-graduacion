export const fleet = [
  {
    id: "MT-006",
    line: "Linea 6",
    type: "Mototaxi",
    driver: "Carlos Mendez",
    status: "Operativa",
    km: 68420,
    dailyQuota: 125,
    paidToday: true,
    health: 91,
    nextService: "Cambio de aceite en 6 dias",
  },
  {
    id: "MT-079",
    line: "Linea 79",
    type: "Mototaxi",
    driver: "Luis Garcia",
    status: "Alerta",
    km: 72110,
    dailyQuota: 125,
    paidToday: false,
    health: 62,
    nextService: "Frenos requieren revision",
  },
  {
    id: "MT-094",
    line: "Linea 94",
    type: "Mototaxi",
    driver: "Mario Lopez",
    status: "Operativa",
    km: 59180,
    dailyQuota: 125,
    paidToday: true,
    health: 86,
    nextService: "Servicio general en 12 dias",
  },
  {
    id: "MT-112",
    line: "Linea 112",
    type: "Mototaxi",
    driver: "Edwin Perez",
    status: "Mantenimiento",
    km: 80450,
    dailyQuota: 125,
    paidToday: false,
    health: 48,
    nextService: "Tren delantero en taller",
  },
  {
    id: "MT-117",
    line: "Linea 117",
    type: "Mototaxi",
    driver: "Victor Santos",
    status: "Operativa",
    km: 53670,
    dailyQuota: 125,
    paidToday: true,
    health: 94,
    nextService: "Sin alertas criticas",
  },
  {
    id: "MB-001",
    line: "Cuilapa-Oratorio",
    type: "Microbus",
    driver: "Ruben Castillo",
    status: "En ruta",
    km: 143890,
    dailyQuota: 0,
    paidToday: true,
    health: 78,
    nextService: "Llantas y aceite en 9 dias",
  },
];

export const kpis = [
  { label: "Recaudacion hoy", value: "Q 4,875", trend: "+12%", tone: "green" },
  { label: "Unidades activas", value: "5 / 6", trend: "83%", tone: "cyan" },
  { label: "Alertas criticas", value: "3", trend: "Atender", tone: "amber" },
  { label: "Cumplimiento laboral", value: "91%", trend: "+6%", tone: "green" },
];

export const alerts = [
  {
    title: "Linea 79 sin cuota registrada",
    detail: "El piloto asignado no ha completado la cuota diaria.",
    level: "Finanzas",
  },
  {
    title: "Linea 112 fuera de servicio",
    detail: "Unidad en mantenimiento por tren delantero.",
    level: "Mantenimiento",
  },
  {
    title: "Microbus con demora de 8 min",
    detail: "La ruta demo registra atraso en punto Barberena.",
    level: "Logistica",
  },
];

export const maintenance = [
  { vehicle: "MT-079", task: "Revision de frenos", due: "Hoy", risk: "Alta" },
  { vehicle: "MT-006", task: "Cambio de aceite", due: "6 dias", risk: "Media" },
  { vehicle: "MB-001", task: "Rotacion de llantas", due: "9 dias", risk: "Media" },
  { vehicle: "MT-094", task: "Servicio general", due: "12 dias", risk: "Baja" },
];

export const modules = [
  {
    title: "Mantenimiento Predictivo",
    text: "Historial, kilometraje, servicios y alertas para evitar fallas costosas.",
  },
  {
    title: "Control Financiero",
    text: "Cuotas diarias, saldos pendientes, gastos y utilidad estimada por unidad.",
  },
  {
    title: "Asistencia Operativa",
    text: "Jornadas trabajadas, descansos, ausencias y cumplimiento por piloto.",
  },
  {
    title: "Auditoria GPS",
    text: "Ruta Cuilapa-Oratorio, puntos de control, retrasos y evidencia visual.",
  },
];

export const routeStops = [
  { name: "Cuilapa", time: "06:00", state: "Completado" },
  { name: "Barberena", time: "06:32", state: "Completado" },
  { name: "El Cerinal", time: "07:04", state: "En curso" },
  { name: "Oratorio", time: "07:42", state: "Pendiente" },
];

export const defenseSlides = [
  {
    eyebrow: "Problema central",
    title: "La flota crecio mas rapido que sus controles.",
    text: "Mototaxi David administra seis unidades con procesos manuales, memoria humana y registros en papel. El resultado es fuga de capital, mantenimiento reactivo y poca visibilidad logistica.",
  },
  {
    eyebrow: "Hipotesis",
    title: "Un sistema integral convierte operacion diaria en datos auditables.",
    text: "Al centralizar mantenimiento, asistencia, cuotas y ruta, la gerencia puede anticipar fallas, reducir morosidad y fiscalizar la ruta extraurbana con evidencia objetiva.",
  },
  {
    eyebrow: "Objetivo general",
    title: "Disenar una plataforma web responsiva para gestion de flotas.",
    text: "La primera fase muestra la experiencia visual y los flujos principales. Las fases futuras incorporaran backend, PostgreSQL, IA y GPS real.",
  },
  {
    eyebrow: "Impacto esperado",
    title: "Menos improvisacion, mas decisiones basadas en datos.",
    text: "La solucion busca proteger activos, ordenar el trabajo de pilotos y elevar la sostenibilidad financiera de una microempresa familiar de transporte.",
  },
];
