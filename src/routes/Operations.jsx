import {
  BadgeCheck,
  CalendarCheck,
  CreditCard,
  RefreshCw,
  Save,
  ServerOff,
  Truck,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "../components/AppShell";
import GlassCard from "../components/GlassCard";
import {
  completeMaintenance,
  createAttendance,
  createMaintenance,
  createQuotaPayment,
  getOperationOptions,
  updateVehicle,
} from "../services/api";

const statusOptions = ["Operativa", "Alerta", "Mantenimiento", "En ruta"];

export default function Operations() {
  const [options, setOptions] = useState({ vehicles: [], drivers: [], maintenance: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({
    type: "info",
    text: "Registra los movimientos de la jornada y mantén al día la operación.",
  });

  const initialized = useRef(false);
  const firstVehicle = options.vehicles[0]?.id || "MT-006";
  const firstDriver = options.drivers[0]?.id || 1;

  const [quotaForm, setQuotaForm] = useState({
    vehicle_id: "MT-006",
    driver_id: 1,
    expected_amount: 125,
    received_amount: 125,
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    vehicle_id: "MT-079",
    task: "Revision preventiva",
    due_label: "Hoy",
    risk: "Media",
    cost_estimate: 250,
  });
  const [attendanceForm, setAttendanceForm] = useState({
    driver_id: 1,
    status: "Presente",
    notes: "",
  });
  const [vehicleForm, setVehicleForm] = useState({
    vehicle_id: "MT-006",
    km: 68500,
    health: 90,
    status: "Operativa",
    next_service: "Cambio de aceite en 5 dias",
  });

  useEffect(() => {
    loadOptions();
  }, []);

  function loadOptions() {
    setLoading(true);
    const controller = new AbortController();
    getOperationOptions(controller.signal)
      .then((data) => {
        setOptions(data);
        if (!initialized.current && data.vehicles.length) {
          const v = data.vehicles[0];
          setVehicleForm({vehicle_id:v.id,km:v.km,health:v.health,status:v.status,next_service:v.next_service});
          initialized.current = true;
        }
        // Conservar confirmación del último movimiento.
      })
      .catch((error) => {
        setOptions({ vehicles: [], drivers: [], maintenance: [] });
        setMessage({
          type: "warning",
          text: `No se pudo cargar la operación: ${error.message}.`,
        });
      })
      .finally(() => setLoading(false));
  }

  const vehicleDriverMap = useMemo(() => {
    return new Map(options.vehicles.map((vehicle) => [vehicle.id, vehicle.driver_id]));
  }, [options.vehicles]);

  async function submitQuota(event) {
    event.preventDefault();
    const controller = new AbortController();
    try {
      await createQuotaPayment(
        {
          ...quotaForm,
          driver_id: Number(quotaForm.driver_id),
          expected_amount: Number(quotaForm.expected_amount),
          received_amount: Number(quotaForm.received_amount),
        },
        controller.signal,
      );
      setMessage({ type: "success", text: "Cuota registrada. El cierre y el resumen han sido actualizados." });
    } catch (error) {
      setMessage({ type: "warning", text: `No se pudo registrar cuota: ${error.message}` });
    }
  }

  async function submitMaintenance(event) {
    event.preventDefault();
    const controller = new AbortController();
    try {
      await createMaintenance(
        {
          ...maintenanceForm,
          cost_estimate: Number(maintenanceForm.cost_estimate),
        },
        controller.signal,
      );
      setMessage({ type: "success", text: "Servicio programado correctamente." });
      loadOptions();
    } catch (error) {
      setMessage({ type: "warning", text: `No se pudo registrar mantenimiento: ${error.message}` });
    }
  }

  async function submitAttendance(event) {
    event.preventDefault();
    const controller = new AbortController();
    try {
      await createAttendance(
        {
          ...attendanceForm,
          driver_id: Number(attendanceForm.driver_id),
          notes: attendanceForm.notes || null,
        },
        controller.signal,
      );
      setMessage({ type: "success", text: "Asistencia actualizada para la jornada de hoy." });
    } catch (error) {
      setMessage({ type: "warning", text: `No se pudo registrar asistencia: ${error.message}` });
    }
  }

  async function submitVehicle(event) {
    event.preventDefault();
    const controller = new AbortController();
    try {
      await updateVehicle(
        vehicleForm.vehicle_id,
        {
          km: Number(vehicleForm.km),
          health: Number(vehicleForm.health),
          status: vehicleForm.status,
          next_service: vehicleForm.next_service,
        },
        controller.signal,
      );
      setMessage({ type: "success", text: "Información de la unidad actualizada." });
      loadOptions();
    } catch (error) {
      setMessage({ type: "warning", text: `No se pudo actualizar unidad: ${error.message}` });
    }
  }

  async function markMaintenanceComplete(eventId) {
    const controller = new AbortController();
    try {
      await completeMaintenance(eventId, controller.signal);
      setMessage({ type: "success", text: "Mantenimiento marcado como completado." });
      loadOptions();
    } catch (error) {
      setMessage({ type: "warning", text: `No se pudo completar mantenimiento: ${error.message}` });
    }
  }

  function selectVehicleForQuota(vehicleId) {
    setQuotaForm((form) => ({
      ...form,
      vehicle_id: vehicleId,
      driver_id: vehicleDriverMap.get(vehicleId) || firstDriver,
      expected_amount: options.vehicles.find(v => v.id === vehicleId)?.daily_quota || 0,
    }));
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-graphite pb-24">
        <section className="border-b border-warmWhite/10 bg-tech-radial">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase text-emeraldTech">Sistema</p>
            <h1 className="mt-3 text-4xl font-semibold text-white sm:text-5xl">
              Operación diaria
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-warmWhite/70">
              Registra cuotas, asistencia y servicios. Cada movimiento actualiza la información de la flota y queda en el historial de actividad.
            </p>
            <div
              className={`mt-6 flex items-start gap-3 rounded-lg border p-4 ${
                message.type === "success"
                  ? "border-emeraldTech/30 bg-emeraldTech/10 text-emeraldTech"
                  : message.type === "warning"
                    ? "border-alertAmber/30 bg-alertAmber/10 text-alertAmber"
                    : "border-cyberCyan/30 bg-cyberCyan/10 text-cyberCyan"
              }`}
            >
              {message.type === "warning" ? <ServerOff size={20} /> : <BadgeCheck size={20} />}
              <p role="status" className="text-sm font-semibold">{message.text}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-2 lg:px-8">
          <OperationCard icon={CreditCard} title="Registrar cuota" onSubmit={submitQuota}>
            <Select
              label="Unidad"
              value={quotaForm.vehicle_id || firstVehicle}
              onChange={(value) => selectVehicleForQuota(value)}
              options={options.vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.id} · ${vehicle.line}`,
              }))}
            />
            <Select
              label="Piloto"
              value={quotaForm.driver_id}
              onChange={(value) => setQuotaForm((form) => ({ ...form, driver_id: value }))}
              options={options.drivers.map((driver) => ({
                value: driver.id,
                label: driver.name,
              }))}
            />
            <NumberInput
              label="Esperado Q"
              value={quotaForm.expected_amount}
              onChange={(value) => setQuotaForm((form) => ({ ...form, expected_amount: value }))}
            />
            <NumberInput
              label="Recibido Q"
              value={quotaForm.received_amount}
              onChange={(value) => setQuotaForm((form) => ({ ...form, received_amount: value }))}
            />
          </OperationCard>

          <OperationCard icon={CalendarCheck} title="Registrar asistencia" onSubmit={submitAttendance}>
            <Select
              label="Piloto"
              value={attendanceForm.driver_id}
              onChange={(value) => setAttendanceForm((form) => ({ ...form, driver_id: value }))}
              options={options.drivers.map((driver) => ({
                value: driver.id,
                label: driver.name,
              }))}
            />
            <Select
              label="Estado"
              value={attendanceForm.status}
              onChange={(value) => setAttendanceForm((form) => ({ ...form, status: value }))}
              options={["Presente", "Ausente", "Descanso", "En ruta"].map((status) => ({
                value: status,
                label: status,
              }))}
            />
            <TextInput
              label="Notas"
              value={attendanceForm.notes}
              onChange={(value) => setAttendanceForm((form) => ({ ...form, notes: value }))}
            />
          </OperationCard>

          <OperationCard icon={Wrench} title="Registrar mantenimiento" onSubmit={submitMaintenance}>
            <Select
              label="Unidad"
              value={maintenanceForm.vehicle_id}
              onChange={(value) => setMaintenanceForm((form) => ({ ...form, vehicle_id: value }))}
              options={options.vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.id} · ${vehicle.line}`,
              }))}
            />
            <TextInput
              label="Trabajo"
              value={maintenanceForm.task}
              onChange={(value) => setMaintenanceForm((form) => ({ ...form, task: value }))}
            />
            <TextInput
              label="Vence"
              value={maintenanceForm.due_label}
              onChange={(value) => setMaintenanceForm((form) => ({ ...form, due_label: value }))}
            />
            <Select
              label="Riesgo"
              value={maintenanceForm.risk}
              onChange={(value) => setMaintenanceForm((form) => ({ ...form, risk: value }))}
              options={["Baja", "Media", "Alta"].map((risk) => ({ value: risk, label: risk }))}
            />
            <NumberInput
              label="Costo estimado (Q)"
              value={maintenanceForm.cost_estimate}
              onChange={(value) => setMaintenanceForm((form) => ({ ...form, cost_estimate: value }))}
            />
          </OperationCard>

          <OperationCard icon={Truck} title="Actualizar unidad" onSubmit={submitVehicle}>
            <Select
              label="Unidad"
              value={vehicleForm.vehicle_id}
              onChange={(value) => { const v = options.vehicles.find(v => v.id === value); if (v) setVehicleForm({ vehicle_id: value, km: v.km, health: v.health, status: v.status, next_service: v.next_service }); }}
              options={options.vehicles.map((vehicle) => ({
                value: vehicle.id,
                label: `${vehicle.id} · ${vehicle.line}`,
              }))}
            />
            <NumberInput
              label="Kilometraje (km)"
              value={vehicleForm.km}
              onChange={(value) => setVehicleForm((form) => ({ ...form, km: value }))}
            />
            <NumberInput
              label="Condición (%)"
              value={vehicleForm.health}
              onChange={(value) => setVehicleForm((form) => ({ ...form, health: value }))}
            />
            <Select
              label="Estado"
              value={vehicleForm.status}
              onChange={(value) => setVehicleForm((form) => ({ ...form, status: value }))}
              options={statusOptions.map((status) => ({ value: status, label: status }))}
            />
            <TextInput
              label="Próximo servicio"
              value={vehicleForm.next_service}
              onChange={(value) => setVehicleForm((form) => ({ ...form, next_service: value }))}
            />
          </OperationCard>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-warmWhite/58">Pendientes</p>
                <h2 className="text-2xl font-semibold text-white">Mantenimientos abiertos</h2>
              </div>
              <button
                type="button"
                onClick={loadOptions}
                className="inline-flex items-center gap-2 rounded-lg border border-warmWhite/12 bg-warmWhite/[0.055] px-3 py-2 text-sm text-warmWhite/72 transition hover:border-emeraldTech/35 hover:text-white"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {loading && <p className="text-sm text-warmWhite/58">Cargando registros…</p>}
              {!loading && options.maintenance.length === 0 && (
                <p className="text-sm text-warmWhite/58">
                  No hay servicios pendientes.
                </p>
              )}
              {options.maintenance
                .filter((item) => !item.completed)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {item.vehicle_id} · {item.task}
                      </p>
                      <p className="mt-1 text-sm text-warmWhite/54">
                        {item.due_label} · Riesgo {item.risk}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => markMaintenanceComplete(item.id)}
                      className="shrink-0 rounded-lg bg-emeraldTech px-3 py-2 text-sm font-bold text-graphite"
                    >
                      Completar
                    </button>
                  </div>
                ))}
            </div>
          </GlassCard>
        </section>
      </div>
    </AppShell>
  );
}

function OperationCard({ icon: Icon, title, onSubmit, children }) {
  return (
    <GlassCard className="p-5">
      <form onSubmit={onSubmit}>
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-lg bg-emeraldTech/12 text-emeraldTech">
            <Icon size={22} />
          </span>
          <h2 className="text-2xl font-semibold text-white">{title}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow transition hover:-translate-y-1"
        >
          <Save size={18} />
          Guardar
        </button>
      </form>
    </GlassCard>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-warmWhite/66">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
      >
        {options.length === 0 && <option value="">Sin datos</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-warmWhite/66">{label}</span>
      <input
        type="number"
        required
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
      />
    </label>
  );
}

function TextInput({ label, value, onChange }) {
  return (
    <label className="block sm:col-span-2">
      <span className="text-sm font-semibold text-warmWhite/66">{label}</span>
      <input
        type="text"
        required={label !== "Notas"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
      />
    </label>
  );
}
