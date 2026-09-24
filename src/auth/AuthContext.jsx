import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  AUTH_STORAGE_KEY,
  getCurrentUser,
  loginWithCredentials,
  logoutSession,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [user, setUser] = useState(() => readStoredSession()?.user || null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    if (!session?.access_token) {
      setBootstrapping(false);
      return undefined;
    }

    const controller = new AbortController();
    getCurrentUser(controller.signal)
      .then((currentUser) => {
        const refreshedSession = { ...session, user: currentUser };
        setUser(currentUser);
        setSession(refreshedSession);
        writeStoredSession(refreshedSession);
      })
      .catch(() => {
        clearStoredSession();
        setSession(null);
        setUser(null);
      })
      .finally(() => setBootstrapping(false));

    return () => controller.abort();
  }, []);

  async function login(username, password) {
    const controller = new AbortController();
    const nextSession = await loginWithCredentials(
      { username: username.trim(), password },
      controller.signal,
    );
    writeStoredSession(nextSession);
    setSession(nextSession);
    setUser(nextSession.user);
    return nextSession.user;
  }

  async function logout() {
    const controller = new AbortController();
    try {
      if (session?.access_token) {
        await logoutSession(controller.signal);
      }
    } catch {
      // Si FastAPI esta apagado, la sesion local del navegador igual se limpia.
    } finally {
      clearStoredSession();
      setSession(null);
      setUser(null);
    }
  }

  const value = useMemo(
    () => ({
      bootstrapping,
      isAuthenticated: Boolean(session?.access_token && user),
      login,
      logout,
      session,
      user,
    }),
    [bootstrapping, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }
  return context;
}

function readStoredSession() {
  try {
    const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session) {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
