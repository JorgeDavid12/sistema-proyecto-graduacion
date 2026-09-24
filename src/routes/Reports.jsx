import {
  AlertCircle,
  Banknote,
  CalendarDays,
  Download,
  FileSpreadsheet,
  RefreshCw,
  TrendingDown,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { downloadReport, getReportsData } from "../services/api";

export default function Reports() {
  const [filters, setFilters] = useState({ dailyDate: "", month: currentMonth() });
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const dailyCards = useMemo(() => {
    if (!reports?.daily) return [];
    return [
      { label: "Recibido", value: money(reports.daily.received_amount), icon: Banknote },
      { label: "Pendiente", value: money(reports.daily.pending_amount), icon: TrendingDown },
      { label: "Cobranza", value: `${reports.daily.collection_rate}%`, icon: FileSpreadsheet },
      { label: "Ausencias", value: reports.daily.attendance_absent, icon: AlertCircle },
    ];
  }, [reports]);

  function loadReports(nextFilters = filters) {
    setLoading(true);
    setMessage(null);
    const controller = new AbortController();

    getReportsData(nextFilters, controller.signal)
      .then(setReports)
      .catch((error) => {
        setReports(null);
        setMessage(`No se pudieron cargar reportes: ${error.message}`);
      })
      .finally(() => setLoading(false));
  }

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  async function exportCsv(report) {
    setDownloading(report);
    setMessage(null);
    const controller = new AbortController();
    try {
      await downloadReport(report, filters, controller.signal);
      setMessage("Exportacion CSV generada localmente.");
    } catch (error) {
      setMessage(`No se pudo exportar: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-emeraldTech">Fase 7</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Reportes y exportaciones
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-warmWhite/70">
              Cierres diarios y mensuales, mantenimiento y morosidad desde la API local.
              Las exportaciones se generan en CSV sin servicios externos.
            </p>

            <div className="mt-7 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <label className="block">
                <span className="text-sm font-semibold text-warmWhite/66">Cierre diario</span>
                <input
                  type="date"
                  value={filters.dailyDate}
                  onChange={(event) => updateFilter("dailyDate", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-warmWhite/66">Cierre mensual</span>
                <input
                  type="month"
                  value={filters.month}
                  onChange={(event) => updateFilter("month", event.target.value)}
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                />
              </label>
              <button
                type="button"
                onClick={() => loadReports()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-emeraldTech/35 bg-emeraldTech/12 px-4 py-3 text-sm font-bold text-emeraldTech shadow-glow transition hover:bg-emeraldTech/18 lg:self-end"
              >
                <RefreshCw size={17} />
                Actualizar
              </button>
            </div>

            {message && (
              <div className="mt-5 rounded-lg border border-alertAmber/30 bg-alertAmber/10 p-4 text-sm font-semibold text-alertAmber">
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:px-8">
          {loading && <p className="text-sm text-warmWhite/58">Cargando reportes locales...</p>}

          {!loading && reports && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {dailyCards.map(({ label, value, icon: Icon }) => (
                  <GlassCard key={label} className="p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                        <Icon size={21} />
                      </span>
                      <span className="text-xs font-semibold uppercase text-warmWhite/42">
                        Diario
                      </span>
                    </div>
                    <p className="mt-5 text-sm text-warmWhite/58">{label}</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
                  </GlassCard>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <ReportPanel
                  icon={CalendarDays}
                  title={`Cierre diario ${formatDate(reports.daily.report_date)}`}
                  action={() => exportCsv("daily")}
                  busy={downloading === "daily"}
                >
                  <ReportRow label="Esperado" value={money(reports.daily.expected_amount)} />
                  <ReportRow label="Recibido" value={money(reports.daily.received_amount)} />
                  <ReportRow label="Pendiente" value={money(reports.daily.pending_amount)} />
                  <ReportRow label="Cuotas pendientes" value={reports.daily.payments_pending} />
                  <ReportRow label="Mantenimientos abiertos" value={reports.daily.maintenance_open} />
                  <ReportRow label="Alertas abiertas" value={reports.daily.alerts_open} />
                </ReportPanel>

                <ReportPanel
                  icon={FileSpreadsheet}
                  title={`Cierre mensual ${reports.monthly.year}-${String(reports.monthly.month).padStart(2, "0")}`}
                  action={() => exportCsv("monthly")}
                  busy={downloading === "monthly"}
                >
                  <ReportRow label="Esperado" value={money(reports.monthly.expected_amount)} />
                  <ReportRow label="Recibido" value={money(reports.monthly.received_amount)} />
                  <ReportRow label="Pendiente" value={money(reports.monthly.pending_amount)} />
                  <ReportRow label="Cobranza" value={`${reports.monthly.collection_rate}%`} />
                  <ReportRow label="Dias con registro" value={reports.monthly.active_days} />
                  <ReportRow label="Cuotas pendientes" value={reports.monthly.payments_pending} />
                </ReportPanel>
              </div>

              <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                <ReportPanel
                  icon={Wrench}
                  title="Mantenimiento"
                  action={() => exportCsv("maintenance")}
                  busy={downloading === "maintenance"}
                >
                  <ReportRow label="Eventos abiertos" value={reports.maintenanceReport.open_events} />
                  <ReportRow label="Eventos completados" value={reports.maintenanceReport.completed_events} />
                  <ReportRow label="Riesgo alto abierto" value={reports.maintenanceReport.high_risk_open} />
                  <ReportRow label="Costo abierto estimado" value={money(reports.maintenanceReport.estimated_open_cost)} />
                </ReportPanel>

                <GlassCard className="overflow-hidden">
                  <div className="flex flex-col gap-4 border-b border-warmWhite/10 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-warmWhite/58">Morosidad</p>
                      <h2 className="mt-1 text-2xl font-semibold text-white">
                        {money(reports.delinquency.pending_total)} pendiente
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportCsv("delinquency")}
                      disabled={downloading === "delinquency"}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emeraldTech px-3 py-2 text-sm font-bold text-graphite disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <Download size={16} />
                      CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-left">
                      <thead className="border-b border-warmWhite/10 text-sm text-warmWhite/50">
                        <tr>
                          <th className="px-5 py-4 font-medium">Unidad</th>
                          <th className="px-5 py-4 font-medium">Piloto</th>
                          <th className="px-5 py-4 font-medium">Pendiente</th>
                          <th className="px-5 py-4 font-medium">Dias mora</th>
                          <th className="px-5 py-4 font-medium">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.delinquency.items.length === 0 && (
                          <tr>
                            <td className="px-5 py-5 text-sm text-warmWhite/58" colSpan="5">
                              No hay morosidad para la fecha seleccionada.
                            </td>
                          </tr>
                        )}
                        {reports.delinquency.items.map((item) => (
                          <tr key={`${item.vehicle_id}-${item.driver_name}`} className="border-b border-warmWhite/7 last:border-0">
                            <td className="px-5 py-4 font-semibold text-white">{item.vehicle_id}</td>
                            <td className="px-5 py-4 text-warmWhite/70">{item.driver_name}</td>
                            <td className="px-5 py-4 text-alertAmber">{money(item.pending_amount)}</td>
                            <td className="px-5 py-4 text-warmWhite/70">{item.days_overdue}</td>
                            <td className="px-5 py-4 text-warmWhite/70">{item.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ReportPanel({ icon: Icon, title, children, action, busy }) {
  return (
    <GlassCard className="p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
            <Icon size={22} />
          </span>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        </div>
        <button
          type="button"
          onClick={action}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] px-3 py-2 text-sm text-warmWhite/72 transition hover:border-emeraldTech/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Download size={16} />
          CSV
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </GlassCard>
  );
}

function ReportRow({ label, value }) {
  return (
    <div className="rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
      <p className="text-xs font-semibold uppercase text-warmWhite/42">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function money(value) {
  return `Q ${Number(value || 0).toLocaleString("es-GT", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
}

function formatDate(value) {
  if (!value) return "fecha activa";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-GT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
