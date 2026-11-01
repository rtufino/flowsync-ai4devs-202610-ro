import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "../api/client.ts";
import type { User } from "../api/client.ts";

const TOKEN_KEY = "flowsync.token";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage unavailable: the session just won't survive a reload
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(readToken);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => readToken() !== null);

  // Restore the session from the stored token on first load.
  useEffect(() => {
    const stored = readToken();
    if (!stored) return;

    let cancelled = false;
    api
      .profile(stored)
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch((error) => {
        // Only drop the token when the server rejects it, not on network errors.
        if (error instanceof ApiError && error.status === 401) {
          writeToken(null);
          if (!cancelled) setToken(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    writeToken(result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const current = token;
    writeToken(null);
    setToken(null);
    setUser(null);
    if (current) {
      await api.logout(current).catch(() => undefined);
    }
  }, [token]);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
