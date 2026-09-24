import { CalendarClock, Copy, Link as LinkIcon, MapPinned, Plus, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import { createTrackingSession, getOperationOptions, getTrackingSessions } from "../services/api";

export default function GpsAdmin() {
  const [options, setOptions] = useState({ vehicles: [], drivers: [] });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({
    vehicle_id: "MB-001",
    driver_id: "",
    expires_hours: 12,
  });

  useEffect(() => {
    loadData();
  }, []);

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const vehicleDriverMap = useMemo(
    () => new Map(options.vehicles.map((vehicle) => [vehicle.id, vehicle.driver_id])),
    [options.vehicles],
  );

  function loadData() {
    setLoading(true);
    setMessage(null);
    const controller = new AbortController();

    Promise.all([getOperationOptions(controller.signal), getTrackingSessions(controller.signal)])
      .then(([operationOptions, trackingSessions]) => {
        setOptions(operationOptions);
        setSessions(trackingSessions);
        const defaultVehicle = operationOptions.vehicles.find((item) => item.id === "MB-001") || operationOptions.vehicles[0];
        if (defaultVehicle) {
          setForm((current) => ({
            ...current,
            vehicle_id: defaultVehicle.id,
            driver_id: defaultVehicle.driver_id || "",
          }));
        }
      })
      .catch((error) => setMessage(`No se pudo cargar GPS: ${error.message}`))
      .finally(() => setLoading(false));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage(null);
    const controller = new AbortController();
    try {
      const payload = {
        vehicle_id: form.vehicle_id,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        expires_hours: Number(form.expires_hours),
      };
      await createTrackingSession(payload, controller.signal);
      setMessage("Jornada GPS creada con token temporal.");
      loadData();
    } catch (error) {
      setMessage(`No se pudo crear jornada: ${error.message}`);
    }
  }

  function selectVehicle(vehicleId) {
    setForm((current) => ({
      ...current,
      vehicle_id: vehicleId,
      driver_id: vehicleDriverMap.get(vehicleId) || "",
    }));
  }

  async function copyLink(publicUrl) {
    const fullUrl = `${origin}${publicUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    setMessage("Enlace copiado al portapapeles.");
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-emeraldTech">Fase 9</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              GPS por jornada
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-warmWhite/70">
              Crea enlaces temporales para pilotos. El GPS real solo se activa desde el
              enlace con consentimiento explicito y contexto seguro.
            </p>
            {message && (
              <div className="mt-5 rounded-lg border border-cyberCyan/30 bg-cyberCyan/10 p-4 text-sm font-semibold text-cyberCyan">
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <GlassCard className="p-5">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
                <MapPinned size={22} />
              </span>
              <h2 className="text-2xl font-semibold text-white">Crear jornada</h2>
            </div>
            <form onSubmit={submit} className="grid gap-4">
              <label>
                <span className="text-sm font-semibold text-warmWhite/66">Unidad</span>
                <select
                  value={form.vehicle_id}
                  onChange={(event) => selectVehicle(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                >
                  {options.vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.id} - {vehicle.line}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-warmWhite/66">Piloto</span>
                <select
                  value={form.driver_id}
                  onChange={(event) => setForm((current) => ({ ...current, driver_id: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                >
                  <option value="">Sin piloto</option>
                  {options.drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-semibold text-warmWhite/66">Horas activas</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={form.expires_hours}
                  onChange={(event) => setForm((current) => ({ ...current, expires_hours: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow"
              >
                <Plus size={18} />
                Crear enlace
              </button>
            </form>
          </GlassCard>

          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-warmWhite/10 p-5">
              <div>
                <p className="text-sm text-warmWhite/58">Tokens temporales</p>
                <h2 className="text-2xl font-semibold text-white">Jornadas activas</h2>
              </div>
              <button
                type="button"
                onClick={loadData}
                className="grid h-10 w-10 place-items-center rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] text-warmWhite/72"
                aria-label="Actualizar jornadas"
              >
                <RefreshCw size={17} />
              </button>
            </div>
            <div className="grid gap-3 p-5">
              {loading && <p className="text-sm text-warmWhite/58">Cargando jornadas...</p>}
              {!loading && sessions.length === 0 && (
                <p className="text-sm text-warmWhite/58">Todavia no hay jornadas GPS.</p>
              )}
              {sessions.map((item) => (
                <div key={item.token} className="rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-white">
                        {item.vehicle_id} - {item.driver_name || "Sin piloto"}
                      </p>
                      <p className="mt-1 text-sm text-warmWhite/54">
                        Vence: {new Date(item.expires_at).toLocaleString("es-GT")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold ${
                          item.consent_at
                            ? "bg-emeraldTech/12 text-emeraldTech"
                            : "bg-alertAmber/12 text-alertAmber"
                        }`}
                      >
                        <ShieldCheck size={15} />
                        {item.consent_at ? "Consentido" : "Sin consentimiento"}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyLink(item.public_url)}
                        className="inline-flex items-center gap-2 rounded-lg border border-emeraldTech/30 bg-emeraldTech/10 px-3 py-2 text-xs font-semibold text-emeraldTech"
                      >
                        <Copy size={15} />
                        Copiar
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-graphiteSoft px-3 py-2 text-xs text-warmWhite/58">
                    <LinkIcon size={14} />
                    <span className="truncate">{origin}{item.public_url}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </AppShell>
  );
}
