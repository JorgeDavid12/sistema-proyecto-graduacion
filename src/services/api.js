import {
  alerts as localAlerts,
  fleet as localFleet,
  kpis as localKpis,
  maintenance as localMaintenance,
  routeStops,
} from "../data/demoData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
export const AUTH_STORAGE_KEY = "mototaxi_david_session";

async function request(path, signal, options = {}) {
  const { skipAuth = false, headers = {}, ...fetchOptions } = options;
  const token = skipAuth ? null : getStoredAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let detail = `API ${path} respondio ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // La respuesta de error no siempre tiene JSON.
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function requestBlob(path, signal, options = {}) {
  const { skipAuth = false, headers = {}, ...fetchOptions } = options;
  const token = skipAuth ? null : getStoredAuthToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    signal,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    let detail = `API ${path} respondio ${response.status}`;
    try {
      const body = await response.json();
      detail = body.detail || detail;
    } catch {
      // Algunas exportaciones devuelven texto plano si fallan.
    }
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  return response.blob();
}

function getStoredAuthToken() {
  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!rawSession) return null;
    return JSON.parse(rawSession)?.access_token || null;
  } catch {
    return null;
  }
}

export async function loginWithCredentials(credentials, signal) {
  return request("/auth/login", signal, {
    method: "POST",
    body: JSON.stringify(credentials),
    skipAuth: true,
  });
}

export async function getCurrentUser(signal) {
  return request("/auth/me", signal);
}

export async function logoutSession(signal) {
  return request("/auth/logout", signal, {
    method: "POST",
  });
}

function mapVehicles(vehicles, drivers) {
  const driversById = new Map(drivers.map((driver) => [driver.id, driver]));

  return vehicles.map((vehicle) => {
    const driver = driversById.get(vehicle.driver_id);

    return {
      id: vehicle.id,
      line: vehicle.line,
      type: vehicle.type,
      driver: driver?.name || "Sin piloto",
      status: vehicle.status,
      km: vehicle.km,
      dailyQuota: vehicle.daily_quota,
      paidToday: vehicle.status !== "Alerta" && vehicle.status !== "Mantenimiento",
      health: vehicle.health,
      nextService: vehicle.next_service,
    };
  });
}

function mapMaintenance(items) {
  return items.map((item) => ({
    vehicle: item.vehicle_id,
    task: item.task,
    due: item.due_label,
    risk: item.risk,
  }));
}

function mapRoute(route) {
  return {
    name: route.name || "Cuilapa - Oratorio",
    vehicleId: route.vehicle_id || "MB-001",
    gpsMode: route.gps_mode || "simulated",
    latestPoint: route.latest_point || null,
    stops: (route.stops || []).map((stop) => ({
      name: stop.name,
      time: stop.scheduled_time,
      state: stop.state,
    })),
  };
}

export async function getDashboardData(signal) {
  const [kpis, vehicles, drivers, maintenance, alerts, route, quotaSummary] =
    await Promise.all([
      request("/dashboard/kpis", signal),
      request("/vehicles", signal),
      request("/drivers", signal),
      request("/maintenance", signal),
      request("/alerts", signal),
      request("/routes/demo", signal),
      request("/quotas/summary", signal),
    ]);

  return {
    source: "api",
    apiBaseUrl: API_BASE_URL,
    kpis,
    fleet: mapVehicles(vehicles, drivers),
    maintenance: mapMaintenance(maintenance),
    alerts,
    route: mapRoute(route),
    quotaSummary,
  };
}

export async function getRouteDemo(signal) {
  const route = await request("/routes/demo", signal);

  return {
    source: "api",
    apiBaseUrl: API_BASE_URL,
    route: mapRoute(route),
  };
}

export async function askLocalAssistant(question, signal) {
  return request("/assistant/local-query", signal, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}

export async function sendGpsPoint(point, signal) {
  return request("/gps/points", signal, {
    method: "POST",
    body: JSON.stringify(point),
  });
}

export async function getOperationOptions(signal) {
  const [vehicles, drivers, maintenance] = await Promise.all([
    request("/vehicles", signal),
    request("/drivers", signal),
    request("/maintenance", signal),
  ]);

  return { vehicles, drivers, maintenance };
}

export async function createQuotaPayment(payload, signal) {
  return request("/quotas/payments", signal, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createMaintenance(payload, signal) {
  return request("/maintenance", signal, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completeMaintenance(eventId, signal) {
  return request(`/maintenance/${eventId}/complete`, signal, {
    method: "PATCH",
  });
}

export async function createAttendance(payload, signal) {
  return request("/attendance", signal, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(vehicleId, payload, signal) {
  return request(`/vehicles/${vehicleId}`, signal, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function getReportsData(filters, signal) {
  const dailyQuery = filters?.dailyDate ? `?report_date=${filters.dailyDate}` : "";
  const monthlyQuery = filters?.month ? monthToQuery(filters.month) : "";

  const [daily, monthly, maintenanceReport, delinquency] = await Promise.all([
    request(`/reports/daily${dailyQuery}`, signal),
    request(`/reports/monthly${monthlyQuery}`, signal),
    request("/reports/maintenance", signal),
    request(`/reports/delinquency${dailyQuery}`, signal),
  ]);

  return { daily, monthly, maintenanceReport, delinquency };
}

export async function downloadReport(report, filters, signal) {
  const paths = {
    daily: `/reports/daily/export${filters?.dailyDate ? `?report_date=${filters.dailyDate}` : ""}`,
    monthly: `/reports/monthly/export${filters?.month ? monthToQuery(filters.month) : ""}`,
    maintenance: "/reports/maintenance/export",
    delinquency: `/reports/delinquency/export${filters?.dailyDate ? `?report_date=${filters.dailyDate}` : ""}`,
  };

  const filenames = {
    daily: `cierre-diario-${filters?.dailyDate || "actual"}.csv`,
    monthly: `cierre-mensual-${filters?.month || "actual"}.csv`,
    maintenance: "reporte-mantenimiento.csv",
    delinquency: `morosidad-${filters?.dailyDate || "actual"}.csv`,
  };

  const path = paths[report];
  if (!path) throw new Error("Reporte no reconocido.");

  const blob = await requestBlob(path, signal);
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filenames[report];
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export async function getDatabaseStatus(signal) {
  return request("/system/database", signal);
}

export async function getExternalAiStatus(signal) {
  return request("/ai/external/status", signal);
}

export async function getTrackingSessions(signal) {
  return request("/tracking/sessions", signal);
}

export async function createTrackingSession(payload, signal) {
  return request("/tracking/sessions", signal, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPublicTrackingSession(token, signal) {
  return request(`/public/tracking/${token}`, signal, { skipAuth: true });
}

export async function acceptTrackingConsent(token, payload, signal) {
  return request(`/public/tracking/${token}/consent`, signal, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function sendTrackingPoint(token, payload, signal) {
  return request(`/public/tracking/${token}/points`, signal, {
    method: "POST",
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

function monthToQuery(monthValue) {
  const [year, month] = monthValue.split("-");
  return `?year=${year}&month=${Number(month)}`;
}

export function getLocalDashboardData() {
  return {
    source: "local",
    apiBaseUrl: API_BASE_URL,
    kpis: localKpis,
    fleet: localFleet,
    maintenance: localMaintenance,
    alerts: localAlerts,
    route: {
      name: "Cuilapa - Oratorio",
      vehicleId: "MB-001",
      gpsMode: "simulated",
      latestPoint: null,
      stops: routeStops,
    },
    quotaSummary: {
      expected_today: 625,
      received_today: 375,
      pending_today: 250,
      collection_rate: 60,
    },
  };
}
