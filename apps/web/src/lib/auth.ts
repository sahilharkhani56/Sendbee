import { create } from "zustand";
import type { AuthUser, AuthTenant } from "@/types";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  tenant: AuthTenant | null;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser, tenant: AuthTenant) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  tenant: null,

  setTokens: (access, refresh) => {
    set({ accessToken: access });
    // Store refresh token in httpOnly cookie via API response (set-cookie header)
    // Also store in localStorage as fallback for client-side hydration
    if (typeof window !== "undefined") {
      document.cookie = `refreshToken=${refresh}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    }
  },

  setUser: (user, tenant) => {
    set({ user, tenant });
  },

  clearAuth: () => {
    set({ accessToken: null, user: null, tenant: null });
    if (typeof window !== "undefined") {
      document.cookie = "refreshToken=; path=/; max-age=0";
    }
  },
}));
