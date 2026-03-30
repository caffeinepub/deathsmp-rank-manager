import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
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
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "deathsmp_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: AuthUser = JSON.parse(stored);
          // Set user immediately with cached role so UI doesn't flicker
          setUser(parsed);
          // Re-verify role from backend to pick up any role changes (e.g. admin granted)
          try {
            const actor = await createActorWithConfig();
            const result = await (actor as any).loginUser(
              parsed.email,
              parsed.password,
            );
            if (result.ok) {
              const freshUser: AuthUser = { ...parsed, role: result.role };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(freshUser));
              setUser(freshUser);
            }
          } catch {
            // Backend unavailable, keep cached role
          }
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
    }
    init();
  }, []);

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
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
