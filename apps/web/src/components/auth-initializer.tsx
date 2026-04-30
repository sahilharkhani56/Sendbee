"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import type { AuthUser, AuthTenant } from "@/types";

interface MeResponse {
  user: AuthUser;
  tenant: AuthTenant;
}

export function AuthInitializer() {
  const { accessToken, setUser } = useAuthStore();

  useEffect(() => {
    // Try to hydrate auth from refresh token on mount
    async function hydrate() {
      const refreshToken = document.cookie.match(
        /(?:^|; )refreshToken=([^;]*)/
      )?.[1];
      if (!refreshToken) return;

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/v1/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          }
        );
        if (!res.ok) return;

        const data = await res.json();
        useAuthStore
          .getState()
          .setTokens(data.accessToken, data.refreshToken);

        // Fetch user info
        const me = await apiFetch<MeResponse>("/auth/me");
        setUser(me.user, me.tenant);
      } catch {
        // Silent fail — user will be redirected to login by middleware
      }
    }

    if (!accessToken) {
      hydrate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect/disconnect socket based on auth state
  useEffect(() => {
    if (accessToken) {
      connectSocket(accessToken);
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [accessToken]);

  return null;
}
