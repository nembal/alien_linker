"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useAlien } from "@alien_org/react";
import { getAuthToken } from "@/lib/dev-auth";

interface AuthContextValue {
  token: string | null;
  isBridgeAvailable: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  token: null,
  isBridgeAvailable: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { authToken, isBridgeAvailable } = useAlien();

  const value = useMemo<AuthContextValue>(() => {
    let token: string | null = null;
    try {
      token = getAuthToken(authToken);
    } catch {
      // No token available
    }
    return { token, isBridgeAvailable };
  }, [authToken, isBridgeAvailable]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
