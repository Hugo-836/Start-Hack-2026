import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DemoSession = {
  email: string;
  studentId: string;
};

type DemoAuthContextValue = {
  session: DemoSession | null;
  isAuthenticated: boolean;
  login: (session: DemoSession) => void;
  logout: () => void;
};

const DEMO_AUTH_STORAGE_KEY = "studyond-demo-session";
const DEMO_AUTH_EVENT = "studyond:demo-auth-updated";

const DemoAuthContext = createContext<DemoAuthContextValue | null>(null);

function readStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoSession;
    if (!parsed?.studentId || !parsed?.email) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredSession(session: DemoSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (session) {
    window.sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(DEMO_AUTH_EVENT));
}

export function DemoAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<DemoSession | null>(() => readStoredSession());

  useEffect(() => {
    const syncSession = () => setSession(readStoredSession());
    window.addEventListener(DEMO_AUTH_EVENT, syncSession);
    window.addEventListener("storage", syncSession);

    return () => {
      window.removeEventListener(DEMO_AUTH_EVENT, syncSession);
      window.removeEventListener("storage", syncSession);
    };
  }, []);

  const value = useMemo<DemoAuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      login: (nextSession) => {
        writeStoredSession(nextSession);
        setSession(nextSession);
      },
      logout: () => {
        writeStoredSession(null);
        setSession(null);
      },
    }),
    [session],
  );

  return <DemoAuthContext.Provider value={value}>{children}</DemoAuthContext.Provider>;
}

export function useDemoAuth() {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error("useDemoAuth must be used within DemoAuthProvider");
  }
  return context;
}

export function getCurrentStudentId() {
  return readStoredSession()?.studentId || null;
}
