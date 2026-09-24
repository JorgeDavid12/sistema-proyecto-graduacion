import { AlertTriangle, CheckCircle2, LocateFixed, Navigation, Radio, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import {
  acceptTrackingConsent,
  getPublicTrackingSession,
  sendTrackingPoint,
} from "../services/api";

export default function TrackingSession() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [consentName, setConsentName] = useState("");
  const [message, setMessage] = useState("Cargando jornada...");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSession();
  }, [token]);

  const secureContext = useMemo(() => {
    return window.isSecureContext || window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost";
  }, []);

  function loadSession() {
    const controller = new AbortController();
    getPublicTrackingSession(token, controller.signal)
      .then((data) => {
        setSession(data);
        setConsentName(data.driver_name || "");
        setMessage(data.consent_at ? "Consentimiento registrado." : "Revisa y acepta antes de enviar ubicacion.");
      })
      .catch((error) => setMessage(`No se pudo cargar la jornada: ${error.message}`));
  }

  async function acceptConsent() {
    setBusy(true);
    const controller = new AbortController();
    try {
      const data = await acceptTrackingConsent(
        token,
        { accepted: true, consent_name: consentName || "Piloto" },
        controller.signal,
      );
      setSession(data);
      setMessage("Consentimiento guardado. Ya puedes enviar tu ubicacion de jornada.");
    } catch (error) {
      setMessage(`No se pudo guardar consentimiento: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  function sendRealLocation() {
    if (!navigator.geolocation) {
      setMessage("Este navegador no tiene geolocalizacion disponible.");
      return;
    }

    if (!secureContext) {
      setMessage("GPS real requiere HTTPS o localhost seguro.");
      return;
    }

    setBusy(true);
    setMessage("Solicitando ubicacion al navegador...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const controller = new AbortController();
        try {
          const point = await sendTrackingPoint(
            token,
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed_kmh: position.coords.speed ? position.coords.speed * 3.6 : 0,
              accuracy_m: position.coords.accuracy,
              simulated: false,
              secure_context: secureContext,
            },
            controller.signal,
          );
          setMessage(`Ubicacion enviada. Precision aproximada: ${Math.round(position.coords.accuracy)} m. Punto ${point.id}.`);
        } catch (error) {
          setMessage(`No se pudo enviar ubicacion: ${error.message}`);
        } finally {
          setBusy(false);
        }
      },
      (error) => {
        setMessage(`Permiso de ubicacion no concedido: ${error.message}`);
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }

  return (
    <div className="min-h-screen bg-tech-radial px-4 py-6 text-warmWhite">
      <div className="mx-auto max-w-md">
        <div className="mb-5 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-emeraldTech text-graphite shadow-glow">
            <Navigation size={24} />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase text-emeraldTech">Jornada GPS</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">Mototaxi David</h1>
        </div>

        <GlassCard className="p-5">
          {!session && <p className="text-sm leading-6 text-warmWhite/68">{message}</p>}

          {session && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-warmWhite/58">Unidad asignada</p>
                  <h2 className="mt-1 text-3xl font-semibold text-white">{session.vehicle_id}</h2>
                  <p className="mt-2 text-sm text-warmWhite/58">{session.driver_name}</p>
                </div>
                <span
                  className={`grid h-11 w-11 place-items-center rounded-lg ${
                    session.can_send_gps ? "bg-emeraldTech text-graphite" : "bg-alertAmber/12 text-alertAmber"
                  }`}
                >
                  {session.can_send_gps ? <Radio size={21} /> : <ShieldCheck size={21} />}
                </span>
              </div>

              <div className="mt-5 rounded-lg border border-warmWhite/10 bg-warmWhite/[0.055] p-4">
                <p className="text-sm font-semibold text-white">Condiciones de uso</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-warmWhite/66">
                  <li>- La ubicacion se envia solo durante esta jornada temporal.</li>
                  <li>- Debes aceptar consentimiento antes de enviar GPS real.</li>
                  <li>- Puedes negar el permiso del navegador cuando lo solicite.</li>
                  <li>- El sistema no usa servicios externos de rastreo.</li>
                </ul>
              </div>

              {!secureContext && (
                <div className="mt-4 flex items-start gap-3 rounded-lg border border-alertAmber/30 bg-alertAmber/10 p-4 text-alertAmber">
                  <AlertTriangle className="shrink-0" size={20} />
                  <p className="text-sm font-semibold">GPS real requiere HTTPS o localhost seguro.</p>
                </div>
              )}

              {!session.consent_at ? (
                <div className="mt-5 grid gap-4">
                  <label>
                    <span className="text-sm font-semibold text-warmWhite/66">Nombre del piloto</span>
                    <input
                      type="text"
                      value={consentName}
                      onChange={(event) => setConsentName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-warmWhite/10 bg-graphiteSoft px-3 py-3 text-sm text-white outline-none transition focus:border-emeraldTech/45"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={acceptConsent}
                    disabled={busy || !session.is_active}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <CheckCircle2 size={18} />
                    Acepto compartir ubicacion
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={sendRealLocation}
                  disabled={busy || !session.can_send_gps}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldTech px-4 py-3 text-sm font-bold text-graphite shadow-glow disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <LocateFixed size={18} />
                  Enviar ubicacion real
                </button>
              )}

              <p className="mt-4 text-sm leading-6 text-warmWhite/64">{message}</p>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
