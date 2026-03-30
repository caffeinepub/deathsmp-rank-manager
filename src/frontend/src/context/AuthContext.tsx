import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createActorWithConfig } from "../config";

export interface AuthUser {
  email: string;
  password: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string, role: string) => void;
  logout: () => void;
  isLoading: boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "deathsmp_auth";
// Poll every 10s for all logged-in users to catch both grants and revocations
const ROLE_POLL_INTERVAL = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userEmail = user?.email ?? null;

  useEffect(() => {
    async function init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AuthUser = JSON.parse(stored);
          setUser(parsed);
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
    }
    init();
  }, []);

  const refreshRole = useCallback(async () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed: AuthUser = JSON.parse(stored);
      const actor = await createActorWithConfig();
      const result = await (actor as any).checkUserRole(
        parsed.email,
        parsed.password,
      );
      if (result.ok) {
        const freshUser: AuthUser = { ...parsed, role: result.role };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
        setUser(freshUser);
      }
    } catch {
      // ignore
    }
  }, []);

  // Keep a ref so the interval callback always uses the latest refreshRole
  const refreshRoleRef = useRef(refreshRole);
  refreshRoleRef.current = refreshRole;

  // Poll role for ALL logged-in users.
  // This catches both: admin being granted (overlay disappears) and
  // admin being revoked (overlay appears instantly without re-login).
  useEffect(() => {
    if (!userEmail) return;
    const interval = setInterval(() => {
      refreshRoleRef.current();
    }, ROLE_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [userEmail]);

  const login = (email: string, password: string, role: string) => {
    const u: AuthUser = { email, password, role };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, isLoading, refreshRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
